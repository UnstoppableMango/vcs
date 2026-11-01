# Who consumes cairn's flake, and what flake ref works for a Tangled home?

Research for [#104](https://github.com/UnstoppableMango/vcs/issues/104) on the cairn-to-Tangled map ([#99](https://github.com/UnstoppableMango/vcs/issues/99)).
Gathered 2026-11-01.

Sources are pinned so the claims can be checked later:

| Source | Pin |
| --- | --- |
| `UnstoppableMango/nixos` | `b729dd8a30ec9f77e36dd37486e60ca0f8df99b6` (HEAD on 2026-11-01) |
| `UnstoppableMango/cairn` | `cfd21652d9e427635063ae6e0cad5c66bfb0fcf3` (HEAD on 2026-11-01) |
| `UnstoppableMango/the-cluster` | `0565a9a10e28f2184f5bc89b0c013bf3660cdb4b` (HEAD on 2026-11-01) |
| Tangled core (`tangled.org/core`) | `v1.16.1-alpha`, commit `1d379a324497da39a27e49453c72615607a9b199`, fetched as the Go module zip from `proxy.golang.org` |
| Nix | `NixOS/nix` master `8c8e8b8d19491782136e80d6fb598436922ccda2` |
| Gitea | `go-gitea/gitea` tag `v28.2.0`, the image tag the-cluster runs |
| Git | `git/git` master `Documentation/` |

Two gaps in the sourcing.
`tangled.org` raw files and `knot.thecluster.io` were unreachable from this sandbox, so nothing here was tested against the running knot.
`v1.20.0` of Tangled core is published but the Go proxy can't build its zip (file names with `:` in `localinfra/fixtures`), so the Tangled claims come from `v1.16.1-alpha`; check the knot chart's version against them before relying on the details.

## 1. Who consumes cairn

GitHub code search (`cairn user:UnstoppableMango`, `"UnstoppableMango/cairn"`, `cairn org:unmango`, plus `filename:flake.nix` / `filename:flake.lock` filters) finds one external flake consumer.
Code search covers default branches only.

### The one flake consumer: `UnstoppableMango/nixos`

- `flake.nix` declares `cairn.url = "github:UnstoppableMango/cairn";` with `nixpkgs`, `systems`, `flake-parts`, `treefmt-nix` and `clan-core` all set to `follows` ([flake.nix L90-97](https://github.com/UnstoppableMango/nixos/blob/b729dd8a30ec9f77e36dd37486e60ca0f8df99b6/flake.nix#L90-L97)).
  It imports `cairn.flakeModules.default` and sets `cairn.clusters.rosequartz = import ./clan/rosequartz-cluster.nix;` (same file, L140 and L148).
- `flake.lock` has `original = { type = "github"; owner = "UnstoppableMango"; repo = "cairn"; }`, with no ref, and is locked to `rev = a2d5a75855df8336c458463c26fa9f972147c500` with `type = "github"` ([flake.lock](https://github.com/UnstoppableMango/nixos/blob/b729dd8a30ec9f77e36dd37486e60ca0f8df99b6/flake.lock)).
  That rev is behind cairn's HEAD (`cfd2165`), so the lock already trails cairn.
- Every `rosequartz-*` clan service comes from that input (`AGENTS.md` L28, L94, L135, L167; `clan.nix` L242; `.github/skills/code-review/SKILL.md` L10, L34, L63).
  `clan/rosequartz-cluster.nix` L284-292 links cairn issues `UnstoppableMango/cairn#93` and `#96` in comments.
- `README.md` L9 links `https://github.com/UnstoppableMango/cairn`.
- Lock updates come from Renovate: `.github/renovate.json` extends `github>UnstoppableMango/renovate-config`, which turns on the `nix` manager and `lockFileMaintenance` on a weekly schedule, before 4am ([renovate-config default.json](https://github.com/UnstoppableMango/renovate-config/blob/HEAD/default.json)).

### References that aren't flake inputs

| Repo | Reference | Ties to GitHub? |
| --- | --- | --- |
| `cairn` itself | `examples/{single-node,ha-cluster}/flake.nix`: `cairn.url = "path:../.."` (locks say `type = "path"`) | No |
| `cairn` itself | `docs/USAGE.md` L53 tells consumers to write `cairn.url = "github:UnstoppableMango/cairn";`, and `examples/single-node/README.md` L22 says the same | Docs only |
| `cairn` itself | `pkgs/upgrade/go.mod`: `module github.com/UnstoppableMango/cairn/pkgs/upgrade` | Go module path, which resolves through the GitHub mirror |
| `cairn` itself | `README.md` badges for GitHub Actions, shields.io and Hercules CI (`hercules-ci.com/.../github/account/UnstoppableMango/project/cairn`) | Yes, CI is bound to the GitHub repo |
| `the-cluster` | `docs/harbor-plan.md` L27 ("cairn: Flake input"), `docs/musl-dns-ndots.md`, `docs/nested-containers.md`, `docs/adr/0001-nixery.md` | Prose about the nixos input; the-cluster has no cairn input |
| `hosts` | `README.md` L8: provisioning "moved to UnstoppableMango/nixos (clan + cairn)" | Prose |
| `vcs` | `github/repositories/homelab.ts` L15 (the `PublicRepo` for cairn); commented-out `gitlab/unmango/homelab/index.ts` L14 | Declares the GitHub repo |
| `github` | `repositories/homelab.ts` L7 and `index.ts` L14/L249 also declare `new PublicRepo("cairn", ...)` | A second Pulumi program declaring the same GitHub repo, worth a look during the move |

`cairn org:unmango` returns nothing.
`pki` matched the broad search, but its `AGENTS.md` and `docs/ceremony/README.md` return 404 on `HEAD`, so it's a stale index hit.

## 2. Flake ref forms for a repo on `knot.thecluster.io`

### What the knot serves

From `knotserver/router.go` (`Router()`) in Tangled core `v1.16.1-alpha`:

- Git smart HTTP for reads: `GET /{did}/{name}/info/refs`, `POST /{did}/{name}/git-upload-pack`, `POST /{did}/{name}/git-upload-archive`.
  There is also a form with no name, `/{did}/info/refs` and so on, for a repo DID.
- `/{did}` can be a DID or a handle.
  The `resolveDidRedirect` middleware resolves a handle (with or without the leading `@`) and answers **307** to the same path under the DID (`router.go`, `resolveDidRedirect`).
- `git-receive-pack` over HTTP always answers 403 with "Pushes are only supported over SSH." (`knotserver/git.go`, `RejectPush`).
  HTTP is read-only, which a flake consumer doesn't mind.
- Repo paths resolve as a repo DID, then an `(owner DID, name)` alias, then `<scanPath>/<did>/<name>` on disk (`git.go`, `resolveRepoPath`).
- An unauthenticated tarball/zip endpoint: `GET /xrpc/sh.tangled.repo.archive?repo=<did>/<name>&ref=<ref>[&format=tar.gz|zip][&prefix=...]` (`knotserver/xrpc/xrpc.go` registers it under "repo query endpoints (no auth required)"; handler in `knotserver/xrpc/repo_archive.go`).
  - `repo` must start with `did:`, so handles aren't accepted here (`xrpc.go`, `parseRepoParam`).
  - The default format is `tar.gz`, and only `tar.gz` and `zip` are accepted, even though the lexicon `lexicons/repo/archive.json` lists more.
  - It shells out to `git archive --format=<fmt> [--prefix=<repo>-<ref>/] <commit-hash>` (`knotserver/git/cmd.go`, `WriteArchive`).
    Because it passes a commit hash, every entry's mtime is the commit time ([git-archive docs](https://github.com/git/git/blob/master/Documentation/git-archive.adoc), "when a commit ID or tag ID is provided, the commit time ... is used").
  - It sets `Link: <https://<hostname>/xrpc/sh.tangled.repo.archive?format=...&prefix=...&ref=<commit sha>&repo=...>; rel="immutable"` (`repo_archive.go`, `buildImmutableLink`).
    That is Nix's Lockable HTTP Tarball protocol, covered below.
- The appview (`tangled.org`) also proxies these routes.
  `/{user}/{repo}/info/refs`, `git-upload-pack` and `git-upload-archive` answer 307 to `https://<knot>/<repo identifier>/...` (`appview/state/router.go`, `appview/state/git_http.go`).
  `/{user}/{repo}/archive/{ref}` serves an archive from Tangled's **knotmirror**, not from our knot, and rewrites the immutable link to `https://tangled.org/<repo identifier>/archive/<sha>.tar.gz` (`appview/repo/router.go`, `appview/repo/archive.go`, `knotmirror/xrpc/git_get_archive.go`).
- Over SSH, the knot runs `guard` as an `authorized_keys` forced command: the connecting key maps to a user DID, which `/guard` checks for the repo and the `git-upload-pack`/`git-receive-pack` command (`guard/guard.go`, `knotserver/internal.go`).
  SSH needs a key the knot knows.
  It is also LAN-only for us: the-cluster puts SSH on MetalLB `10.0.69.210`, "LAN-only until port 22 is forwarded", while HTTP goes through the Cloudflare tunnel at `knot.thecluster.io` ([apps/knot/helm-release.yml](https://github.com/UnstoppableMango/the-cluster/blob/0565a9a10e28f2184f5bc89b0c013bf3660cdb4b/apps/knot/helm-release.yml), [httproute.yml](https://github.com/UnstoppableMango/the-cluster/blob/0565a9a10e28f2184f5bc89b0c013bf3660cdb4b/apps/knot/httproute.yml)).
  The knot's admin DID there is `did:plc:npefy3bubltqewdfhah5i5ef`.

### What Nix accepts

From the Nix manual ([`src/nix/flake.md`](https://github.com/NixOS/nix/blob/8c8e8b8d19491782136e80d6fb598436922ccda2/src/nix/flake.md), "Types") and the fetcher source:

- `git` type: `git(+http|+https|+ssh|+git|+file):(//<server>)?<path>(\?<params>)?`, with `ref`, `rev`, `dir` and `shallow=1`.
  `ref` defaults to `HEAD`.
  Nix fetches a remote Git repo by running the `git fetch` CLI (`src/libfetchers/git-utils.cc`, `GitRepoImpl::fetch`).
  Git follows redirects on the initial request by default (`http.followRedirects` defaults to `initial`, and git rebases follow-up requests on the redirected URL; [git config/http.adoc](https://github.com/git/git/blob/master/Documentation/config/http.adoc)), so the knot's 307 from handle to DID works.
- `tarball` type: the scheme must be `tarball+http(s)://` unless the path ends in a known archive extension (`.zip`, `.tar`, `.tgz`, `.tar.gz`, `.tar.xz`, `.tar.bz2`, `.tar.zst`) (manual, and `TarballInputScheme::isValidURL` / `hasTarballExtension` in `src/libfetchers/tarball.cc`).
  The flake-input path parses with `requireTree = isFlake`, and `requireTree || hasTarballExtension` accepts extension-less URLs too (`src/libflake/flakeref.cc`, `tarball.cc`), but the explicit `tarball+https://` is clearer.
- Lockable HTTP Tarball protocol ([`doc/manual/source/protocols/tarball-fetcher.md`](https://github.com/NixOS/nix/blob/8c8e8b8d19491782136e80d6fb598436922ccda2/doc/manual/source/protocols/tarball-fetcher.md)): if the server returns `Link: <flakeref>; rel="immutable"`, `flake.lock` records that URL instead of the mutable one.
  The immutable URL may carry `rev`, `revCount`, `narHash` and `lastModified`.
  In `tarball.cc` (`TarballInputScheme::getAccessor`) the Link target is parsed with `Input::fromURL` (`requireTree` defaults to `true`, per `fetchers.hh`) and must come out as a `tarball` input.
  `lastModified` is the newest file mtime in the tarball.
  The manual names Gitea ≥ 1.22.1 and Forgejo ≥ 7.0.4/8.0.0 as servers that speak it, at `https://<domain>/<owner>/<repo>/archive/<ref>.tar.gz`.

### Ref forms that should work for cairn

With `<owner>` = `did:plc:npefy3bubltqewdfhah5i5ef` (or a handle where noted):

| Form | Works? | Notes |
| --- | --- | --- |
| `git+https://knot.thecluster.io/did:plc:npefy3bubltqewdfhah5i5ef/cairn` | Yes | Smart-HTTP upload-pack, public, through the tunnel. Lock is `type = "git"` with `rev` and `revCount`. Add `?ref=main` to pin the branch, `?shallow=1` for speed (this drops `revCount`). The DID form needs no handle resolution. |
| `git+https://knot.thecluster.io/@<handle>/cairn` | Yes, with a redirect | Knot answers 307 to the DID path, and git follows it. It depends on handle resolution working on the knot at fetch time. |
| `git+https://tangled.org/@<handle>/cairn` | Yes, with a redirect | Appview answers 307 to the knot. It adds a dependency on tangled.org and gains nothing. |
| `tarball+https://knot.thecluster.io/xrpc/sh.tangled.repo.archive?repo=did:plc:npefy3bubltqewdfhah5i5ef/cairn&ref=main` | Should work (from source, untested) | Fetches the archive directly, and the `Link: rel="immutable"` header gets a commit-pinned URL into `flake.lock`. The knot's immutable link carries the commit as `ref=`, not `rev=`, so the locked input has no `rev` and `inputs.cairn.rev`/`shortRev` are unset. `lastModified` comes from the commit time. `repo` must be a DID. |
| `https://tangled.org/@<handle>/cairn/archive/main.tar.gz` | Should work (from source, untested) | The Gitea-style lockable URL, but served from Tangled's knotmirror, so it depends on tangled.org and on the knotmirror having synced our knot. |
| `git+ssh://git@knot.thecluster.io/did:plc:.../cairn` | Not in general | SSH needs a key registered with the knot, and `knot.thecluster.io` goes through the HTTP-only Cloudflare tunnel; SSH is LAN-only on `10.0.69.210`. Not usable for CI or Renovate. |
| `github:UnstoppableMango/cairn` | Yes, through the mirror | See section 3. |

## 3. Can consumers keep `github:UnstoppableMango/cairn`?

Yes.
The `github` fetcher downloads a tarball of a ref from GitHub and doesn't care that the repo is a push mirror (Nix manual, `github` type), so `nixos`'s input and lock entry (`type = "github"`, `rev = ...`) keep working as long as the mirror has the commits.

How lag builds up, from Gitea `v28.2.0`, the image tag in [the-cluster `apps/gitea/helm-release.yml`](https://github.com/UnstoppableMango/the-cluster/blob/0565a9a10e28f2184f5bc89b0c013bf3660cdb4b/apps/gitea/helm-release.yml):

1. **Knot to Gitea pull mirror.**
   Defaults are `[mirror] DEFAULT_INTERVAL = 8h` and `MIN_INTERVAL = 10m` ([`modules/setting/mirror.go`](https://github.com/go-gitea/gitea/blob/v28.2.0/modules/setting/mirror.go)), and the-cluster's Gitea config doesn't override them.
   A repo's interval can be set as low as 10m, and `POST /repos/{owner}/{repo}/mirror-sync` forces a pull ([`routers/api/v1/api.go`](https://github.com/go-gitea/gitea/blob/v28.2.0/routers/api/v1/api.go) L1487).
2. **Gitea to GitHub push mirror.**
   When a pull-mirror sync updates refs, Gitea fires `notify_service.SyncPushCommits` ([`services/mirror/mirror_pull.go`](https://github.com/go-gitea/gitea/blob/v28.2.0/services/mirror/mirror_pull.go)).
   The mirror notifier handles that by queueing every push mirror with `sync_on_commit` set ([`services/mirror/notifier.go`](https://github.com/go-gitea/gitea/blob/v28.2.0/services/mirror/notifier.go), `syncPushMirrorWithSyncOnCommit` in `mirror_push.go`).
   With `sync_on_commit = true`, the push follows the pull within a queue hop, not another interval.
   Nothing in the push-mirror add path blocks a repo that is itself a pull mirror (`handleSettingsPostPushMirrorAdd` checks only `DisableNewPush` and archived, `routers/web/repo/setting/setting.go`).
3. **Consumer lock refresh.**
   `nixos` only moves when its `flake.lock` is updated.
   Renovate's `lockFileMaintenance` runs weekly before 4am, so in practice this step dwarfs steps 1 and 2.
   It already trails: the lock is on `a2d5a75` while cairn is at `cfd2165`.

So the worst case from knot push to GitHub is the pull interval (8h by default, 10m at the floor) plus a queue hop, assuming push mirrors are created with `sync_on_commit`.
For `nixos` that only matters for a hand-run `nix flake update cairn` right after a push.

## Bottom line for the ticket

- **Consumers:** one, `UnstoppableMango/nixos`, as `cairn.url = "github:UnstoppableMango/cairn"` (locked `type = "github"`), kept fresh by weekly Renovate lock maintenance.
  cairn's own examples use `path:../..`.
  The other GitHub ties are doc and README links, `docs/USAGE.md`'s recommended ref, the Go module path `github.com/UnstoppableMango/cairn/pkgs/upgrade`, the Hercules CI badge, and two Pulumi programs (`vcs` and `github`) both declaring the GitHub repo.
- **Tangled-home ref:** `git+https://knot.thecluster.io/did:plc:npefy3bubltqewdfhah5i5ef/cairn` (add `?ref=main` if wanted) works over the knot's public, read-only smart HTTP.
  Use the DID form rather than `@handle` to skip the redirect.
  A lockable tarball form also exists (`tarball+https://knot.thecluster.io/xrpc/sh.tangled.repo.archive?repo=<did>/cairn&ref=main`, which sends `Link: rel="immutable"`), but its lock has no `rev`, and it's untested.
  `git+ssh` isn't viable: the key must be known to the knot, and SSH is LAN-only.
- **Keeping `github:`:** yes, the design holds.
  The `github:` fetcher is indifferent to mirroring.
  Knot-to-GitHub lag is Gitea's pull-mirror interval (8h default, 10m minimum, or on demand via `mirror-sync`) plus a queue hop, provided the push mirror has `sync_on_commit`; the-cluster's Gitea doesn't override the interval today.
  Consumer lag is set by Renovate's weekly lock maintenance either way.
  If the move wants lower lag, set the pull mirror's interval to 10m in the Pulumi program; nixos needs no change.
