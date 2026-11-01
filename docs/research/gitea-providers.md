# Existing Gitea providers for orgs, repos, pull mirrors and push mirrors

Research for [#101](https://github.com/UnstoppableMango/vcs/issues/101) on the [#99](https://github.com/UnstoppableMango/vcs/issues/99) map.
Gathered 2026-11-01.

The question: which existing Terraform or Pulumi providers for Gitea can manage an org, a repo, a pull mirror (migrate with `mirror: true` from an https URL) and a push mirror with `sync_on_commit`, against the Gitea in `apps/gitea`?
For each one: maintenance state, licence, whether this repo's flake can bridge and pin it the way it does `pulumi-provider-git`, and how it handles a push mirror having no update endpoint and a `remote_password` that can't be read back.

## How the sources were reached

`registry.terraform.io`, `gitea.com`, `codeberg.org` and `www.pulumi.com` are blocked from this session's proxy, and so is the GitHub contents API for repos outside `UnstoppableMango`.
Provider source was read from the module zips served by `proxy.golang.org` instead, which are the tagged source trees.
Each zip URL is `https://proxy.golang.org/<module>/@v/<version>.zip`, and a citation like `official v0.8.1: gitea/provider.go` below means that file inside that zip.
Repo metadata (stars, archived, push dates, licence) came from the GitHub search API (`gh api search/repositories?q=...`).
npm and PyPI metadata came from `registry.npmjs.org` and `pypi.org/pypi/<name>/json`.

## First: the Gitea in `apps/gitea` is 28.2.0, not 1.25

`apps/gitea/helm-release.yml` in `UnstoppableMango/the-cluster` installs chart `gitea` version `12.7.0` with `image.repository: gitea` and `image.tag: "28.2.0"` from `docker.gitea.com`.
`28.2.0` is the Gitea version itself, not a chart version.
The Go proxy has Gitea tags up to `v1.27.3` (latest, 2026-08-29) and `v1.28.0-dev` (`https://proxy.golang.org/code.gitea.io/gitea/@v/list`).
For `v28.2.0` it answers "module path must match major version (code.gitea.io/gitea/v28)", which is what it says for a tag that exists. For a tag that doesn't, such as `v28.9.9`, it says "unknown revision" (`.../@v/v28.2.0.info` vs `.../@v/v28.9.9+incompatible.info`).
The official provider's own test fixture moved from `gitea/gitea:1.27.1` at v0.8.1 to `gitea/gitea:28.0.0` on `main` (`scripts/docker-compose.yaml` in both zips).
So the "1.25" in the ticket is stale.
The API facts below were checked in both v1.25.0 and v1.27.3. 28.2.0 can't be fetched as a Go module, so it wasn't read directly.

## The Gitea API constraints any provider has to live with

- **Push mirrors have no update endpoint.** Routes are `GET`/`POST /repos/{owner}/{repo}/push_mirrors`, `GET`/`DELETE /repos/{owner}/{repo}/push_mirrors/{name}`, and `POST /repos/{owner}/{repo}/push_mirrors-sync`, all admin-only (`routers/api/v1/api.go` lines 1355–1362 in v1.25.0, 1418–1425 in v1.27.3). The web UI has a `push-mirror-update` form action (`routers/web/repo/setting/setting.go`), but the API doesn't.
- **The password can't be read back.** `CreatePushMirrorOption` takes `remote_address`, `remote_username`, `remote_password`, `interval` and `sync_on_commit`. The `PushMirror` response has `remote_name`, `remote_address`, `created`, `last_update`, `last_error`, `interval` and `sync_on_commit`, and no username or password (`modules/structs/mirror.go`, both versions). The stored address goes through `util.SanitizeURL` first, so credentials embedded in the URL are stripped too (`routers/api/v1/repo/mirror.go` `CreatePushMirror`, v1.27.3).
- **Gitea names the remote, not the caller.** It is `"remote_mirror_" + util.CryptoRandomString(10)` (same function), so a provider has to key its ID on the returned `remote_name`, and every replace gets a new name.
- **Pull mirror credentials can be edited after v1.25.** `EditRepoOption` has only `mirror_interval` in v1.25.0, but v1.27.3 adds `mirror_username`, `mirror_password` and `mirror_token` (`modules/structs/repo.go`). Pull mirrors are created through `MigrateRepoOptions` with `clone_addr`, `auth_username`/`auth_password`/`auth_token`, `mirror` and `mirror_interval` (same file).

## Terraform providers

### Official: `go-gitea/gitea` (gitea.com/gitea/terraform-provider-gitea)

- **Maintenance:** active. Latest tag is `v0.8.1` (2026-07-28), and `main` has a commit from 2026-10-28 (`https://proxy.golang.org/gitea.com/gitea/terraform-provider-gitea/@latest`, `.../@v/main.info`). The GitHub repo `go-gitea/terraform-provider-gitea` is a read-only mirror of gitea.com with issues off, and its homepage is the Registry page `registry.terraform.io/providers/go-gitea/gitea` (GitHub search API). It descends from Lerentis's provider: the LICENSE copyright names both "lerentis" and "The Gitea Authors" (official v0.8.1: `LICENSE`).
- **Licence:** MIT (official v0.8.1: `LICENSE`; nixpkgs `providers.json` `go-gitea_gitea.spdx`).
- **Org:** `gitea_org` resource (official v0.8.1: `gitea/provider.go` line 94).
- **Repo:** `gitea_repository` (same file).
- **Pull mirror:** yes, through `gitea_repository` itself. A non-empty `migration_clone_address` makes Create call `MigrateRepo` with `Mirror: mirror`, `MirrorInterval: migration_mirror_interval` and the `migration_service_auth_*` credentials (official v0.8.1: `gitea/resource_gitea_repository.go` lines 144–181). `migration_clone_address` and `migration_service` are `ForceNew`, but `mirror` isn't, and Update doesn't convert a repo either way: it only sends `MirrorInterval` when `mirror` is true, or `Archived` when it's false (lines 301–307, 649–673).
- **Pull mirror password:** `migration_service_auth_password`/`_token` are `Sensitive` and neither `ForceNew` nor read back (lines 681–694; `setRepoResourceData` sets only `migration_mirror_interval` of the migration fields, line 442). Update's `EditRepoOption` doesn't include them (lines 277–307), so changing the password in config updates state without reaching Gitea. A rotation is a silent no-op even though Gitea 28's API could take it.
- **Push mirror:** none. There's no `gitea_push_mirror` or anything like it among the 27 resources in `ResourcesMap` (lines 94–120). No file in v0.8.1 or the 2026-10-28 `main` mentions `PushMirror` (grep of both zips).
- **Bridging:** it's built on `terraform-plugin-sdk/v2` with an exported `gitea.Provider() *schema.Provider` in a non-`internal` package (`go.mod`; `gitea/provider.go` line 11; `main.go`). That is the easy case for `shimv2.NewProvider(...)` (`pkg/tfshim/sdk-v2/provider.go` in pulumi-terraform-bridge v3.137.0). Its `go.mod` declares the module path `gitea.dev/terraform-provider-gitea`, which the Go proxy also serves under that name (`https://proxy.golang.org/gitea.dev/terraform-provider-gitea/@latest` → v0.8.1), so it can be `require`d directly. nixpkgs already packages the Terraform binary as `terraform-providers.go-gitea_gitea` at `v0.8.1` (`pkgs/applications/networking/cluster/terraform-providers/providers.json`, nixos-unstable).

### `tfmm/terraform-provider-gitea`: a fork of the official provider that has push mirrors

- **Maintenance:** a one-person fork, created 2026-08-20, 0 stars, last pushed 2026-11-01, described as "Gitea Terraform Provider, forked from original and updated" (GitHub search API). Latest tag is `v0.10.1` (2026-10-02, `https://proxy.golang.org/github.com/tfmm/terraform-provider-gitea/@latest`). Its README says to install it as `source = "tfmm/gitea"` and that "PRs are handled outside github" (tfmm v0.10.1: `README.md`). The Registry listing couldn't be checked from here.
- **Licence:** MIT (tfmm v0.10.1: `LICENSE`).
- **Org, repo, pull mirror:** inherited from upstream, so `gitea_org`, `gitea_repository` and its `migration_*` fields, with the same pull mirror password gap (tfmm v0.10.1: `gitea/provider.go` lines 107, 110; `gitea/resource_gitea_repository.go` has no `mirror_password`).
- **Push mirror:** `gitea_push_mirror` (tfmm v0.10.1: `gitea/provider.go` line 135; `gitea/resource_gitea_push_mirror.go`; `docs/resources/push_mirror.md`). It works around the API constraints like this:
  - **No update endpoint:** the resource defines only Create, Read, Delete and Import. Every input (`owner`, `repo`, `remote_address`, `remote_username`, `remote_password`, `interval`, `sync_on_commit`) is `ForceNew`, so any change replaces the mirror. `interval` defaults to `"8h0m0s"` and `sync_on_commit` to `true`.
  - **Write-only password:** `remote_password` is `Sensitive` and stored in state from config. Read never sets it, nor `remote_username`. Read does set `remote_address`, `interval`, `sync_on_commit`, `remote_name`, `created`, `last_error` and `last_update` from the API.
  - **IDs and import:** the ID is `owner:repo:remote_name`, using the name Gitea returned, and import accepts `owner:repo:remote_name` or `owner/repo/remote_name`. An imported mirror has no password in state, so the first apply with one in config replaces it. Rotating the token is also a replace.
  - **Gitea version and SDK:** its test fixture runs `gitea/gitea:28.0.0` (`scripts/docker-compose.yaml`), and it uses `code.gitea.io/sdk/gitea v0.25.1` (`go.mod`).
- **Bridging:** SDKv2 with an exported `gitea.Provider()`, the same as upstream. But its `go.mod` still declares `module gitea.dev/terraform-provider-gitea`, so a bridge needs `replace gitea.dev/terraform-provider-gitea => github.com/tfmm/terraform-provider-gitea v0.10.1` (tfmm v0.10.1: `go.mod` line 1). It isn't in nixpkgs (`providers.json` has only `go-gitea_gitea`).

### `maxsargentdev/terraform-provider-gitea`: a framework rewrite

- **Maintenance:** one maintainer, 2 stars, latest tag `v0.12.0` (2026-06-24) (GitHub search API; `https://proxy.golang.org/github.com/maxsargentdev/terraform-provider-gitea/@latest`). Its README says it is a rewrite on the plugin framework because the official provider "doesnt receive frequent updates", and that it's for fixing drift in team unit permissions (maxsargentdev v0.12.0: `README.md`).
- **Licence:** MIT (`LICENSE`).
- **Coverage:** org (`internal/provider/org_resource.go`) and repo with `mirror`, `migration_clone_address` and `migration_mirror_interval` (`internal/provider/repository_resource.go` lines 71–84, 372–390). Its schema is generated from Gitea **1.25.3** OpenAPI (`openapi/1.25.3/`). There's no push mirror resource (no file mentions `push_mirror`).
- **Bridging:** awkward on three counts:
  - the provider lives in `internal/provider`, so a bridge needs the same "shim module rooted under the upstream path" trick `pulumi-provider-git/provider/shim/shim.go` uses for `terraform-provider-git`;
  - its `go.mod` declares a misspelt module path, `github.com/maxsargendev/terraform-provider-gitea`;
  - it uses `replace code.gitea.io/sdk/gitea => ./gitea-sdk/gitea` (`go.mod` lines 1, 69). Go ignores `replace` directives in dependencies, so a consumer has to repeat that replace itself.

### Dead or minor ones

- **`Lerentis/terraform-provider-gitea`:** archived on GitHub, MIT, last tag `v0.16.0` (2023-07-20), module `git.uploadfilter24.eu/terraform-provider-gitea`, no push mirror (GitHub search API; Lerentis v0.16.0 zip). The official provider took it over (see its LICENSE above).
- **`nlamirault/terraform-provider-gitea`:** MPL-2.0, no tags, last pseudo-version from 2022-01-14, no push mirror (Go proxy `@latest`; zip `LICENSE` and grep).
- **`floriancartron/terraform-provider-gitea`:** a fork of the official provider with a `v0.8.2-headers.1` tag (2026-10-30), MIT, no push mirror (Go proxy; zip grep).

## Pulumi packages

There's no first-party `@pulumi/gitea`. An npm search for "pulumi gitea" turns up only `@sapslaj/pulumi-gitea` among Gitea packages (`registry.npmjs.org/-/v1/search?text=pulumi%20gitea`). The PyPI `pulumi-gitea` is MaienM's. The Pulumi Registry itself couldn't be reached from here.

### `MaienM/pulumi-gitea`: a static bridge, stale

- Published as `@maienm/pulumi-gitea` and `pulumi_gitea` `0.0.3`, last released 2024-04-10, Apache-2.0, 3 stars (npm and PyPI metadata; GitHub search API).
- It's a conventional `pulumi-terraform-bridge` v3.73.0 provider. It wraps `shimv2.NewProvider(gitea.Provider())` over the official provider pinned to **v0.3.0**, through `replace code.gitea.io/terraform-provider-gitea => github.com/go-gitea/terraform-provider-gitea v0.3.0` (`github.com/!maien!m/pulumi-gitea/provider` zip: `go.mod` lines 8, 10, 239; `resources.go` line 97).
- No push mirror, since upstream has none. It is useful only as evidence that the official provider bridges statically with a module `replace`.

### `@sapslaj/pulumi-gitea`: a dynamic bridge of the official v0.8.1

- npm `0.7.0` and `0.8.1` (2026-07-29). The `license` field is unset, and the repo `sapslaj/pulumi-gitea` has no licence and 0 stars (npm metadata; GitHub search API).
- It isn't a bridged provider binary. Its `package.json` `pulumi` block names plugin `terraform-provider` `1.2.1` with a parameterization that decodes to `{"remote":{"url":"registry.opentofu.org/go-gitea/gitea","version":"0.8.1"}}` (`package/package.json` in the tarball). That is the same mechanism as control-plane's `b2` (`packages: b2: source: terraform-provider` in `control-plane/Pulumi.yaml`). The README calls it "not a full bridged provider due to some limitations with how the upstream provider is set up".
- Its resources mirror the official provider's (`org`, `repository`, …), with no push mirror (`package/dist/*.d.ts`).

## Bridging and pinning in this repo's flake

How `pulumi-provider-git` is done today:

- It is a separate repo whose flake declares `pulumi.terraformBridgeProviders.pulumi-resource-git` through `UnstoppableMango/pulumi2nix`. That builds `pulumi-tfgen-git`/`pulumi-resource-git`, the schema, and the SDKs from a `provider/` tree with `resources.go`, `cmd/` and a `shim/` module (`pulumi-provider-git/flake.nix`; `provider/go.mod` line 254; `provider/shim/shim.go`).
- On current `main`, this repo takes the provider binary from that flake input onto the dev shell's PATH, and `check-pulumi-plugins` compares its version against the SDK's (`flake.nix`; `scripts/check-pulumi-plugins.sh`).
- The SDK no longer comes from the nix store. #98 replaced `vendor-git-sdk` with a release-tarball URL in `package.json`, because the Pulumi Kubernetes Operator's workspace pod runs only `bun install` (commit `637d88d`).

What that means for Gitea:

- **Official provider, static bridge:** feasible. It's SDKv2, the constructor is exported, and the module path resolves. A `pulumi-provider-gitea` repo shaped like `pulumi-provider-git` would need `shimv2` instead of `pf.ShimProvider`. MaienM's bridge shows the shape works.
- **tfmm fork, static bridge:** the same work plus one `replace` line, and it's the only route that gets `gitea_push_mirror`. The cost is depending on a two-month-old, single-maintainer fork.
- **Dynamic bridge** (`pulumi package add terraform-provider go-gitea/gitea`, as sapslaj and control-plane's `b2` do) needs no new repo. But the Terraform provider and the `terraform-provider` plugin are fetched at run time, so the flake doesn't pin them. iam already lives with that for keycloak (`iam/AGENTS.md`). Whether the dynamic bridge can point at the nixpkgs `go-gitea_gitea` binary instead of the registry wasn't checked.
- **Secrets:** in any bridged form, a `Sensitive` attribute such as `remote_password` or `migration_service_auth_password` comes out as a Pulumi secret (`pkg/tfbridge/schema.go` lines 1290–1292, pulumi-terraform-bridge v3.137.0).
- **Replacements:** a `ForceNew` change becomes a Pulumi replace. Pulumi's default is create-before-delete, and that's harmless here: Gitea gives the new push mirror its own random `remote_name`, so the old and new mirrors run side by side until the old one is deleted.

## Bottom line for the ticket

- The official provider, the tfmm fork and the maxsargentdev rewrite can all manage an org, a repo, and a pull mirror created by migrating from an https URL with `mirror = true`. The one maintained upstream is the official `go-gitea/gitea` v0.8.1: MIT, SDKv2, in nixpkgs, and statically bridgeable.
- The official provider and the tfmm fork can't rotate a pull mirror's password after creation. Gitea 28's `EditRepoOption` could take one, but neither sends it. The maxsargentdev rewrite wasn't checked for this.
- **No upstream provider and no Pulumi package manages push mirrors.** The only one is the `tfmm/gitea` fork's `gitea_push_mirror` (MIT, v0.10.1, one maintainer, tested against Gitea 28.0.0). It handles the missing update endpoint by making every field `ForceNew`, and the unreadable `remote_password` by keeping it `Sensitive` in state, so a token rotation or a first apply after import replaces the mirror.
- The existing Pulumi packages (MaienM's stale static bridge of v0.3.0, and sapslaj's unlicensed dynamic bridge of v0.8.1) add nothing beyond the official provider.
- The realistic paths:
  - (a) bridge the official provider in a `pulumi-provider-gitea` repo shaped like `pulumi-provider-git`, and manage push mirrors some other way, such as a small custom resource or a dynamic provider over the four push mirror endpoints;
  - (b) bridge the tfmm fork through a `replace` and accept the fork risk;
  - (c) upstream tfmm's resource to gitea.com first.
- The ticket's "Gitea 1.25" is out of date: `apps/gitea` runs Gitea 28.2.0.
