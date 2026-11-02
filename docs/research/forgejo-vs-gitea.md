# Forgejo vs Gitea 28.2.0 for the mirror hub

Research for [#113](https://github.com/UnstoppableMango/vcs/issues/113) on the [#99](https://github.com/UnstoppableMango/vcs/issues/99) map.
Gathered 2026-11-02.
It builds on [gitea-providers.md](https://github.com/UnstoppableMango/vcs/blob/research/gitea-providers/docs/research/gitea-providers.md) (#101) and doesn't repeat it.

The question: where the mirror hub needs it, how does Forgejo differ from the Gitea 28.2.0 in `apps/gitea`?
That covers pull mirrors, push mirrors, `mirror-sync`, whether a pull-mirror sync fires `sync_on_commit` push mirrors, Actions with `.github/workflows`, `/swagger.v1.json`, IaC providers, licence and release cadence.

## How the sources were reached

`codeberg.org`, `forgejo.org`, `code.forgejo.org`, `data.forgejo.org` and `registry.terraform.io` all fail through this session's proxy (CONNECT 403).
`git clone` from `github.com` works, so the sources were read like this:

- **Gitea 28.2.0:** the `v28.2.0` tag of `github.com/go-gitea/gitea`, commit `829b49c1ae96015e345f9d2a0eb1ea7acd5f31e1` (tagged 2026-10-18). Its module path is now `gitea.dev` (`go.mod` line 1), which is why the Go proxy can't serve it as `code.gitea.io/gitea/v28`.
- **Forgejo 17.0.1:** Forgejo has no GitHub mirror of its own, so the code came from the third-party mirror `github.com/qundao/mirror-forgejo`, tag `v17.0.1`, commit `363f3dc30beef902b187af5a5244ff7af44901e6` (2026-10-26). To check that the mirror is faithful:
  - its `v1.21.11-2` tag hash matches the `Origin.Hash` that `proxy.golang.org` records from `codeberg.org/forgejo/forgejo.git` (`cd36b74c…`);
  - when asked for commit `363f3dc…`, the Go proxy fetched it from codeberg and only failed while zipping a test file with a non-ASCII name, so the commit exists upstream.

  Forgejo's module path is `forgejo.org` (`go.mod` line 1), and `forgejo.org` serves no go-import meta tag, so the Go proxy can't serve v9 and later.
- **Providers:** `git clone` of the GitHub repos at their latest tags, with metadata from the GitHub search API. Also the Go proxy zip of `gitea.dev/terraform-provider-gitea@v0.8.1` and its SDK `code.gitea.io/sdk/gitea@v0.25.1`.
- **Forgejo runner:** `proxy.golang.org/code.forgejo.org/forgejo/runner/v13/@v/v13.2.1.zip`.
- **nixpkgs:** a sparse clone of `nixos-unstable` at `1c89083e` (2026-10-30).

A citation like `F: services/mirror/notifier.go` means that file in Forgejo v17.0.1, and `G:` means Gitea v28.2.0.
Forgejo's documentation site couldn't be reached, so claims about documented intent rest on in-repo text (README, RELEASE-NOTES.md, release-notes-published/) and on the code.

## Push mirrors

The routes and permissions are identical: `GET`/`POST /repos/{owner}/{repo}/push_mirrors`, `GET`/`DELETE …/push_mirrors/{name}` and `POST …/push_mirrors-sync`, all `reqAdmin(), reqToken()` (F: `routers/api/v1/api.go` lines 1010–1018; G: lines 1488–1495).
Neither has an API update endpoint.
The Swagger `operationId`s are the same too (`repoListPushMirrors`, `repoAddPushMirror`, `repoGetPushMirrorByRemoteName`, `repoDeletePushMirror`, `repoPushMirrorSync`), from a diff of the two specs (see the Swagger section below).

Where they differ:

| | Gitea 28.2.0 | Forgejo 17.0.1 |
| --- | --- | --- |
| `CreatePushMirrorOption` | `remote_address`, `remote_username`, `remote_password`, `interval`, `sync_on_commit` | the same, plus `use_ssh` and `branch_filter` (F: `modules/structs/mirror.go` lines 9–17) |
| `PushMirror` response | `repo_name`, `remote_name`, `remote_address`, `created`, `last_update`, `last_error`, `interval`, `sync_on_commit` | the same, plus `public_key` and `branch_filter` (same file, lines 21–35) |
| Credentials embedded in `remote_address` | accepted: `git.ParseRemoteAddr` only overwrites userinfo when a username or password is given, and the stored address is `SanitizeURL(mirrorOption.RemoteAddress)` (G: `modules/git/remote.go` lines 74–91; `routers/api/v1/repo/mirror.go` `CreatePushMirror`) | rejected with 400 "The URL contains credentials" (F: `services/forms/repo_form.go` lines 108–109; `routers/api/v1/repo/mirror.go` line 458) |
| `[mirror] DISABLE_NEW_PUSH` in the API | enforced, 403 (G: `AddPushMirror`) | the setting exists (F: `modules/setting/mirror.go`), but the API's `AddPushMirror` doesn't check it |
| SSH push mirrors | none | `use_ssh: true` makes Forgejo generate a keypair and return the public key, which has to go on the remote as a deploy key. It can't be combined with a username or password (F: `routers/api/v1/repo/mirror.go` lines 371–427) |

`branch_filter` is a comma-separated list of branch names. When it's set, Forgejo adds the remote without `--mirror=push` and writes one `+refs/heads/<b>:refs/heads/<b>` refspec per branch. Tags are always pushed with `+refs/tags/*:refs/tags/*` (F: `services/mirror/mirror_push.go` lines 37–98).
The filter can be changed after creation only from the web settings form (F: `routers/web/repo/setting/setting.go` line 613), not through the API.

The name is still `remote_mirror_` plus a random string in both (F: `CreatePushMirror` uses `util.RandomStringLow`; G: `util.CryptoRandomString(10)`), so a provider still has to key on the returned `remote_name`.
The password still can't be read back in either.

**For the hub:** with `branch_filter`, Forgejo can push only `main` to the GitHub mirror, where Gitea pushes every branch.
That's a Forgejo-only feature.
Since Forgejo rejects credentials in the URL, a provider has to send the GitHub token in `remote_password`; the `tfmm` and `adyxax` resources already do (inferred from their schemas).

## Pull mirrors (migrate with `mirror: true`)

`POST /repos/migrate` takes the same core fields in both: `clone_addr`, `repo_owner`, `repo_name`, `service`, `auth_username`, `auth_password`, `auth_token`, `mirror`, `mirror_interval`, `lfs`, … (F and G: `modules/structs/repo.go` `MigrateRepoOptions`).
Gitea also has `aws_access_key_id`/`aws_secret_access_key` for CodeCommit, which Forgejo lacks.

The difference that matters is **rotating pull mirror credentials**:

- Gitea 28's `EditRepoOption` has `mirror_username`, `mirror_password` and `mirror_token`, which `PATCH /repos/{owner}/{repo}` applies (G: `modules/structs/repo.go`; `routers/api/v1/repo/repo.go` lines 628–630, 1072–1081).
- Forgejo's `EditRepoOption` has only `mirror_interval` and `enable_prune` among the mirror fields (F: `modules/structs/repo.go`). Its pull mirror address and credentials can be changed only in the web settings form, under the `mirror` action (F: `routers/web/repo/setting/setting.go` lines 431–475).

On Forgejo a token rotation means recreating the mirror, or a manual UI edit.
That's not a regression in practice: per #101, no existing Gitea provider sends those fields anyway.

## `mirror-sync`

`POST /repos/{owner}/{repo}/mirror-sync` is the same in both. It requires a token and write access to code, returns 400 if the repo isn't a mirror, and queues `AddPullMirrorToQueue(repo.ID)` (F: `routers/api/v1/repo/mirror.go` `MirrorSync`; G: same).
Forgejo adds a quota middleware, `context.EnforceQuotaAPI(quota_model.LimitSubjectSizeGitAll, …)` (F: `routers/api/v1/api.go` line 1009). It does nothing unless quotas are configured (inferred).
A small Gitea quirk: its handler doesn't `return` after the 403 "Must have write access" error, but the route-level `reqRepoWriter` already blocks such requests (G: `routers/api/v1/api.go` line 1487).

## Does a pull-mirror sync fire `sync_on_commit` push mirrors?

Yes, in both, through the same code.

- `services/mirror/notifier.go` is identical apart from import paths. `mirrorNotifier.PushCommits` and `SyncPushCommits` both call `syncPushMirrorWithSyncOnCommit(ctx, repo.ID)` (F and G: `services/mirror/notifier.go`).
- That function queues every push mirror of the repo with `sync_on_commit` (F: `services/mirror/mirror_push.go` line 379; G: line 250).
- `SyncPullMirror` calls `notify_service.SyncPushCommits` for each updated ref and each newly created ref (F: `services/mirror/mirror_pull.go` lines 600, 646; G: lines 347, 379).
- A deleted ref calls only `SyncDeleteRef`, which `mirrorNotifier` doesn't handle (F: line 611; G: line 358). A branch deleted upstream therefore reaches the push mirror only at the next interval sync (inferred from the code, not tested).

The chain upstream → pull mirror → `sync_on_commit` push mirror → GitHub works the same on either forge.
In both, a ref sync also fires the Actions notifier's `SyncPushCommits`/`SyncCreateRef`, so `push` workflows run on a pull mirror (F: `services/actions/notifier.go` lines 649–693; G: lines 617–652).

## Actions and `.github/workflows`

Both run `.github/workflows`, but they find workflows and resolve actions differently.

- **Which directories:**
  - Gitea's dirs are configurable as `[actions] WORKFLOW_DIRS`, defaulting to `.gitea/workflows`, `.github/workflows` (G: `modules/setting/actions.go` lines 39, 52).
  - Forgejo hard-codes `.forgejo/workflows`, `.gitea/workflows`, `.github/workflows` (F: `modules/actions/workflows.go` lines 56–66).
  - Both use **only the first directory that exists** (G: `listWorkflowsInDirs`; F: `ListWorkflows`). On Forgejo, a repo with an empty `.forgejo/workflows` never runs its `.github/workflows`.
- **Where `uses: owner/action@v` resolves:**
  - Gitea's `DEFAULT_ACTIONS_URL` defaults to `github` (`https://github.com`) and accepts only `github` or `self`. A custom URL falls back to github with an error log (G: `modules/setting/actions.go` lines 50, 75–115).
  - Forgejo defaults to `https://data.forgejo.org` and accepts `github`, `self` or any URL (F: `modules/setting/actions.go` lines 35, 47–63).

  So a stock `.github/workflows` file with `uses: actions/checkout@v4` gets GitHub's action on Gitea, but whatever `data.forgejo.org` mirrors on Forgejo, unless the admin sets `DEFAULT_ACTIONS_URL = github` or the workflow uses full URLs.
- **Runner:**
  - Forgejo needs Forgejo Runner (`code.forgejo.org/forgejo/runner`, v13.2.1 latest on the Go proxy, GPL-3.0-or-later; runner v13.2.1 `README.md`, `LICENSE`). It's a separate project from Gitea's `act_runner`, and it vendors its own `act` fork (`act/` in the runner zip).
  - Whether `act_runner` can register against Forgejo, or Forgejo Runner against Gitea, wasn't checked.
- **Context:** Forgejo's own API docs use `${{ forgejo.token }}` (F: `templates/swagger/v1_json.tmpl`, `/actions/run`).
- **Recent Actions work** in Forgejo includes reusable workflow expansion with `secrets`, `inputs` and `outputs`, a `timezone` for `schedule`, and OIDC workload identity federation (F: `release-notes-published/15.0.0.md`).

**For cairn:** per #103, cairn's CI is one `nix flake check` job. It needs bubblewrap and KVM, which are runner and container concerns rather than forge concerns. Which forge runs it matters less than the runner setup (inferred).

## `/swagger.v1.json`

- **Gitea 28.2.0:**
  - serves a pre-generated Swagger 2.0 file `templates/swagger/v1-swagger.generated.json` at `/swagger.v1.json`, replacing the placeholders `0.0.0+GITEA-API-APP-VERSION` and `/GITEA-API-APP-SUBURL/` at request time;
  - also serves an OpenAPI 3 version at `/openapi3.v1.json` (G: `routers/web/swagger_json.go`; `routers/web/web.go` lines 1779–1780).
- **Forgejo 17.0.1:**
  - renders `templates/swagger/v1_json.tmpl` as a Go template (`{{AppVer | JSEscape}}`, `{{AppSubUrl | JSEscape}}`) at `/swagger.v1.json` (F: `routers/web/swagger_json.go`; `routers/web/web.go` line 1876);
  - has no OpenAPI 3 route;
  - titles it "Forgejo API" and licenses the spec file under MIT "for the purpose of interoperability" (F: `v1_json.tmpl` `info`).
- **Size:** Gitea has 342 paths, 537 operations and 225 definitions. Forgejo has 331 paths, 512 operations and 248 definitions. They share 418 operations, and 12 of those have different `operationId`s. Gitea has 119 operations Forgejo lacks, and Forgejo has 94 that Gitea lacks (a script diff of the two files).
  - Gitea-only examples: org/repo projects, `/packages/{owner}/{type}/{name}` and the newer Actions run/job/workflow routes.
  - Forgejo-only examples: quota, ActivityPub, `/admin/users/{username}/tokens` and different runner routes.
- **Mirror operations** (`/repos/migrate`, `mirror-sync` and all push mirror routes) have identical paths and `operationId`s. Only the schemas differ, as listed above.
- **Org and repo CRUD** (`/orgs`, `/orgs/{org}`, `/orgs/{org}/repos`, `/user/repos`, `/repos/{owner}/{repo}`) exists in both. `CreateOrgOption`, `EditOrgOption` and `CreateRepoOption` have identical properties. `Repository` differs: Gitea has `allow_manual_merge`, `autodetect_manual_merge`, `has_code`, `projects_mode`, `mirror_last_sync_at` and others, while Forgejo has the `wiki_*` fields.
- **`/api/v1/version`:** Forgejo reports `<forgejo version>+gitea-1.22.0`. The Makefile appends `GITEA_COMPATIBILITY ?= gitea-1.22.0` and passes it as `main.ForgejoVersion` (F: `Makefile` lines 87–119).

**For a generated provider:** one generator could probably target both specs for the mirror subset, but the schemas need per-forge handling (`branch_filter`/`use_ssh` on Forgejo, `mirror_*` edit fields on Gitea).
Forgejo's spec is a template, so a generator has to substitute the `{{…}}` expressions or fetch the rendered file from a running instance (inferred).

## Providers that support Forgejo

### Does the official `go-gitea/gitea` provider work against Forgejo?

Probably, for orgs, repos and pull mirrors. This comes from reading code, not from a test.

- Neither the provider (v0.8.1) nor its SDK (`code.gitea.io/sdk/gitea` v0.25.1) mentions Forgejo (grep of both zips).
- The SDK version-gates calls by parsing `/api/v1/version` with `hashicorp/go-version` (SDK `version.go` lines 97–140). Forgejo's `17.0.1+gitea-1.22.0` parses as 17.0.1, which is greater than every `1.x` gate in the SDK (up to `version1_26_0`) and every `requireVersion(">= 1.2x")` in the provider (`gitea/data_source_gitea_actions.go`).
  - So no gate ever blocks it (inferred).
  - The flip side is that the gates are useless against Forgejo: an Actions data source asking for Gitea-1.26 endpoints would get a 404, not a clean version error (inferred).
- `MigrateRepo` sends the shared core fields to `/repos/migrate` (SDK `repo_migrate.go`). `resource_gitea_repository.go`'s Update sends `allow_manual_merge`/`autodetect_manual_merge`, which Forgejo's `EditRepoOption` accepts (F: `modules/structs/repo.go` lines 225–227). Its read path doesn't set them from the response (`setRepoResourceData`), so Forgejo leaving them out of `Repository` causes no drift (inferred).
- As on Gitea, there's no push mirror resource.

The `tfmm/gitea` fork's `gitea_push_mirror` uses the shared push mirror routes and fields, so it should also work on Forgejo. It can't set `branch_filter` or `use_ssh` (inferred).

### Forgejo-native Terraform providers

- **`svalabs/forgejo`** (`github.com/svalabs/terraform-provider-forgejo`):
  - **Maintenance:** MPL-2.0, 64 stars, 32 forks, created 2024-09-25, last pushed 2026-10-31. Latest tag `v1.7.0` (2026-10-15). Copyright SVA System Vertrieb Alexander GmbH (GitHub search API; `LICENSE`).
  - **Framework and SDK:** plugin framework v1.19.0 over `codeberg.org/mvdkleijn/forgejo-sdk/forgejo/v3` v3.0.0 (`go.mod`). CI tests against Forgejo 15 and 17 (`.github/workflows/test.yml` lines 85, 171).
  - **Resources:** `forgejo_organization`, `forgejo_repository`, `forgejo_team`, `forgejo_user`, `forgejo_branch_protection`, Actions secrets and variables, keys, webhooks and more (`docs/resources/`).
  - **Pull mirror:** through `forgejo_repository` with `clone_addr` + `mirror` (both `RequiresReplaceIfConfigured`) and `mirror_interval`. Auth is only a write-only, sensitive `auth_token`, with no username/password (`internal/provider/repository_resource.go` lines 557–568, 1101–1127, 1290–1319).
  - **No push mirror** (no file mentions `push_mirror`).
  - **Bridging:** a supported public constructor `github.com/svalabs/terraform-provider-forgejo/pkg/provider.New(version)` (README "API Stability"), so a `pf.ShimProvider` bridge needs no shim module, unlike `terraform-provider-git` (inferred).
  - **Not in nixpkgs** (`providers.json` has only `go-gitea_gitea`).
- **`adyxax/forgejo`** (`git.adyxax.org/adyxax/terraform-provider-forgejo`, GitHub mirror `adyxax/terraform-provider-forgejo`):
  - **Maintenance:** EUPL-1.2, 6 stars, one maintainer. Latest tag `v1.6.1` (2026-10-22) (GitHub search API; `LICENSE`; Go proxy).
  - **Framework:** plugin framework, with its own HTTP client in `internal/client` rather than an SDK.
  - **Resources:** `forgejo_organization`, `forgejo_repository`, `forgejo_repository_push_mirror`, labels, Actions secrets and variables, `forgejo_team` and `forgejo_user` (`docs/resources/`).
  - **Push mirror:** has `owner`, `repository`, `remote_address`, `remote_username`, `remote_password` (sensitive), `interval` (default `8h0m0s`), `sync_on_commit` (default true) and `use_ssh`, all `RequiresReplace`. There's no `branch_filter` (`docs/resources/repository_push_mirror.md`; `internal/provider/repository_push_mirror_resource.go` lines 58–102).
  - **No pull mirror:** its repository resource has no `clone_addr` or migrate path (grep of `internal/`).
  - **Bridging:** the provider is in `internal/provider` (`main.go`), so a bridge needs the shim-module trick.
  - **Licence:** EUPL-1.2 is copyleft, which matters only if the bridge is redistributed (inferred).
- **`vincentbrobald/provider-forgejo`** is a Crossplane/Upjet wrapper (GitHub search API), so it's out of scope.

### Pulumi

- **`pulumiverse/pulumi-forgejo`** (Apache-2.0) is a native provider generated from Forgejo's Swagger with `cloudy-sky-software/pulschema`. Its README says "This is at a very early stage. Please don't use it… What is implemented so far? Nothing". The last commit on the default branch is from 2025-11-01 (`README.md`; `git log`).
- **`stooj/pulumi-forgejo`** (Apache-2.0) is the same idea. Its last commit is from 2025-07-11, and its `go.mod` won't even resolve on the Go proxy (Go proxy error).
- There's no npm or PyPI `pulumi-forgejo` package (`registry.npmjs.org` search; `pypi.org/pypi/pulumi-forgejo/json` is 404).

**For the hub:** no single Forgejo provider covers both mirror kinds.
svalabs has pull mirrors and adyxax has push mirrors, and the two can be used side by side in one program.
Alternatively, the official Gitea provider plus the `tfmm` fork, or a small custom push mirror resource, should work against Forgejo the same way as against Gitea (inferred).

## Licence and release cadence

- **Gitea:**
  - **Licence:** MIT (G: `LICENSE`; `README.md` "License").
  - **Stated policy:** "Aim for a major release about every three or four months", with security fixes only for the latest major and the one before it (G: `docs/release-management.md` "Cadence", "End of life").
  - **In practice:** v1.24.0 2025-06-09, v1.25.0 2025-10-29, v1.26.0 2026-04-18, v1.27.0 2026-07-13, then v28.0.0 2026-09-29, v28.1.0 2026-10-06, v28.2.0 2026-10-18 and v28.3.0 2026-11-01 (tag commit dates).
  - **v28:** the jump from 1.27 to 28 drops the `1.` prefix. The same doc's release checklist now names branches `release/v29` and dev tags `v30.0.0-dev`, though its schedule still lists "v1.28.0 in September 2026" (G: `docs/release-management.md`). Since 28.0, minor releases have come every one to two weeks.
  - **Note:** `apps/gitea` is already one minor behind (28.3.0 is out).
- **Forgejo:**
  - **Licence:** GPL-3.0-or-later since v9.0. Earlier versions are MIT (F: `README.md` "License"; `LICENSE`). Forgejo Runner is also GPL-3.0-or-later.
  - **Cost of the GPL:** it doesn't affect running Forgejo or calling its API. It only matters if Forgejo code is modified and distributed (inferred).
  - **Stated policy:** "A minor or major Forgejo release is published every three months", with patch releases in between. Major versions may carry breaking changes that the release notes explain (F: `RELEASE-NOTES.md`).
  - **In practice:** majors land in mid-January, April, July and October: v11.0.0 2025-04-16, v12 2025-07-16, v13 2025-10-15, v14 2026-01-14, v15 2026-04-16, v16 2026-07-16 and v17 2026-10-15 (tag commit dates).
  - **Support windows:** most majors stop getting patches soon after the next major (v12.0.4 2025-09-19, v13.0.5 2026-01-16, v14.0.5 2026-04-29). v11 was patched until v11.0.16 on 2026-07-09, and v15 is still patched (v15.0.11 on 2026-10-26, the same day as v16.0.7). The tags fit a yearly long-term-support line (v11, v15), but the forgejo.org page that documents it couldn't be reached (inferred).

## Bottom line for the ticket

- **Mirroring:** Forgejo 17 and Gitea 28.2.0 share the mirror API paths, permissions and `operationId`s. Neither has a push mirror update endpoint, and push mirror passwords can't be read back in either.
- **Pull sync → push mirror:** a pull-mirror sync triggers `sync_on_commit` push mirrors in both, through identical code. Ref deletions wait for the interval in both.
- **Forgejo's advantages:**
  - `branch_filter` on push mirrors, so only `main` goes to GitHub;
  - `use_ssh` push mirrors, with a generated deploy key.
- **Forgejo's disadvantages:**
  - no API to rotate pull mirror credentials (Gitea 28 has `mirror_password`/`mirror_token` on `PATCH /repos`);
  - `remote_address` with embedded credentials is rejected.
- **Actions:** both run `.github/workflows`, but only from the first existing workflow directory. On Forgejo, short `uses:` references resolve against `data.forgejo.org` rather than GitHub unless `DEFAULT_ACTIONS_URL = github`, and it needs Forgejo Runner.
- **Swagger:** Swagger 2.0 at `/swagger.v1.json` on both. Gitea also has OpenAPI 3 at `/openapi3.v1.json`. Forgejo's is a Go template. About 80% of operations overlap (418 shared).
- **Providers:**
  - The official `go-gitea/gitea` provider should handle orgs, repos and pull mirrors on Forgejo, because Forgejo reports `17.x+gitea-1.22.0` and passes every SDK version gate. That's inferred, not tested.
  - The Forgejo-native options: `svalabs/forgejo` (MPL-2.0, most active, pull mirrors with a token only, no push mirror, public `pkg/provider` for easy bridging) and `adyxax/forgejo` (EUPL-1.2, push mirror without `branch_filter`, no pull mirror).
  - Neither Forgejo provider is in nixpkgs. No usable Pulumi package exists: `pulumiverse/pulumi-forgejo` implements nothing.
- **Licence and cadence:** Gitea is MIT with releases now every week or two on v28, and Forgejo is GPL-3.0-or-later (v9 and later) with quarterly majors and an apparent yearly LTS.
- **For the trial:** the mirror hub works the same on either forge. Forgejo's real differences are a nicer push mirror (branch filter) against no API for rotating pull mirror credentials, plus a thinner IaC story split across two providers.
