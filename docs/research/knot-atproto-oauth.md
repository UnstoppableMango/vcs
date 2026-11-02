# Can a static page on the knot log in with atproto OAuth?

Research for [#117](https://github.com/UnstoppableMango/vcs/issues/117), part of [#115](https://github.com/UnstoppableMango/vcs/issues/115).

## Answer

Yes. With two constraints, one self-contained HTML file served at `https://knot.thecluster.io/` can act as a public atproto OAuth browser client and call the knot's admin procedures as Erik:

1. **The client metadata document has to live on another host.** The knot serves exactly one file at `/`, and the `client_id` URL has to return `application/json`. Put the metadata at, for example, `https://thecluster.io/oauth/knot-client-metadata.json` or on GitHub Pages, with `redirect_uris: ["https://knot.thecluster.io/"]`. Neither the spec nor the reference authorization server requires a web client's `https` redirect URI to share an origin with the `client_id`.
2. **Granular `rpc` scopes have to use `aud=*`.** The knot accepts only a bare DID as the token `aud` (`did:web:knot.thecluster.io`). A granular `rpc` permission accepts only `*` or a `did#service` reference, and matches by exact string. So `rpc:<lxm>?aud=did:web:knot.thecluster.io` is invalid, and `aud=did:web:knot.thecluster.io%23…` produces tokens the knot rejects. Use `atproto rpc?lxm=sh.tangled.knot.addMember&lxm=…&aud=*`, or the broader `transition:generic`.

`/` works as the redirect URI. The default `fragment` response mode keeps the code out of requests to the server, and `@atproto/oauth-client-browser` detects the callback by matching origin and path against `redirect_uris`. The library bundles to about 208 KiB minified (58 KiB gzip) as one IIFE with no dynamic imports or workers, so it can be inlined.

I could not confirm Erik's PDS: `plc.directory` and every `*.bsky.*` host are blocked from this sandbox. the-cluster runs a PDS at `pds.thecluster.io` (`@atproto/pds` 0.5.37), which supports granular scopes, but nothing here shows whether Erik's account is hosted there or on bsky.social.

## Sources

- atproto OAuth spec: [atproto.com/specs/oauth](https://atproto.com/specs/oauth), read from `bluesky-social/atproto-website` at `f39e3b6`, `src/app/[locale]/specs/oauth/en.mdx`.
- atproto permission spec: [atproto.com/specs/permission](https://atproto.com/specs/permission), same commit, `src/app/[locale]/specs/permission/en.mdx`.
- `bluesky-social/atproto` at `34dbe24` (2026-11-01):
  - `packages/pds/src/api/com/atproto/server/getServiceAuth.ts`
  - `packages/pds/src/pipethrough.ts`
  - `packages/oauth/oauth-scopes/src/scopes/rpc-permission.ts`, `scope-permissions.ts`, `scope-permissions-transition.ts`, `scope-permissions.test.ts`
  - `packages/oauth/oauth-provider/src/client/client-manager.ts`
  - `packages/oauth/oauth-client-browser/src/*`, `README.md`
  - `packages/xrpc-server/src/auth.ts`
- npm: `@atproto/oauth-client-browser@0.5.11` (published 2026-10-27), bundled locally with esbuild 0.25.10.
- Knot: `tsirysndr/core` at `afc0447` (2026-08-20), `knot2/crates/{knot-atproto,knot-xrpc,knot-types,knot-server}`, plus `jacquard-common` 0.12.1 (the knot's DID parser, from crates.io).
- Deployment: `UnstoppableMango/the-cluster` at `7917bab`, `apps/knot/helm-release.yml` and `apps/pds/helm-release.yml`. `bluesky-social/pds` tag `v0.4.5037`.

## 1. Where the client metadata can live

**The `client_id` is a URL that must serve the metadata JSON itself.** The spec says "the `client_id` must be a fully-qualified web URL from which the client-metadata JSON document can be fetched", over `https://` with no port. The response "must be 200 (not another 2xx or a redirect), with a JSON object body with the correct `Content-Type` (`application/json`)". The document's `client_id` field "must exactly match the full URL used to fetch the client metadata file itself" (oauth spec, "Clients" and "Client ID Metadata Document"). The reference server fetches with `redirect: 'error'` and parses with `fetchJsonProcessor('application/json', …)` (`client-manager.ts` around lines 37-41 and 767).

**The knot cannot serve it.** The knot's homepage is a single route: `HomepageSource::File(path) => base_router.route_service("/", ServeFile::new(path))` (`knot2/crates/knot-server/src/main.rs:643-647`). No other path serves a static file, so the JSON has to be hosted elsewhere. Using `https://knot.thecluster.io/` as the `client_id` would also fail, because `/` returns the HTML page and not `application/json`.

**A different origin is allowed.** For web clients, the spec only requires that `redirect_uri` "is a HTTPS URL … must match one of the URIs declared in the client metadata". A same-origin rule applies to native clients: "Native clients are also allowed to use an HTTPS URL. In this case, the URL origin must be the same as the `client_id`" (oauth spec, "Request Fields"). The reference implementation matches this:

- `validateRedirectUris`, for `https:` redirect URIs, rejects only local hostnames. A comment says the OIDC native-client restriction is deliberately not enforced (`client-manager.ts` around lines 563-603).
- `validateDiscoverableClientMetadata` ties only two things to the `client_id` origin: `client_uri` (same origin, and a parent path of the `client_id`), and private-use URI schemes (reverse-domain of the `client_id` host) (`client-manager.ts` around lines 662-750).

So `client_id` = `https://thecluster.io/oauth/knot-client-metadata.json` (or `https://unstoppablemango.github.io/…`) with `redirect_uris: ["https://knot.thecluster.io/"]` passes. Leave out `client_uri`, or point it at a parent of the `client_id` on the same host. Do not point it at the knot.

The authorization server fetches the metadata during PAR "and at other times during the session lifecycle" (oauth spec), so the host has to stay up. GitHub Pages serves `.json` as `application/json`. Whatever serves the file must not redirect, for example from apex to `www`.

Suggested metadata:

```json
{
  "client_id": "https://thecluster.io/oauth/knot-client-metadata.json",
  "client_name": "knot.thecluster.io admin",
  "application_type": "web",
  "redirect_uris": ["https://knot.thecluster.io/"],
  "scope": "atproto rpc?lxm=sh.tangled.knot.addMember&lxm=sh.tangled.knot.removeMember&lxm=sh.tangled.repo.create&lxm=sh.tangled.repo.delete&aud=*",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "dpop_bound_access_tokens": true
}
```

The `scope` field lists every scope the client might request. A single authorization request can ask for any subset that includes `atproto` (oauth spec, "Client ID Metadata Document" and "Request Fields").

## 2. Can `/` be the redirect URI?

Yes.

- **Spec:** an HTTPS redirect URL "may include a port number, but not if it is the default port number", and must match a declared URI (oauth spec, "Request Fields"). Nothing excludes the root path.
- **Library:** `BrowserOAuthClient.init()` reads callback params and calls `findRedirectUrl()`, which returns the `redirect_uris` entry whose `origin` and `pathname` equal `location`'s (`browser-oauth-client.ts:207-221`, `:377-389`). For `https://knot.thecluster.io/`, that is `/`.
- **Response mode:** the default is `fragment` ("a safer default as the query params will not be sent to the server", `browser-oauth-client.ts:114`). The `code`/`state` arrive in `location.hash`, so the knot's `ServeFile` at `/` just serves the same file again. After processing, the library calls `history.replaceState` to strip the params (`:416-421`).
- **Popup mode:** `signIn(..., { display: 'popup' })` also works with one page. The popup lands on the same `/`, and `init()` posts the result back over a `BroadcastChannel` (`:289-340`, `:420-447`).

## 3. Scopes for `getServiceAuth` with the knot's `lxm` values

### What the PDS checks

`com.atproto.server.getServiceAuth` authorizes OAuth sessions with `permissions.assertRpc({ aud, lxm })`, using the request's `aud` and `lxm` (defaulting `lxm` to `*`). `aud` must be an atproto DID or a `did#serviceId` reference. Protected methods (account-management NSIDs) are refused for everyone. A privileged check (`chat.bsky.*`, `createAccount`) applies to non-OAuth access tokens (`getServiceAuth.ts`, `pipethrough.ts:655-688`). `sh.tangled.*` is in neither list.

How `assertRpc` resolves the scope:

- **`transition:generic`:** allows any `lxm` not starting with `chat.bsky.`, for any `aud` (`scope-permissions-transition.ts`, `allowsRpc`). The spec describes it as including the "ability to generate service auth tokens for the specific API endpoints the client has access to" (oauth spec, "Transitional Scopes"). It also grants writes to any record type and blob uploads, which is far more than this page needs.
- **Granular `rpc`:** `RpcPermission.matches` is `(aud === '*' || aud === options.aud) && (lxm.includes('*') || lxm.includes(options.lxm))`. The permission's `aud` must pass `isAudParam`, meaning `*` or `isAtprotoDidRefAbsolute` (a DID with a `#fragment`) (`rpc-permission.ts`). The spec agrees: `aud` is "a DID service reference: DID followed by required service type fragment" (permission spec, "`rpc`"). The test suite shows that a plain-DID `aud` does not match a `did#frag` permission (`scope-permissions.test.ts`, "should allow constraining aud": `'did:web:example.com', // invalid aud (no service id)` → `false`).

### What the knot checks

`verify_service_jwt` → `check_claims` requires all of the following (`knot2/crates/knot-atproto/src/jwt.rs:195-240`, `lib.rs:543-578`):

- `aud` canonicalizes to the knot's `KnotId`
- `exp` and `iat` are within 60 s of clock skew
- `exp - iat ≤ 300` s
- `lxm` equals the route's NSID exactly; a missing `lxm` is rejected
- a `jti` is present and single-use (replay store)
- the signature verifies against the issuer's `#atproto` key, secp256k1 or P-256

`KnotId::new` parses with `jacquard_common`'s `Did`, whose regex is `^did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]$` (`knot-types/src/ids.rs:184-188, 355`, `jacquard-common-0.12.1/src/types/did.rs:35`). There is no `#`, so a token with `aud = did:web:knot.thecluster.io#anything` fails with `AudienceMismatch`.

### What that leaves

The page must call `getServiceAuth?aud=did:web:knot.thecluster.io&lxm=<nsid>`, with a bare DID. The only granular permission that matches a bare-DID `aud` is `aud=*`. Wildcarding `lxm` and `aud` together is forbidden (`rpc:*?aud=*` returns `null` in `RpcPermission.fromSyntax`; permission spec: "can not both be wildcard"), so the `lxm` list must be explicit. Repeated parameters express arrays (permission spec, "Scope String Syntax"):

```
atproto rpc?lxm=sh.tangled.knot.addMember&lxm=sh.tangled.knot.removeMember&lxm=sh.tangled.repo.create&lxm=sh.tangled.repo.delete&aud=*
```

Add any other admin routes the page uses, for example `sh.tangled.knot.ban`/`unban`, `sh.tangled.repo.addCollaborator`/`removeCollaborator`, `rename`, `setDefaultBranch`, `deleteBranch`. The full list of knot XRPC routes is the set of `*_ROUTE` constants in `knot2/crates/knot-xrpc/src/*.rs`. With `aud=*`, a page holding the session could mint tokens for those NSIDs aimed at any service. The narrow `lxm` list limits the damage, and Tangled NSIDs mean nothing to other services.

The knot then authorizes the actor by role:

- `addMember`/`removeMember` require `can_admin_knot` (`members.rs:30-40`)
- `repo.create` requires `can_create_repo` (`repos.rs:87-90`)
- `repo.delete` requires `can_delete_repo`, falling back to `can_admin_knot` (`repos.rs:466-489`)

Erik is the knot owner in `apps/knot/helm-release.yml` (`did:plc:npefy3bubltqewdfhah5i5ef`).

### Token lifetime and replay

`createServiceJwt` defaults `exp` to `iat + 60 s` and always sets a random 16-byte hex `jti` (`xrpc-server/src/auth.ts:28-46`), which fits the knot's 300 s cap. If the page passes `exp`, it must stay within 300 s of issue: the PDS allows up to an hour, but the knot would reject anything longer with `LifetimeTooLong`. The knot treats `jti` as single-use for everything except `sh.tangled.repo.push` (`lib.rs` `ReplayGuard::SingleUse`, `knot-xrpc/src/lib.rs:203-229`), so the page needs a fresh token for every call.

### Call shape

1. `session.fetchHandler('/xrpc/com.atproto.server.getServiceAuth?aud=did:web:knot.thecluster.io&lxm=sh.tangled.knot.addMember')` goes to the PDS. It is DPoP-bound and handled by the library.
2. `fetch('/xrpc/sh.tangled.knot.addMember', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ subject }) })` goes to the knot. The page and the knot share an origin, so no CORS is involved.

## 4. Library: `@atproto/oauth-client-browser`

- **Version:** latest is `0.5.11`. It ships ESM only (`exports: { ".": "./dist/index.js" }`, no UMD/IIFE build), with 9 runtime dependencies including `core-js` (npm registry).
- **Size when bundled:** an entry that just does `import { BrowserOAuthClient } … ; window.BrowserOAuthClient = BrowserOAuthClient`, built with `esbuild --bundle --minify --format=iife --target=es2022`, gives **213,347 bytes minified, 59,013 bytes gzip -9**. The largest contributors are zod (~60 KB), jose (~27 KB), `@atproto/oauth-client` (~22 KB), `@atproto/jwk` (~17 KB), `@atproto/oauth-types` (~17 KB), lru-cache (~17 KB) and core-js (~9 KB).
- **Can it be inlined?** Yes. The bundle has no dynamic `import()` and no workers or external assets, so it can go straight into an inline `<script>`. The knot sets no CSP header (no `Content-Security-Policy` anywhere in `knot2/crates`), so inline scripts run. A small build step (esbuild) is still needed to produce the IIFE before inlining.
- **Metadata can be compiled in:** `new BrowserOAuthClient({ clientMetadata: {...} })` takes the same JSON object that the `client_id` URL serves (README, "Client Metadata", option 1). The page then never fetches the metadata. Only the PDS does.
- **Storage:** sessions, state, DPoP nonces and DID/handle caches live in IndexedDB database `@atproto-oauth-client` (`browser-oauth-database.ts:73`). The last session's `sub` goes in `localStorage` (`browser-oauth-client.ts:232-245`). Tabs coordinate through `BroadcastChannel`, and refreshes are serialized with `navigator.locks` (`browser-runtime-implementation.ts`).
- **DPoP keys:** generated per session with WebCrypto (`WebcryptoKey.generate`, `browser-runtime-implementation.ts`). The constructor requires `crypto.subtle`, so the page must be served over HTTPS.
- **Identity resolution:** `handleResolver` is optional in the options type (`CreateIdentityResolverOptions` is `Partial<…HandleResolverOptions>`). Browsers cannot do DNS TXT lookups, so to sign in by handle the page must pass `handleResolver`. The README recommends a self-hosted PDS URL (it calls `com.atproto.identity.resolveHandle`) or a DoH resolver, and warns that `bsky.social` leaks IPs and handles to Bluesky. A single-admin page can avoid the question by calling `signIn('did:plc:npefy3bubltqewdfhah5i5ef')`, which needs only DID resolution (plc.directory).
- **Session lifetime:** a public web client is "untrusted", so sessions and refresh tokens "should both be limited to 2 weeks". Access tokens last under 30 minutes (oauth spec, "Tokens and Session Lifetime"). Expect to sign in again about every two weeks.

## 5. Erik's PDS

- **Not resolved.** `https://plc.directory/did:plc:npefy3bubltqewdfhah5i5ef` was refused by the sandbox egress proxy (CONNECT 403), as were `public.api.bsky.app`, `api.bsky.app` and `bsky.social`. So the PDS host for this DID is unconfirmed.
- **What the repos show:** the-cluster deploys a PDS at `pds.thecluster.io` (`apps/pds/helm-release.yml`). Its image is pinned to `sha-ed2dcb86…`, which the file says is v0.4.5037. In `bluesky-social/pds`, that tag (2026-10-02) depends on `@atproto/pds` `0.5.37`, whose dependencies include `@atproto/oauth-provider` `^0.23.1` and `@atproto/oauth-scopes` `^0.5.13`. That version serves OAuth with granular `rpc` permissions. The release is invite-only (`inviteRequired: true`). Whether Erik's DID was created there or migrated there is not visible from these sources.
- **If Erik is on bsky.social:** Bluesky's hosted PDS runs the same `@atproto/pds` code and has supported OAuth for public browser clients since the [OAuth announcement](https://atproto.com/blog/oauth-atproto). That shows OAuth exists, but it is not a live check of the current deployment.
- **To confirm:** run `curl https://plc.directory/did:plc:npefy3bubltqewdfhah5i5ef | jq '.service'` from a machine with open egress, then `curl <pds>/.well-known/oauth-protected-resource` and check that the authorization server's metadata lists `atproto` in `scopes_supported`.

## Open points for the design (#115)

- Pick the metadata host: a `thecluster.io` path or GitHub Pages. Both satisfy the rules above. A path under thecluster.io keeps everything in one domain.
- Pick the scopes: `transition:generic` (simplest, broad) or the explicit `rpc?lxm=…&aud=*` list (narrow, needs editing whenever the page gains a procedure). The granular list is recommended.
- If the knot ever accepts `did#service` audiences, the scope could narrow to `aud=did:web:knot.thecluster.io%23<service>`. Today `KnotId` rejects fragments.
