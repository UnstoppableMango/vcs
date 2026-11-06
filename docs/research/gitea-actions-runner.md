# How would Gitea Actions jobs run in the cluster?

Research for UnstoppableMango/vcs#134 (feeds #135 and #110), done 2026-11-06.

The question: how would Gitea Actions jobs for repositories homed on `gitea.thecluster.io` run in rosequartz, and can they run what these repos need: `nix flake check`, nix builds, and Pulumi previews?
That covers the runner on Kubernetes and its backends, registration tokens and runner scope, nix inside jobs, declaring the runner as code, and the alternatives (GitHub Actions on mirrors, the knot's spindle).

Claims marked **(inferred)** were reasoned from the sources, not read in them.

## Sources

gitea.com, docs.gitea.com, dl.gitea.com and docker.gitea.com were all refused by the session proxy, so nothing was read from them directly.
The runner was read from the Go module proxy, which serves a zip of `gitea.com/gitea/runner` at any commit.
The two Helm charts were read from vendored copies in other GitHub repositories, at the versions named below.
Gitea itself was read from `go-gitea/gitea` on GitHub at tag `v28.3.0`, the version the cluster runs.

| Tag | Source |
| --- | --- |
| [runner-k8s] | `gitea.com/gitea/runner` `docs/kubernetes.md`, at main `c8b16f4` (2026-11-06), via `proxy.golang.org/gitea.com/gitea/runner/@v/v1.0.9-0.20261106033259-c8b16f47922b.zip` |
| [runner-examples] | same snapshot, `examples/kubernetes/{README.md,kubernetes-pods.yaml,dind-docker.yaml,rootless-docker.yaml}` |
| [runner-config] | same snapshot, `internal/pkg/config/config.example.yaml` |
| [runner-readme] | same snapshot, `README.md` (Prerequisites), `docs/builtin-actions.md` |
| [runner-labels] | same snapshot, `internal/pkg/labels/labels.go` |
| [runner-run] | same snapshot, `scripts/run.sh`, and `Dockerfile` in act_runner v1.0.8 |
| [runner-tags] | Docker Hub tag listing for `gitea/runner`, `hub.docker.com/v2/repositories/gitea/runner/tags`, 2026-11-06 |
| [helm-actions] | `gitea/helm-actions` chart 0.1.2 as vendored in Obmondo/KubeAid `argocd-helm-charts/gitea-actions/charts/actions` @ `b294b74`: `values.yaml`, `templates/statefulset.yaml`, `scripts/token.sh` |
| [gitea-chart] | Gitea chart 12.7.0 as vendored in rancher/partner-charts `main-source` `charts/commitgo/gitea/12.7.0` @ `511d213`: `templates/gitea/check-actions-not-present.yaml`, `README.md` |
| [gitea-token] | go-gitea/gitea v28.3.0 `services/actions/init.go`, `models/actions/runner_token.go`, `routers/api/actions/runner/runner.go` |
| [gitea-api] | go-gitea/gitea v28.3.0 `routers/api/v1/api.go` (runner routes), `routers/api/v1/shared/runners.go`, `cmd/actions.go` |
| [gitea-settings] | go-gitea/gitea v28.3.0 `modules/setting/actions.go` |
| [gitea-perms] | go-gitea/gitea v28.3.0 `services/actions/permission_parser.go` |
| [gitea-notify] | go-gitea/gitea v28.3.0 `services/actions/notifier.go` (`SyncPushCommits`) |
| [pulumi-gitea] | npm `@sapslaj/pulumi-gitea` 0.8.1, `dist/` (bridges the go-gitea Terraform provider) |
| [arc] | UnstoppableMango/the-cluster `apps/arc-runners/helm-release.yml`, `docs/arc-scale-set-removal.md` |
| [runner-image] | unmango/containers `images/actions-runner/default.nix` (the image ARC runners use) |
| [nested] | UnstoppableMango/the-cluster `docs/nested-containers.md` |
| [spindle] | UnstoppableMango/the-cluster `apps/spindle/helm-release.yml` |
| [gitea-hr] | UnstoppableMango/the-cluster `apps/gitea/helm-release.yml` |
| [eso] | UnstoppableMango/the-cluster `infrastructure/configs/external-secrets-system/cluster-secret-store.yml`, `apps/vcs/{external-secret,stack}.yml` |
| [hercules] | UnstoppableMango/the-cluster `apps/hercules-ci/helm-release-unmango.yml`, `docs/hercules-ci-store.md` |
| [vcs-ci] | UnstoppableMango/vcs `.github/workflows/ci.yml`; unmango/actions `setup-nix/action.yml` @ `e8bbcbd` |
| [spindle-ci] | UnstoppableMango/vcs `docs/research/spindle-ci.md` on branch `research/spindle-ci` (#103) |

## What the cluster already does for CI

This matters because most of the Gitea answer is "do what ARC already does".

- GitHub Actions jobs already run in rosequartz through ARC (`gha-runner-scale-set`): 38 UnstoppableMango repositories with one scale set each, plus one org-level scale set for `unmango` (`apps/unmango-runners`) [arc].
- Each runner pod is the job environment: `ghcr.io/unmango/actions-runner`, with a `privileged: true` dind native sidecar for Docker steps [arc].
  These pods do not use the `nested-containers` RuntimeClass; only the spindle and `apps/claude` do [arc] [spindle] [nested].
- nix in that image is a static, daemonless binary with `sandbox = false` and `store = local`, and `/nix` is a 20Gi ephemeral `fast-rwo` volume per pod (50–75Gi for dotfiles and nixos) [runner-image] [arc].
- `NIX_CONFIG` adds the in-cluster ncps proxy, `http://ncps.nix-system.svc.cluster.local:8501`, as a substituter [arc].
- There is no `/dev/kvm` anywhere in the-cluster's manifests (searched for `kvm`), so no in-cluster runner, ARC included, can run NixOS VM tests today **(inferred from the search)**.

So the bar for "can Gitea run our jobs" is the ARC bar: unsandboxed single-user nix, no KVM, good egress, ncps and Cachix.

## act_runner (now "Gitea Runner")

### Naming and versions

- The project is now `gitea.com/gitea/runner`, the binary `gitea-runner`, and the image `gitea/runner` (also `docker.gitea.com/runner`) [runner-run] [runner-readme].
  Old references to `act_runner` and `gitea/act_runner` are the same project.
- Releases move fast: Docker Hub had `5.4.1` (and `-dind`, `-dind-rootless` variants) published 2026-11-05 [runner-tags].
  The helm-actions chart 0.1.2 still defaults to runner `2.0.1` [helm-actions], so pin a current tag explicitly.

### Backends

A runner label is `name:scheme:arg`, and the scheme picks the backend [runner-labels]:

| Scheme | Where a job runs | Notes |
| --- | --- | --- |
| `host` | directly in the runner's own process environment | No isolation between jobs beyond what the pod gives. Job hosts need `bash`, `node` (JS actions, `hashFiles()`), and `git` [runner-readme]. |
| `docker` | a container from the label's image, on a Docker daemon | Needs a reachable `docker`/`podman`; every workflow feature works [runner-readme] [runner-examples]. |
| `kubernetes` | a pod per job, created by the runner through the API server | New: present on main as of 2026-11-06 [runner-labels] [runner-k8s]. Which release first shipped it was not checked (the release notes are on gitea.com). |

There is no autoscaler equivalent to ARC's scale sets: a runner process polls Gitea and runs up to `runner.capacity` jobs [runner-config].
Scaling is replica count times capacity **(inferred: no autoscaling component in the runner repo, docs or chart)**.
The runner can register as `--ephemeral` (env `GITEA_RUNNER_EPHEMERAL` in the image), taking exactly one job [runner-run].

### The Kubernetes options, upstream's view

The upstream examples README frames it as two choices [runner-examples]:

- **Job pods** (`kubernetes` labels): "each job runs as its own pod, without privileged containers and under the cluster's quotas and policies. Docker actions and `docker://` steps are not supported."
- **Docker in Docker**: "Every workflow feature works, but the daemon is privileged, so a job can break out to the node." Manifests: `dind-docker.yaml`, `statefulset-dind.yaml`, `rootless-docker.yaml`, or the helm-actions chart.

Rootless DinD is not unprivileged on Kubernetes: the upstream `rootless-docker.yaml` still sets `privileged: true` on the `gitea/runner:latest-dind-rootless` container [runner-examples].
In rosequartz the `nested-containers` RuntimeClass is the better version of the same idea: the pod runs in a user namespace, so root in it, dockerd included, is an unprivileged uid on the node [nested].

#### `kubernetes` backend details

- The runner needs a Role with `pods` create/get/list/delete, `pods/exec` create/get, `pods/log` get, `secrets` create/delete; Kubernetes 1.30+; job images need `sh`, `tar`, `tail`, `env` [runner-k8s].
- `kubernetes.pod_template` is merged under every job pod (a container named `job` merges into the job container), and `pod_templates` are keyed by `runs-on` labels [runner-k8s].
  A template volume named `workspace` replaces the default `emptyDir` [runner-k8s].
  So per-job `resources`, `nodeSelector`, a `/nix` volume, `runtimeClassName` and `securityContext` can all be set here **(inferred: the template is a pod spec fragment merged under the generated one)**.
- Job pods mount no service account token unless the template sets `automountServiceAccountToken: true` [runner-k8s].
- Unsupported: Docker actions, `docker://` steps, and job-container `options`/`volumes`/`credentials` [runner-k8s].
- The runner has built-in `builtin:checkout`, `builtin:upload-artifact` and `builtin:download-artifact`, which need no Node in the job image [runner-readme].
  Third-party JavaScript actions (`cachix/cachix-action`, `actions/checkout`) still need `node` in the job image [runner-readme].

### The helm-actions chart

- Gitea chart 12.x no longer deploys runners: if any `actions:` value is set it fails with "The actions sub-chart has been outsourced to a dedicated chart available at https://gitea.com/gitea/helm-actions" [gitea-chart].
  The 12.0.0 upgrade notes call the new chart young and maintained by a separate group [gitea-chart].
- helm-actions 0.1.2 renders a StatefulSet: a `reach-gitea` busybox init container, a `dind` native sidecar, and the runner container with `GITEA_RUNNER_REGISTRATION_TOKEN` from `existingSecret`/`existingSecretKey`, `GITEA_INSTANCE_URL` from `giteaRootURL`, and `runner.config` mounted as `config.yaml` [helm-actions].
- The `dind` sidecar's `securityContext: privileged: true` is hard-coded in the template; there is no value to change it [helm-actions].
  `statefulset.runtimeClassName` exists, but the cluster's admission policy rejects any `nested-containers` pod with a privileged container [nested].
  So using the chart with `nested-containers` needs a Flux `postRenderers` patch, exactly as `apps/spindle` does for its chart **(inferred)** [spindle].
  Without the RuntimeClass, the chart works as-is in the cluster's style of ARC: a privileged dind [arc].
- The chart only covers the `docker` backend; it has no RBAC for `kubernetes` labels [helm-actions].

## Registration tokens and runner scope

- Runners are registered against a token with one of three scopes [gitea-token]:
  global (instance), owner (an org or user), or a single repository.
  A runner can only pick up jobs inside its scope **(inferred from the scope model; not traced through job assignment)**.
- API endpoints, all `POST .../actions/runners/registration-token` [gitea-api]:
  `/admin/...` (site admin, instance scope), `/orgs/{org}/...`, `/repos/{owner}/{repo}/...`, `/user/...`.
  The same groups expose `GET` list/get, `DELETE` and `PATCH` for runners; there is no endpoint to create a runner directly [gitea-api].
- The `POST` returns the latest active token for that scope and only mints a new one when none is active [gitea-api].
  A token stays active after a runner registers with it, so one token can register many runners, including ephemeral re-registrations [gitea-token].
  It is invalidated only when a new token is generated for the same scope (the UI's reset) [gitea-token].
- CLI: `gitea actions generate-runner-token --scope {owner}[/{repo}]`, empty scope for a global runner [gitea-api].
- **Pre-shared global token.** Setting `GITEA_RUNNER_REGISTRATION_TOKEN` (or `..._FILE`) in Gitea's own environment, at least 32 characters, makes Gitea insert that exact value as the active global token at startup [gitea-token].
  The runner reads the same variable name [runner-run].
  If the token was later invalidated (someone reset it in the UI), Gitea only logs a warning and does not reactivate it [gitea-token].
- Once registered, the runner keeps its credentials in `/data/.runner`; the image's `run.sh` registers only when that file is empty, and unsets the registration token before starting the daemon [runner-run].
  That file has to persist for a long-lived runner (the examples use a PVC) [runner-examples].

## Nix inside jobs

### What works

- **Unsandboxed nix builds and `nix flake check` without VM tests**: yes, on any backend, the same way ARC does it today.
  The simplest image is `ghcr.io/unmango/actions-runner` itself: it has static `nix`, `git`, `make`, and the GitHub runner base's Node in `externals` (not on `PATH`) [runner-image].
  For `docker`/`kubernetes` labels, the job image would need `node` on `PATH` for JS actions [runner-readme]; with `host` labels, Node comes from wherever the runner runs **(inferred)**.
- **IFD**: single-user root (or daemonless) nix honours `--option`/`NIX_CONFIG`, as #103 found for the spindle [spindle-ci].
- **Timeouts**: the runner's `runner.timeout` defaults to 3h, and Gitea's `ENDLESS_TASK_TIMEOUT` defaults to 3h [runner-config] [gitea-settings].
  Nothing resembles the spindle's 5-minute default [spindle-ci].
- **Caching**:
  - Reads: `runner.envs` (all backends) or `pod_template` env (`kubernetes`) can set `NIX_CONFIG` with ncps as substituter, exactly the ARC value [runner-config] [runner-k8s] [arc].
    Cachix `unstoppablemango` (or `unmango`) as an `extra-substituter` works the same way [spindle-ci].
  - Pushes: `cachix/cachix-action` with a `CACHIX_AUTH_TOKEN` secret, as the GitHub workflows do [vcs-ci].
    Gitea withholds secrets from fork pull requests **(inferred from `isForkPullRequestInput`, not traced)**.
  - The runner's built-in `actions/cache` server is unsuitable for a nix store **(inferred)**; the Hercules agents show that a long-lived store on a PVC is the thing that pays off, at the cost of GC care [hercules].
- **Store location**: give `/nix` its own volume, as ARC does; overlayfs under nix breaks build-dir teardown [arc].
  With `docker` labels, that means a `container.options: --volume ...` allowed by `valid_volumes` [runner-config]; with `kubernetes` labels, a `pod_template` volume [runner-k8s].

### Bubblewrap and other sandboxing

The spindle could not run bubblewrap because its engine drops all capabilities and keeps Docker's default seccomp profile, with no knob to change it [spindle-ci].
Gitea Runner exposes those knobs to the operator:

- `docker` backend: `container.privileged` and `container.options` (e.g. `--security-opt seccomp=unconfined --cap-add SYS_ADMIN`) apply to every job container from the runner config; workflow-supplied `--security-opt`/`--device`/`--cap-add` are ignored unless `privileged` is on [runner-config].
  Inside a `nested-containers` pod, a privileged job container is privileged only within the pod's user namespace [nested] **(inferred)**.
  A privileged Docker container also gets an unmasked `/proc`, which `bwrap --proc` needs [spindle-ci] **(inferred: Docker drops masked paths for privileged containers)**.
- `kubernetes` backend: `pod_template` can carry `runtimeClassName: nested-containers`, `hostUsers: false`, `procMount: Unmasked`, an unconfined seccomp profile and added capabilities, the dind recipe from [nested] applied to the job container instead **(inferred: not tested; the admission policy allows it because nothing is `privileged`)**.

Either way, bubblewrap and `sandbox = true` become possible where they were not on the spindle **(inferred)**.

### KVM: still no

No backend changes the fact that no rosequartz node exposes `/dev/kvm` to pods (no device plugin or hostPath for it in the-cluster) **(inferred from the search above)**.
cairn's two clan NixOS VM tests stay off any in-cluster runner, ARC included [spindle-ci].

## Pulumi previews

- **The OIDC blocker.** Gitea v28.3.0 parses but does not support the `id-token` permission (it is in the "Scopes github supports but gitea does not" list) [gitea-perms].
  vcs's `pulumi` job logs into Azure through GitHub OIDC (`azure/login`, `id-token: write`) to read the passphrase and state-bucket keys from Key Vault [vcs-ci].
  That step cannot work on Gitea Actions as written **(inferred)**.
- **Ways round it, all in-cluster:**
  - Gitea Actions secrets for `PULUMI_CONFIG_PASSPHRASE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, declared through `@sapslaj/pulumi-gitea`'s `OrgActionsSecret`/`RepositoryActionsSecret` [pulumi-gitea].
    The values would have to come out of Key Vault into the program that declares them **(inferred)**.
  - Or a Kubernetes Secret from an `ExternalSecret`, as `apps/vcs` already does for the Pulumi Kubernetes Operator Stack, fed to jobs through `runner.env_file` or a `pod_template` `envFrom` [eso] [runner-config] [runner-k8s].
    The `azure-unstoppablemango-pulumi` ClusterSecretStore is currently conditioned to the `vcs` namespace only, so a runner namespace would need adding [eso].
- **Reaching in-cluster APIs**: a runner in the cluster can reach `gitea-http.gitea.svc.cluster.local:3000`, which is also what the upstream examples use as `GITEA_INSTANCE_URL` [runner-examples].
  This is the same reason iam's Pulumi job runs on ARC (Keycloak behind Cloudflare and Anubis) [arc].
- `pulumi up` for vcs already runs in-cluster through the Operator's `Stack` [eso], so CI only needs previews.
- Workflow syntax: Gitea evaluates `concurrency.group` and `cancel-in-progress` **(read in `services/actions/concurrency.go`)**, but there is no sign it evaluates GitHub's newer `queue: max` used in vcs's `pulumi` job **(inferred)** [vcs-ci].
  `DEFAULT_ACTIONS_URL` defaults to `github`, so `uses: actions/checkout@...` and `unmango/actions/setup-nix@...` resolve against github.com, and `.github/workflows` is read alongside `.gitea/workflows` [gitea-settings].

## Declaring the runner as code

| Piece | Where it can live | Notes |
| --- | --- | --- |
| Runner Deployment/StatefulSet | the-cluster, as a Flux HelmRelease (helm-actions) or plain manifests | helm-actions needs a post-render patch for `nested-containers` [helm-actions] [spindle]. The upstream `kubernetes-pods.yaml` is a short StatefulSet plus Role [runner-examples]. |
| Runner config (labels, capacity, `NIX_CONFIG`, pod templates) | the same HelmRelease's `runner.config`, or a ConfigMap | [helm-actions] [runner-config] |
| Registration token | see below | |
| Gitea Actions secrets/variables (Cachix token, Pulumi creds) | `@sapslaj/pulumi-gitea`: `OrgActionsSecret`, `OrgActionsVariable`, `RepositoryActionsSecret`, `RepositoryActionsVariable`, `UserActionsSecret` | [pulumi-gitea] |
| Registration token via Pulumi | `@sapslaj/pulumi-gitea`'s `getActionsRunnerRegistrationToken` invoke (`scope`, `org`, `repository`, `repositoryOwner` in; `token` out) | An invoke, not a resource; idempotent because the API returns the active token [pulumi-gitea] [gitea-api]. There is no runner resource, only `getActionsRunners` [pulumi-gitea]. |

### How the token reaches the cluster

Three workable paths, simplest first:

1. **Pre-shared global token, one secret, no API call.**
   Generate a ≥32-character random value once, put it in Key Vault (or seal it), and deliver it with one `ExternalSecret`/`SealedSecret` into both the `gitea` namespace (as `GITEA_RUNNER_REGISTRATION_TOKEN` via the chart's `deployment.env`, already used for the `PG*` variables [gitea-hr]) and the runner namespace [gitea-token] [runner-run].
   It is instance-scoped, which fits one runner pool serving the `unmango` org.
   The catch: resetting the global token in the admin UI silently orphans it until the value is rotated [gitea-token].
2. **The Seed reads the token and writes the Secret.**
   The forge Seed already runs in-cluster under the Pulumi Kubernetes Operator and owns the org and bot user (ADR 0001) **(inferred: from `docs/adr/0001-seed-stays-thin.md`)**.
   It could call `getActionsRunnerRegistrationToken({ scope: 'org', org: 'unmango' })` and write a Kubernetes `Secret` into the runner namespace [pulumi-gitea].
   That keeps the token org-scoped, but it grows the Seed past "prepares the forge" and gives it write access to another namespace.
3. **Manual**: generate in the UI or with `gitea actions generate-runner-token`, then seal it [gitea-api].
   This is what helm-actions' own `scripts/token.sh` expects someone to have done [helm-actions].

External-secrets cannot fetch a token from the Gitea API by itself **(inferred: not checked against the external-secrets webhook provider, which could in principle POST to the endpoint with an admin token)**.

## A sketch that fits rosequartz

Not a decision (that is #135), just the shape the sources support:

- One runner pool in a `gitea-runners` namespace, org-scoped or global, `nodeSelector: gaea` like the other heavy CI [arc] [hercules].
- Either:
  - **`kubernetes` labels**, e.g. `nix:kubernetes://ghcr.io/unmango/actions-runner:<pin>`, with a `pod_template` giving the job container an ephemeral 20Gi `fast-rwo` `/nix`, `NIX_CONFIG` for ncps, and ARC's resource numbers [runner-k8s] [arc].
    No privileged containers at all, one pod per job, cleaned up by the runner [runner-k8s].
    The job image needs `node` on `PATH` for JS actions such as `cachix/cachix-action`, which `ghcr.io/unmango/actions-runner` does not have **(inferred from [runner-image]: Node is in `externals`)**.
  - or **`docker` labels** on a `nested-containers` dind pod, copying the spindle's sidecar block [spindle], for workflows that need Docker steps.
- `GITEA_RUNNER_REGISTRATION_TOKEN` from a pre-shared secret (path 1 above).
- Gitea Actions secrets for Cachix declared in vcs or scm through `@sapslaj/pulumi-gitea` [pulumi-gitea].

## Alternatives

### Keep CI on GitHub Actions for mirrored repos

- Already works: ARC runs those jobs in the cluster today, with nix, ncps and Cachix [arc].
- Pull-mirror caveat: Gitea fires `push` workflows on mirror syncs (`SyncPushCommits` notifies a push event) [gitea-notify], and it reads `.github/workflows` [gitea-settings].
  So once any Gitea runner exists, a mirror of a GitHub-homed repo would run its GitHub workflow a second time on Gitea, unless Actions is disabled on mirrors or no runner matches its `runs-on` labels **(inferred)**.
  A job whose `runs-on` no runner offers just waits; Gitea's `ABANDONED_JOB_TIMEOUT` (24h default) cleans it up [gitea-settings].
- Doesn't help repos whose **Home** is Gitea: GitHub only sees them as a **Mirror**, so pull requests (made on the Home) never reach GitHub Actions **(inferred from CONTEXT.md's Home/Mirror rules)**.
  Push-to-main CI on the GitHub mirror is possible, but results would not gate anything on Gitea.

### The knot's spindle

- Only for repositories on a Tangled knot; it triggers on Tangled events, not Gitea's [spindle-ci].
- As deployed: 5-minute default timeout, no bubblewrap (capabilities dropped, default seccomp, masked `/proc`, none configurable without spindle code changes), no KVM [spindle-ci].
- Gitea Runner exposes the knobs the spindle lacks (job timeouts, privileged/options, pod templates) [runner-config] [runner-k8s].

## Bottom line

Yes, with ARC's limits.
A Gitea Runner in rosequartz can run unsandboxed nix builds, `nix flake check` without VM tests, and Pulumi previews, as ARC runners already do for the GitHub repos: the same runner image, a `/nix` volume, ncps through `NIX_CONFIG`, and Cachix.
There is no 5-minute cap (3h by default on both sides).

How it runs:

- The Gitea chart 12.7.0 no longer deploys runners. Use the separate helm-actions chart, whose dind is hard-coded `privileged` and needs a post-render patch for `nested-containers`, or plain manifests.
- The runner's new `kubernetes` backend runs each job as its own unprivileged pod, configured through `pod_template`. It can't run Docker actions.
- Registration tokens are global, org/user or repo scoped. A token is reusable until it is reset.
- The easiest declarative path is a pre-shared ≥32-character `GITEA_RUNNER_REGISTRATION_TOKEN` delivered by one external-secret or sealed secret to both Gitea and the runner.
- `@sapslaj/pulumi-gitea` can read a token (`getActionsRunnerRegistrationToken`) and declare Actions secrets. It has no runner resource.

The gaps:

- Gitea v28.3.0 has no `id-token` support, so Azure OIDC logins in Pulumi jobs must be replaced with Gitea secrets or an in-cluster `ExternalSecret`.
- No KVM anywhere in the cluster, so NixOS VM tests stay on GitHub-hosted runners.
- Gitea pull mirrors would re-run GitHub workflows once a runner exists.
