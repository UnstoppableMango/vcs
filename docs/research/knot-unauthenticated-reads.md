# What a browser can read from the knot without logging in

Research for [#116](https://github.com/UnstoppableMango/vcs/issues/116) (parent map: #115, a custom landing page for `knot.thecluster.io`).

**Source.** Upstream Tangled's Rust knot (`knot-rs`, "knot 2") as mirrored at [github.com/tsirysndr/core](https://github.com/tsirysndr/core), commit `afc044753d21eb4a0bfe10f3249a114ad67862fe` (2026-08-20).
Paths below are relative to that repo, so `knot2/...` is the knot and `lexicons/...` is the workspace lexicon set the knot compiles from (`knot2/crates/knot-lexicons/build.rs:25-28`).
tangled.org and the live knot can't be reached from the sandbox this was written in, so everything here comes from reading the source. Nothing was checked against the running server.

## Answer

- Every read the landing page needs is a plain, unauthenticated `GET` XRPC query under `/xrpc/`. None of the read handlers takes a bearer token or calls the auth helpers (`knot2/crates/knot-xrpc/src/reads.rs`, `lists.rs`, `service.rs`). Auth (`bearer()`, `knot2/crates/knot-xrpc/src/lib.rs:386-395`) is only used by the write procedures.
- The knot sends **no CORS headers at all**. There's no `cors` or `access-control` anywhere in the knot crates. A page served from the same origin (`/` via `homepage.path`) needs none. A page on any other origin can't read these responses.
- The knot also adds **no global CSP** to `/`. The only CSP it sets is on raw blob responses (`reads.rs:58`, `reads.rs:728,744`). So an inline `<script>` in the homepage file runs.
- **Listing repos**: `sh.tangled.sync.listRepos` returns repo **DIDs**, their default branch and head SHA. It doesn't return names.
- **DID → owner**: `sh.tangled.repo.describeRepo?repoDid=` returns `ownerDid` and `rkey`. The knot does keep the repo's name in memory (`knot2/crates/knot-index/src/projections.rs:414-428`), but no read endpoint returns it.
- **Human name, description, topics, website**: these live only in the owner's PDS `sh.tangled.repo` record (`lexicons/repo/repo.json:17-48`). Fetching them means two cross-origin calls: resolve the owner DID document (PLC or did:web) to get the handle and PDS, then call `com.atproto.repo.getRecord`. The appview isn't needed.
- **Rate limits**: all of these XRPC reads share one pre-auth token bucket per client IP. By default that's a burst of 20, refilling one every 100 ms (about 10/s), with 8 requests in flight per IP. A page that fans out N+1 calls per repo has to keep under it.

## Router: what is mounted

`knot2/crates/knot-server/src/main.rs:615-648` builds the HTTP app from four pieces:

1. Git smart-HTTP routes from `knot_pack::edge_routes` (`main.rs:615-624`).
2. `knot_xrpc::router` (`main.rs:632`).
3. `GET /.well-known/did.json`, the knot's own `did:web` document (`main.rs:632-638`).
4. The homepage at `/` (`main.rs:643-647`). It's either the built-in placeholder (`knot2/crates/knot-server/src/homepage.html`), `ServeFile::new(path)` when `homepage.path` is set, or nothing when `homepage.enabled = false` (`knot2/example.toml:444-450`; README "The homepage is replaceable").

`ServeFile` serves exactly `/`, so any assets the page needs have to be inlined. That matches the single-file design.

The XRPC router is `knot2/crates/knot-xrpc/src/lib.rs:270-341`. Every route registered before line 331 sits behind the `enforce_pre_auth_limit` layer (`lib.rs:332-335`), and that includes all the reads at `lib.rs:303-330`. `/xrpc/_health` and `/events` are merged after that layer (`lib.rs:338-339`), so the limiter doesn't cover them.

## Read endpoints (all `GET`, no auth)

Route constants are in `knot2/crates/knot-xrpc/src/reads.rs:35-49`, `lists.rs:20-21`, `service.rs:13-15` and `events.rs:21`.

### Knot-level

| Endpoint | Params | Returns | Source |
| --- | --- | --- | --- |
| `/xrpc/_health` | none | `{"version":"knot <crate version>"}`, or 503 when the LFS store isn't writable | `service.rs:30-46` |
| `/xrpc/sh.tangled.knot.version` | none | `{"version":"v1.15.0","capabilities":["knot-acl","repo-did-input"]}` | `service.rs:17-23,53-59` |
| `/xrpc/sh.tangled.owner` | none | `{"owner":"<did>"}`, the first DID in `server.admins` | `service.rs:61-68` |
| `/xrpc/sh.tangled.sync.listRepos` | `limit` (default 50, max 1000), `cursor` (integer offset), `order` (`desc` default, or `asc`) | `{"repos":[{"repo":"<repoDid>","status":"active","defaultBranch":{"ref":"refs/heads/main","head":"<sha>"}}],"cursor":"<next offset>"}` | `reads.rs:1651-1714` |
| `/xrpc/sh.tangled.knot.listMembers` | `subject` (required, must parse as any account DID; it isn't otherwise used), `limit` (max 1000), `cursor`, `order` | `{"items":[{"subject":"<did>","addedBy":"<did>","createdAt":"..."}],"cursor":...}` | `lists.rs:26-34,66-83,102-116,150-160` |
| `/.well-known/did.json` | none | the knot's `did:web` document | `main.rs:632-638` |
| `/events` | `cursor` | WebSocket stream of `sh.tangled.git.refUpdate`, `sh.tangled.knot.memberUpdate` and `sh.tangled.repo.collaboratorUpdate` | `events.rs:30-60`; `knot2/crates/knot-events/src/lib.rs:41-47,147,262,291` |

`listRepos` details:

- It returns `ProjectionWarming` (503) while the index rebuilds at startup (`reads.rs:1680-1682`; `error.rs:54-60`).
- `status` is always `"active"`.
- `order` sorts by registration order (`hosted_repos()`), not by activity.

`/events` details:

- The event log is an in-memory ring buffer (`knot-events/src/lib.rs:348,425-460`; bounds set in `main.rs:441-447`), so it only replays recent events.
- `refUpdate` carries `repo`, `ownerDid`, `committerDid`, `ref`, `oldSha`/`newSha` and an optional `meta` with language breakdown (`knot-events/src/lib.rs:85-101,151-160`).
- It's usable for a live "recent pushes" feed. It has a subscriber cap (`events.rs:42-48`).

### Per-repo

The `repo` parameter is either a repo DID, or `<ownerDid>/<rkey>`. It must start with `did:`, so a handle won't work here (`knot2/crates/knot-xrpc/src/query.rs:118-147`).
Resolution goes through the in-memory index (`reads.rs:125-150`). Unknown repos return 404 `RepoNotFound`.
`ref` defaults to `HEAD`. Refs that aren't reachable from a public ref get `RefNotFound`, so hidden or staging refs don't leak (`reads.rs:156-177`).

| Endpoint | Params | Returns | Source |
| --- | --- | --- | --- |
| `sh.tangled.repo.describeRepo` | `repoDid` (a DID only) | `{"repoDid","ownerDid","rkey"}` | `reads.rs:1539-1574` |
| `sh.tangled.repo.getDefaultBranch` | `repo` | `{"name":"main","hash":"","when":"1970-..."}`. Only `name` is filled in | `reads.rs:1496-1537` |
| `sh.tangled.git.listRefs` | `repo`, `limit` (default 100, max 1000), `cursor` | `{"refs":[{"ref","sha"}],"cursor","defaultBranch":{"ref","head"}}`, public refs only | `reads.rs:1582-1649` |
| `sh.tangled.repo.branches` | `repo`, `limit` (default 50, max 100), `cursor` | `{"branches":[{"reference":{name,hash},"commit":{...author, committer, message...},"is_default"}]}` | `reads.rs:453-506`; `wire.rs:178-200` |
| `sh.tangled.repo.branch` / `.tags` / `.tag` | `repo` plus `branch` / `tag`, paging for `tags` | branch tip commit, or tags (annotated tags include the tagger) | `reads.rs:508-655`; `wire.rs:242-264` |
| `sh.tangled.repo.tree` | `repo`, `ref`, `path` | `{"ref","parent","dotdot","files":[{"name","mode","size","last_commit"?}],"lastCommit","readme":{"filename","contents"}}` | `reads.rs:225-389` |
| `sh.tangled.repo.log` | `repo`, `ref`, `path`, `limit` (default 50, max 100), `cursor` (offset) | `{"commits":[CommitWire],"ref","log":true,"total","page","per_page"}` | `reads.rs:391-452`; `wire.rs:99-121` |
| `sh.tangled.repo.blob` | `repo`, `ref`, `path` (required), `raw` | JSON `{"ref","path","content","encoding":"utf-8"\|"base64","size","isBinary","mimeType","lastCommit"}` or a `submodule` object. With `raw`, the bytes themselves | `reads.rs:657-877` |
| `sh.tangled.repo.languages` | `repo`, `ref` | `{"ref","languages":[{"name","size","percentage"}],"totalSize","totalFiles"}`, sorted by size | `reads.rs:1434-1494` |
| `sh.tangled.repo.diff` / `.compare` | `repo` plus refs | a commit diff, or a format-patch series (capped at 500 commits) | `reads.rs:880-1204`; `MAX_COMPARE_COMMITS` at `reads.rs:57` |
| `sh.tangled.repo.archive` | `repo`, `ref`, `format`, `prefix` | a tarball or zip download (`Content-Disposition: attachment`) that works as a plain link | `reads.rs:1206-1432` |
| `sh.tangled.repo.listCollaborators` | `subject` (repo DID), paging | same `items` shape as `listMembers` | `lists.rs:162-186` |

README notes:

- `tree` already includes the README of the directory it lists. It picks the first file named `README` or `README.<ext>` with a single extension, case-insensitive (`reads.rs:279-286`).
- It only returns that README when it's valid UTF-8 and no bigger than `response_limit / 8`. That's 640 KiB at the default 5 MiB (`reads.rs:92-94,288-317`). Otherwise `readme` comes back with empty strings.
- The README is raw markdown. The page has to render it itself.

### Size caps and budgets

- JSON responses are capped by `xrpc.max_response_bytes`, default 5 MiB (`knot2/example.toml:174-176`). Above that the knot returns 413 `RequestTooLarge` (`reads.rs:183-222`).
- JSON `blob` is capped at `min(25 MiB, response_limit * 3/4)`, about 3.75 MiB by default. `raw` blobs are capped at 25 MiB. Past either cap the knot returns 413 `BlobTooLarge` (`reads.rs:56,77-90,820-823`).
- `raw` only serves `image/*`, `video/*` and textual MIME types. Anything else gets 403 (`reads.rs:712-755`).
- Text comes back as `text/plain; charset=utf-8`.
- Every `raw` response carries `nosniff` and `CSP: default-src 'none'; style-src 'unsafe-inline'; sandbox`.
- Images and video get an ETag. That's fine for `<img src="/xrpc/sh.tangled.repo.blob?...&raw=true">`.
- Archives are capped by `max_archive_bytes`, default 1 GiB (`example.toml:178-187`).
- `tree`, `blob` and `languages` work on time budgets: last-commit lookups get 300 ms for tree and 2000 ms for blob, and language analysis gets 1000 ms (`example.toml:189-199`; `reads.rs:327,768,1466`). When the budget runs out the extra fields are dropped. The request doesn't fail.

### Rate limits

All XRPC reads go through `enforce_pre_auth_limit` (`lib.rs:343-377`). It allows, per client IP:

- `preauth_burst = 20`
- `preauth_refill_ms = 100` (one token per 100 ms)
- `per_peer_inflight = 8`
- `global_inflight = 64`

These are the defaults at `example.toml:222-236`. When the limit is hit the knot returns 429 `RateLimitExceeded` or 503 `Overloaded` (`error.rs:70-76`).

There's also a listener-level limit of 50/s with a burst of 200 (`example.toml:26-32`).

The client IP only comes from a proxy header when `xrpc.trusted_proxy_header` and `trusted_proxies` are set (`example.toml:278-292`; README "TLS"). Otherwise every visitor behind our ingress shares one bucket. That matters for a landing page that makes several calls per repo.

## Git smart HTTP (also unauthenticated for reads)

`knot2/crates/knot-pack/src/lib.rs:434-480`:

- `GET /{owner}/{name}/info/refs` and `GET /{repoDid}/info/refs`
- `POST .../git-upload-pack` and `POST .../git-upload-archive`

Here `{owner}` can be a DID or a handle. The handle is resolved through atproto (`main.rs:612-614`), and `{name}` is resolved by name or rkey (`knot2/crates/knot-index/src/projections.rs:477-501`).
These are for `git clone`, not for a browser. The responses are pkt-line, and nothing in them maps a DID back to a name. Their only use on the landing page is building clone URLs: `https://knot.thecluster.io/<handle>/<name>` or `.../<repoDid>` (README "Clone URLs").

## Turning repo DIDs into names and owners

Knot 2's model:

- A repo has its own DID (`did:plc`, or a supplied `did:web`).
- The owner also publishes a `sh.tangled.repo` record in their own PDS. The record key there is the `rkey` the knot stores (`lexicons/repo/create.json`, input properties `rkey`, `name`, `repoDid`).

The record holds the fields the landing page wants (`lexicons/repo/repo.json:17-66`):

- `name`, described as "Cosmetic name of the repo"
- `description` (1–140 graphemes)
- `website` (a URI, the GitHub mirror link)
- `topics` (at most 50, each 1–50 chars)
- `source`, `spindle`, `labels`, `repoDid`, `createdAt`

The knot keeps none of the descriptive fields. It does keep the name: the registry projection stores `(owner, rkey, name, created_at)` per repo (`projections.rs:414-428`) and uses it to resolve clone paths. But no read endpoint returns it.

So the browser's chain is:

1. `GET /xrpc/sh.tangled.sync.listRepos?limit=1000` lists the repo DIDs (same origin).
2. `GET /xrpc/sh.tangled.repo.describeRepo?repoDid=<did>`, once per repo, gives `ownerDid` and `rkey` (same origin).
3. Resolve `ownerDid` to its DID document. For `did:plc` that's `GET https://plc.directory/<did>`. For `did:web` it's `https://<host>/.well-known/did.json`. The document gives `alsoKnownAs` (`at://<handle>`) and the `#atproto_pds` service endpoint (the PDS). This call is cross-origin.
4. `GET <pds>/xrpc/com.atproto.repo.getRecord?repo=<ownerDid>&collection=sh.tangled.repo&rkey=<rkey>` returns `name`, `description`, `topics` and `website`. This call is cross-origin. With few owners (here, mostly one), `com.atproto.repo.listRecords?collection=sh.tangled.repo` is one call per owner instead of one per repo. Match records to repos by `repoDid` or rkey.

The handle should be checked two ways (handle → DID), but a cosmetic landing page can skip that.

Steps 3 and 4 depend on other servers' CORS. **That isn't verified here.** The knot source says nothing about it. From general knowledge, `plc.directory` and the reference atproto PDS both send `Access-Control-Allow-Origin: *`, but check that against `curl -I` from an unrestricted network before relying on it.

If cross-origin calls are undesirable, there are two fallbacks:

- Hard-code the owner's handle and PDS in the page. There's one owner here.
- Show the rkey, and the DID as a fallback, when the PDS call fails.

The appview isn't needed. The workspace does define appview-style lexicons (`lexicons/repo/getRepo.json`, `getRepoByRepoDid.json`, `listRepos.json`), but the knot doesn't route them (`lib.rs:270-341`), and no handler for them turned up in the mirror's `appview/` tree. The appview is also another origin, with CORS this research didn't check.

## Caveats

- The source is a third-party mirror pinned to one commit. Before building against it, check `/xrpc/sh.tangled.knot.version` and `/xrpc/_health` on the live knot to confirm it's knot-rs at a compatible version.
- Several response field names copy the Go knot's wire format (`per_page`, `is_default`, `last_commit` next to `lastCommit`). Read the shapes off a live response rather than the lexicons.
- `getDefaultBranch` leaves `hash` empty and `when` at the epoch (`reads.rs:1527-1532`). Use `listRepos`, `listRefs` or `branches` for the head SHA.
