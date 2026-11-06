# Moving Gitea's login to Keycloak

Research for [#132](https://github.com/UnstoppableMango/vcs/issues/132): what it would take to move `gitea.thecluster.io` from GitHub OAuth to Keycloak (`auth.thecluster.io`, realm `thecluster`).

## Short answer

It's a small change on both sides, with three pitfalls worth knowing up front.

- **iam** adds one confidential client, `keycloak/clients/gitea.ts`. It follows `grafana.ts` with two differences: there's no PKCE, and the redirect URI is `https://gitea.thecluster.io/user/oauth2/<source name>/callback`. iam also adds groups such as `gitea-admins` and puts members in them.
- **the-cluster** adds a second `gitea.oauth` entry (`provider: openidConnect`, `groupClaimName: groups`, `adminGroup: gitea-admins`) and a sealed secret for it. GitHub and Keycloak can run side by side for as long as needed.
- **Existing accounts** carry over with no data loss. Each user signs in with GitHub once and links Keycloak from *Settings → Security → Manage account links*. The link-account page's password form can't do it, because GitHub-created accounts have no password.
- **Pitfall 1:** the chart re-runs `gitea admin auth update-oauth` in the `configure-gitea` init container on every pod start. For an OIDC source, that command fetches Keycloak's discovery document, and a failure fails the init container. So **a Gitea restart while Keycloak (or the Cloudflare path to it) is down keeps Gitea from starting**, git over SSH and HTTPS included. Today's GitHub source has no such coupling.
- **Pitfall 2:** the chart renders boolean options as `--flag "value"`, and the Gitea CLI treats any bool flag it sees as `true`. Writing `groupTeamMapRemoval: false` therefore turns the option *on*.
- **Pitfall 3:** Keycloak itself logs in only through GitHub. Moving adds a dependency (GitHub *and* Keycloak must be up) rather than removing one. What you gain is an allowlist (only users declared in iam get tokens) and group-driven admin and team membership. Today any GitHub account can self-register on the public Gitea.

The rest of this document is the detail behind each point.

## Where things stand

From `apps/gitea/helm-release.yml` in UnstoppableMango/the-cluster at `b15baf4`:

- Chart `gitea` 12.7.0, image `docker.gitea.com/gitea:28.3.0`.
- `gitea.oauth: [{name: GitHub, provider: github, existingSecret: gitea-credentials}]`. The same `gitea-credentials` secret also holds the admin `username`/`password` (`gitea.admin.existingSecret`).
- `[service] DISABLE_REGISTRATION=false`, `ALLOW_ONLY_EXTERNAL_REGISTRATION=true`, with no `[oauth2_client]` section. That means the defaults apply: `ENABLE_AUTO_REGISTRATION=false`, `ACCOUNT_LINKING=login`, `USERNAME=nickname` (`custom/conf/app.example.ini` L1790–1811 at Gitea v28.3.0).
- Public through the Cloudflare tunnel (`HTTPRoute gitea-public`). SSH is LAN-only, on `gitea.thecluster.lan:22` (`ssh-service.yml`).

Keycloak (`apps/keycloak/helm-release.yml`): keycloakx 7.4.0, Keycloak 26.8.1, 2 replicas, `KC_HOSTNAME=https://auth.thecluster.io`. `auth.thecluster.io` is served by the Cloudflare tunnel through an Anubis instance (`infrastructure/configs/cloudflare-system/cloudflare-operator/tunnel.yml`). The Anubis config notes that only browser user agents are challenged and that `/.well-known` passes (`apps/anubis/config.yml`).

iam (`/home/user/iam/keycloak/`):

- The realm allows no self-registration.
- The only identity provider is GitHub, with a first broker login flow that only links an existing user (`github.ts`).
- Users are declared in `users.ts`. Group memberships are authoritative (`GroupMemberships`).
- The `groups` client scope maps group membership to a `groups` claim with `fullPath: false` (`scopes.ts`), and `defaultScopes()` attaches it to every client.

Sources used: Gitea at tag `v28.3.0` (commit `4f5a3e13`); the chart tarball `gitea-12.7.0.tgz` (sha256 `5881ef9c…0167`, matching an independent pin in `darkshiftio/infrared-chart`); `markbates/goth` v1.82.0 and `urfave/cli/v3` v3.13.0, the versions in Gitea's `go.mod`; Keycloak `26.8.1` docs. Gitea paths below are relative to `https://github.com/go-gitea/gitea/blob/v28.3.0/`.

## 1. Gitea's OpenID Connect source

### Configured through the chart

The chart creates or updates each `gitea.oauth` entry in the `configure-gitea` init container (`templates/gitea/init.yaml`, `configure_oauth`):

- It looks the source up by name in `gitea admin auth list`.
- It then runs `gitea admin auth add-oauth …` (if the source is new) or `update-oauth --id N …`.
- Every key of the entry except `existingSecret` becomes `--<kebab-case key> "<value>"` (`templates/_helpers.tpl`, `gitea.oauth_settings`).
- With `existingSecret`, `key` and `secret` come from that secret's `key`/`secret` data keys, through `GITEA_OAUTH_KEY_<idx>`/`GITEA_OAUTH_SECRET_<idx>` (`templates/gitea/deployment.yaml`).

The chart README adds that sources "can be updated and disabled but not deleted" from values. Removing an entry leaves the source in the database.

Because the secret's data keys are fixed (`key`, `secret`), Keycloak needs its **own** secret. `gitea-credentials` already uses those keys for GitHub.

The CLI flags available in 28.3.0 (`cmd/admin_auth_oauth.go`) are `name`, `provider`, `key`, `secret`, `auto-discover-url`, `use-custom-urls`, `custom-*-url`, `custom-tenant-id`, `icon-url`, `skip-local-2fa`, `scopes`, `ssh-public-key-claim-name`, `full-name-claim-name`, `required-claim-name`, `required-claim-value`, `group-claim-name`, `admin-group`, `restricted-group`, `group-team-map` and `group-team-map-removal`. (`Source.ExternalIDClaim` exists in `services/auth/source/oauth2/source.go` but has no CLI flag. The default `sub` is what we want anyway.)

A sketch of the values:

```yaml
gitea:
  oauth:
    - name: GitHub
      provider: github
      existingSecret: gitea-credentials
    - name: Keycloak            # appears in the callback URL; must match iam's redirect URI exactly
      provider: openidConnect
      existingSecret: gitea-keycloak-oidc   # key: gitea, secret: <iam giteaClientSecret>
      autoDiscoverUrl: https://auth.thecluster.io/realms/thecluster/.well-known/openid-configuration
      groupClaimName: groups
      adminGroup: gitea-admins
      # groupTeamMap: '{"gitea-unmango":{"unmango":["Owners"]}}'
      # groupTeamMapRemoval: true   # omit entirely to keep it off; see the boolean pitfall
      # requiredClaimName: groups
      # requiredClaimValue: gitea-users
```

**Boolean pitfall.** `skip-local-2fa` and `group-team-map-removal` are `cli.BoolFlag`. urfave/cli v3.13.0's parser (`command_parse.go`) sets a bool flag to `"true"` whenever it appears without `=value`, and treats the following `"false"` as a stray positional argument. The chart always emits `--flag "value"`, so any value turns the option on. To keep a boolean off, leave its key out.

**Callback URL.** `setting.AppURL + "user/oauth2/" + url.PathEscape(sourceName) + "/callback"` (`services/auth/source/oauth2/providers.go` L225). With `ROOT_URL=https://gitea.thecluster.io` and the name `Keycloak`, that is `https://gitea.thecluster.io/user/oauth2/Keycloak/callback`.

**Scopes.** Gitea requests `[oauth2_client] OPENID_CONNECT_SCOPES` if set, otherwise the source's `scopes`, with `openid` always added (`providers_openid.go`). Neither needs setting: Keycloak includes a client's *default* scopes without being asked, and `defaultScopes()` in iam makes `groups`, `email` and `profile` defaults.

**Claims.** goth's OIDC provider merges ID-token claims with the userinfo response into `RawData`. It verifies that `iss` equals the discovery document's `issuer` and that the userinfo `sub` equals the ID token's (`providers/openidConnect/openidConnect.go` L240, L334–385). Nickname comes from `nickname`, then `preferred_username` (L130), and the external ID is `sub`, which is Keycloak's user UUID.

**No PKCE.** Gitea doesn't send `code_challenge` as an OIDC *client*. Its PKCE code lives only in Gitea's own OAuth2 provider (`routers/web/auth/oauth2_provider.go`). goth's OIDC provider sends `code_verifier` only when the caller passes one. So the Keycloak client must **not** set `pkceCodeChallengeMethod`, unlike `grafana.ts`, or every login fails.

### Mapping `groups` to site admin and teams

The group logic is in `routers/web/auth/oauth.go` and `oauth_signin_sync.go`, and runs on each login through that source.

- **Reading the claim.** `getClaimedGroups` reads `RawData[GroupClaimName]`. It accepts a JSON array or a comma-separated string, so Keycloak's flat list of bare names (`fullPath: false`) works as is.
- **Site admin and restricted.** With `AdminGroup` set, `is_admin` is **synced both ways** on every login: granted if the group is present, revoked if absent. `RestrictedGroup` works the same way. The one exception is that revocation is skipped when the user is the last admin (`services/user/update.go` L139–151, `UpdateOptionFieldFromSync`). So whoever should stay admin must be in `gitea-admins` in iam *before* the source gets `adminGroup`.
- **Teams.** `GroupTeamMap` is JSON `{"<group>": {"<org>": ["<team>", …]}}` (`modules/auth/common.go`).
  - On login the user is added to mapped teams. With `GroupTeamMapRemoval`, they are also removed from mapped teams whose group is absent (`services/auth/source/source_group_sync.go`).
  - Orgs and teams must already exist; missing ones are logged and skipped.
  - Team names are lowercased.
  - Removing an org's last owner is skipped.
- **Gating access.** `RequiredClaimName`/`RequiredClaimValue` refuse the login (the "prohibit login" page) unless the claim contains the value (`oAuth2UserLoginCallback`). This is the way to require a `gitea-users` group if not every iam member should get Gitea.
- **Lag.** All of this applies at login only. A group change in iam reaches Gitea at the user's next Keycloak login. Existing Gitea sessions and remember-me cookies are untouched. A login through the GitHub source does no group sync at all.

### Auto-registration and account linking (`[oauth2_client]`)

The callback (`SignInOAuthCallback`, `routers/web/auth/oauth.go` L78–214) decides what happens:

1. It looks the user up by login source and `sub`, then in `external_login_user` for this source. If a user is found, it signs them in.
2. With no match and someone **already signed in** (`ctx.Doer != nil`, L134), it links the identity to that user and stops.
3. Otherwise, if `ENABLE_AUTO_REGISTRATION=true` (and internal-only registration is off), it creates a user. On a name or email clash, `ACCOUNT_LINKING=auto` links to the existing user, but only if the IdP's email or username actually matches it (`createUserInContext`, `oauth2IdentityMatchesUser`, `routers/web/auth/auth.go` L632–662, L450). `login` shows the link page and `disabled` shows an error.
4. Otherwise it shows the link-account page: "sign in to an existing account" or "register a new account".

The settings involved: `ENABLE_AUTO_REGISTRATION` (default false), `USERNAME` (`nickname`, `preferred_username`, `email` or `userid`), `ACCOUNT_LINKING` (`login`, `auto` or `disabled`), `UPDATE_AVATAR` and `REGISTER_EMAIL_CONFIRM`.

Leaving the current defaults alone (no auto-registration, `ACCOUNT_LINKING=login`) is fine. A Keycloak identity with no Gitea account gets the link page, and registering there is allowed because `ALLOW_ONLY_EXTERNAL_REGISTRATION=true`. Once the GitHub source is gone, Keycloak is the only external source, so only iam-declared users can register at all.

## 2. Moving existing GitHub-OAuth users

**What an existing account looks like.** Users who arrived through the GitHub source were created on the link page's register form. That makes them `LoginType=OAuth2` with `LoginSource=<GitHub source id>` and, since `ALLOW_ONLY_EXTERNAL_REGISTRATION=true`, an **empty password** (`routers/web/auth/linkaccount.go` L212–232).

**Why the link page's sign-in form doesn't work for them.** It authenticates with username and password (`LinkAccountPostSignIn` → `UserSignIn`, and the OAuth2 source's `Authenticate` falls back to the local password, `services/auth/source/oauth2/source_authenticate.go`). With no password, there is nothing to sign in with.

**Paths that keep the account:**

1. **Link while signed in (recommended, no config).** Sign in with GitHub as usual, then open *Settings → Security → Manage account links → Link account → Keycloak* (`templates/user/settings/security/accountlinks.tmpl` → `/user/oauth2/Keycloak`). The callback's `ctx.Doer != nil` branch adds an `external_login_user` row for the Keycloak source. From then on, "Sign in with Keycloak" finds that row and signs in the same user. The admin can do this for themselves at once; other users have to do it once each.
2. **Auto-link on first Keycloak login.** Set `ENABLE_AUTO_REGISTRATION=true`, `ACCOUNT_LINKING=auto` and `USERNAME=preferred_username` (or `nickname`). A first Keycloak login whose `preferred_username` or email matches an existing Gitea user, case-insensitively, links to it with no prompt. Keycloak's email is GitHub's (`syncMode: FORCE`, `trustEmail`), so it usually matches. The cost is that any iam user with no Gitea account gets one created automatically.

**Running both side by side.** This works: login sources are independent rows, and one user can have external links to several. Keep the GitHub entry until every user has linked. Then:

- Remove it from `gitea.oauth`.
- **Deactivate** it in *Site Administration → Authentication Sources*.
- Don't try to delete it. `DeleteSource` refuses while any user's `LoginSource` or any external link points at it (`services/auth/source.go` L41–58), and every GitHub-created user's `LoginSource` stays the GitHub source forever.

A deactivated `LoginSource` only blocks password sign-in for those users (`services/auth/signin.go`, `ErrAuthSourceNotActivated`), and they have no password anyway.

One cosmetic side effect: Gitea's OIDC RP-initiated logout picks the source from `doer.LoginSource` (`buildOIDCEndSessionURL`), so migrated users won't get Keycloak single logout.

**Gitea users not in iam** (anyone besides `unstoppablemango`) can't get a Keycloak token until they're added to `users.ts`. Keycloak's first broker flow only links users that already exist. Add them to iam first, or leave GitHub on until they are.

Don't enable periodic sync on the Keycloak source. The OAuth2 sync task disables any user whose stored refresh token gets `invalid_grant` (`services/auth/source/oauth2/source_sync.go`). Sources created through the CLI have sync off by default.

## 3. What iam would add

The client, in `keycloak/clients/gitea.ts` (exported from `clients/index.ts`), mirrors `grafana.ts`:

```ts
const secret = new random.RandomPassword("gitea-client-secret", { length: 48, special: false });

export const gitea = new keycloak.openid.Client("gitea", {
	realmId: realm.id,
	clientId: "gitea",
	name: "Gitea",
	accessType: "CONFIDENTIAL",
	clientSecret: secret.result,
	standardFlowEnabled: true,
	// No pkceCodeChallengeMethod: Gitea's OIDC client sends no code_challenge.
	rootUrl: "https://gitea.thecluster.io",
	validRedirectUris: ["https://gitea.thecluster.io/user/oauth2/Keycloak/callback"],
	validPostLogoutRedirectUris: ["https://gitea.thecluster.io/"],
});

defaultScopes("gitea", gitea);

// Sealed into the `gitea-keycloak-oidc` secret (keys `key`, `secret`) in the-cluster.
export const giteaClientSecret = secret.result;
```

About the redirect URI:

- The `Keycloak` path segment is the Gitea source name, and the match is exact. Renaming the source (to `THECLUSTER`, say, matching Grafana's button) means changing both sides.
- The post-logout URI matches what Gitea sends as `post_logout_redirect_uri` (`httplib.GuessCurrentAppURL`), for users whose `LoginSource` is Keycloak.
- If Gitea is ever reached on `gitea.thecluster.lan` for web login, it still builds the callback from `ROOT_URL`, so no extra URI is needed.

Groups, in `groups.ts`:

- `gitea-admins` (site admin) at minimum.
- Optionally `gitea-users` (gating through `requiredClaimValue`).
- Optionally one group per mapped team.

`unstoppablemango` goes into `gitea-admins` in `users.ts`, so the admin bit isn't stripped on the first Keycloak login. The AGENTS.md "Consumers" table gains a `gitea` row. Renaming any of these groups later breaks Gitea's mapping, as with Grafana.

Keycloak's own login stays GitHub-only. The chain is: browser → Gitea → Keycloak → GitHub (link-only) → Keycloak → Gitea. Users see GitHub's consent once for Keycloak's GitHub app, not for Gitea's.

### How Gitea reaches Keycloak

Gitea's OIDC provider takes every endpoint from the discovery document. There's no per-endpoint override for `openidConnect` (`CustomURLSettings()` returns nil), unlike Grafana's split `auth_url`/`token_url`. And because `KC_HOSTNAME` is set, the document lists `https://auth.thecluster.io/...` even when fetched from `keycloak-http.keycloak.svc`. There are two options:

- **Public discovery URL**, as Nextcloud does (`apps/nextcloud/helm-release.yml`). Gitea's server-side calls (discovery, token, userinfo, JWKS) hairpin through Cloudflare and Anubis. Anubis lets non-browser user agents through. The cost is that Gitea's login depends on the tunnel as well as Keycloak.
- **In-cluster.** Set `KC_HOSTNAME_BACKCHANNEL_DYNAMIC=true` on Keycloak so that backchannel endpoints follow the request host while the issuer stays public (Keycloak 26.8.1 `docs/guides/server/hostname.adoc`, "backchannel-dynamic"). Then point `autoDiscoverUrl` at `http://keycloak-http.keycloak.svc/realms/thecluster/.well-known/openid-configuration`. This is untested here and touches every Keycloak client, so treat it as a follow-up.

## 4. When Keycloak is down

**Signing in on the web.** "Sign in with Keycloak" fails. The local admin from `gitea-credentials` still works through the password form:

- It is a local, password-based account kept in sync by the chart (`passwordMode: keepUpdated`, `configure_admin_user` in `init.yaml`).
- Leave `[service] ENABLE_PASSWORD_SIGNIN_FORM` at its default `true`, or that path disappears.
- Gitea is public, so give the admin 2FA.

Users already signed in keep their sessions, which live in Redis and have no IdP dependency. While GitHub is still a source, GitHub sign-in works too, unless GitHub is the thing that's down, in which case Keycloak is effectively down as well.

**Git over HTTPS with tokens.** It keeps working. Basic auth tries the password field (or username) as an access token or OAuth2 grant first (`services/auth/basic.go` L74–130), all local database lookups. Only a username and *password* pair goes to `UserSignIn`, and these users have no password.

**Git over SSH.** It keeps working, because keys are local. Note that `sshPublicKeyClaimName` isn't used here, and setting it would make Keycloak manage keys only on each login.

**Restarting Gitea.** This is where an outage bites:

- *Pod start while Keycloak is unreachable.* `configure-gitea` runs `update-oauth` for the Keycloak entry under `set -euo pipefail`. `UpdateSource` calls `RegisterSource`, which builds the goth OIDC provider and **fetches the discovery URL**. On failure, Gitea restores the old row and returns the error (`models/auth/source.go` L325–350), so the init container exits non-zero and the pod never starts: no web UI, no git over HTTPS or SSH. On a first install, `add-oauth` deletes the half-created source and fails the same way (L225–252). Today's `github` provider makes no network call at registration, so there's no equivalent coupling.
- *Gitea already running when Keycloak comes back.* There's nothing to fix. If registration failed at startup (`initOAuth2Sources` logs and continues), clicking the button calls `ResetOAuth2` and re-registers (`SignInOAuth`, `routers/web/auth/oauth.go` L60–70).

Ways around the restart coupling, simplest first:

- **(a)** Create the Keycloak source once by hand (*Site Administration* or `gitea admin auth add-oauth` in the pod), and leave it out of `gitea.oauth`. Startup then only logs the registration failure. The cost is that the source config lives in the database, not in Git.
- **(b)** Keep it in the chart and accept that Keycloak (2 replicas, `system-cluster-critical`) must be up for Gitea to restart.
- **(c)** Make discovery in-cluster (above). That removes the Cloudflare dependency but not the Keycloak one.

## Open questions

- Which Gitea users exist besides `unstoppablemango`? Each needs an iam entry before GitHub can be turned off. I didn't query the instance.
- Should every iam member get Gitea (no `requiredClaim*`), or only a `gitea-users` group?
- Which orgs and teams, if any, should be group-mapped? The orgs and teams must be created in Gitea first (the `gitea/` directory of `UnstoppableMango/scm` manages orgs and repos there).
- Option (a) or (b) for the restart coupling.
