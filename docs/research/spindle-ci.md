# Can cairn's `nix flake check` run on the spindle?

Research for UnstoppableMango/vcs#103 (map #99), done 2026-11-01.

The question: can a workflow on the spindle at `spindle.thecluster.io` run cairn's CI, which is `nix flake check --option allow-import-from-derivation true` and needs unprivileged user namespaces for bubblewrap?
Can it use the Cachix cache `unstoppablemango`?
What would `.tangled/workflows/ci.yml` look like?

Claims marked **(inferred)** were reasoned from the sources, not read in them.

## Sources

Tangled's repository could not be cloned here: `git clone https://tangled.org/tangled.org/core` redirects to `knot1.tangled.sh`, and the raw-file endpoint redirects to `api.tangled.org`, and the session proxy refuses both.
Everything from Tangled was read from the rendered `blob/master/...` pages on tangled.org, as of 2026-11-01.
`docs/DOCS.md` no longer exists on master; the docs are now an Astro site under `docs/src/content/docs/`.

| Tag | Source |
| --- | --- |
| [nixery-engine] | https://tangled.org/tangled.org/core/blob/master/spindle/engines/nixery/engine.go |
| [nixery-setup] | https://tangled.org/tangled.org/core/blob/master/spindle/engines/nixery/setup_steps.go |
| [nixery-env] | https://tangled.org/tangled.org/core/blob/master/spindle/engines/nixery/cache.go (`baseEnv`) |
| [nixery-seats] | https://tangled.org/tangled.org/core/blob/master/spindle/engines/nixery/seats.go |
| [wf-ref] | https://tangled.org/tangled.org/core/blob/master/docs/src/content/docs/spindles/workflows.md |
| [wf-guide] | https://tangled.org/tangled.org/core/blob/master/docs/src/content/docs/spindles/writing-workflows.md |
| [secrets] | https://tangled.org/tangled.org/core/blob/master/docs/src/content/docs/spindles/secrets.md |
| [spindle-cfg] | https://tangled.org/tangled.org/core/blob/master/docs/src/content/docs/reference/spindle-config.md |
| [helm-release] | UnstoppableMango/the-cluster `apps/spindle/helm-release.yml` @ `0fd4a10` |
| [nested] | UnstoppableMango/the-cluster `docs/nested-containers.md` |
| [ncps] | UnstoppableMango/the-cluster `docs/ncps.md`, `apps/nix-system/deployment.yml` |
| [cairn-ci] | UnstoppableMango/cairn `.github/workflows/ci.yml` |
| [cairn-flake] | UnstoppableMango/cairn `flake.nix`, `checks/*.nix` |
| [clan-test] | clan-core 26.05 tarball (the version cairn pins): `lib/clanTest/flake-module.nix`, `lib/clanTest/vars-executor.nix`, `lib/flake-parts/clan-nixos-test.nix` |
| [nixos-test-run] | https://github.com/NixOS/nixpkgs/blob/nixos-unstable/nixos/lib/testing/run.nix (`requiredFeatures`) |
| [nix-settings] | https://github.com/NixOS/nix/blob/master/src/libstore/include/nix/store/globals.hh (`system-features`), `src/libexpr/include/nix/expr/eval-settings.hh` (`allow-import-from-derivation`) |
| [moby-seccomp] | https://github.com/moby/profiles/blob/main/seccomp/default.json |

## What the spindle actually runs

- The cluster's spindle comes from the `rubxkube/spindle` Helm chart, version 0.1.2, with no image override; its only engine setting is `SPINDLE_NIXERY_PIPELINES_MAX_CONCURRENT_WORKFLOWS: 4` [helm-release].
  The chart's spindle version could not be read: both `rubxkube.github.io` and the `rubxkube/charts` GitHub repo were blocked here.
  The Tangled code below is master, so the deployed version may differ.
  One sign it does: the HelmRelease comment budgets `4 x 4096` MiB per job, while master's default `SPINDLE_NIXERY_PIPELINES_MAX_JOB_MEMORY_MB` is 6144 [helm-release] [spindle-cfg].
- No microVM engine is configured: `SPINDLE_MICROVM_PIPELINES_IMAGE_DIR` is required by microVM workflows and is unset [spindle-cfg] [helm-release].
  So `engine: nixery` is the only usable option **(inferred)**.
- The spindle pod runs in a user namespace (`hostUsers: false`, RuntimeClass `nested-containers`), with dockerd as a native-sidecar `dind` container that has all capabilities inside the pod's namespaces, unconfined seccomp/AppArmor, and `procMount: Unmasked` [helm-release] [nested].
  Workflow containers are children of that dockerd [helm-release].
- The nixery engine creates one container per workflow from a Nixery image of the `nixpkgs` dependencies plus `bash git coreutils gnutar zstd nix`, then runs each step with `docker exec` into that container [nixery-engine].
  The docs say each step runs in a fresh container [wf-ref]; the code shows a single container for the whole workflow, so `/nix/store` persists across steps [nixery-engine].
- That container is created with `CapDrop: ALL`, `CapAdd: [CAP_DAC_OVERRIDE, CAP_CHOWN, CAP_FOWNER, CAP_SETUID, CAP_SETGID]`, `SecurityOpt: [no-new-privileges]`, a tmpfs `/tmp`, a memory limit, and no devices; it sets no seccomp option [nixery-engine].
  It is attached to a plain `bridge` network, so it has normal outbound access [nixery-seats].
- The setup step writes `/etc/nix/nix.conf` with `extra-experimental-features = nix-command flakes`, `build-users-group =` (empty) and `sandbox = false` [nixery-setup].
  `HOME` is `/tangled/home` and the profile bin dir is on `PATH` [nixery-env].
  The container sets no user, so steps run as the image's default user, root **(inferred)**, with no nix-daemon: nix is single-user **(inferred from the empty build-users-group and the absence of any daemon start)**.
- Default workflow timeout is `5m` (`SPINDLE_NIXERY_PIPELINES_WORKFLOW_TIMEOUT`), counting time spent waiting for a slot [spindle-cfg] [wf-ref].
  The HelmRelease does not override it [helm-release].

## What cairn's check needs

- cairn's flake check runs in about 11 minutes on GitHub (main runs on 2026-10-26: 22:43:56 to 22:55:10, and 22:30:22 to 22:41:04, from the Actions API).
- cairn declares two `clan.nixosTests` (`single-node-cluster`, `nix-snapshotter`) [cairn-flake]; clan's test module turns those into `checks` on Linux [clan-test].
  These are NixOS VM tests: nixpkgs requires the `kvm` system feature for any test with nodes on Linux [nixos-test-run], and nix only adds `kvm` to `system-features` when `/dev/kvm` is accessible [nix-settings].
- The bubblewrap need comes from the same tests: clan's test module builds a `test-vars-generated` derivation during evaluation (an IFD, its own comment says so) that runs each vars generator under `bwrap --dev-bind /dev /dev --proc /proc --tmpfs /tmp ...` [clan-test].
  Since `nix flake check` evaluates every check, evaluating the VM tests triggers that build **(inferred)**.
- cairn's other checks (`consumer-services`, `flake-module`, `split-topology`, `etcd-autojoin`, `addon-manifests`) are `pkgs.runCommand` derivations over evaluated config, not VM tests, and several say they avoid vars paths that only exist after `clan vars generate` [cairn-flake].
  So they need neither KVM nor bwrap **(inferred)**.

## Answers

### IFD: yes

Nix allows IFD by default [nix-settings].
The GitHub workflow passes it explicitly because a nix-daemon ignores `--option` from untrusted users [cairn-ci].
On the spindle there is no daemon and the step runs as root, so `--option allow-import-from-derivation true` (or `NIX_CONFIG`) takes effect **(inferred)**.

### Unprivileged user namespaces / bubblewrap: no, not on the spindle as deployed

- The workflow container has no `CAP_SYS_ADMIN` and gets Docker's default seccomp profile, because the engine sets no seccomp option and the `dind` args set no `--seccomp-profile` [nixery-engine] [helm-release].
  That profile allows `unshare`, `setns`, `mount` and namespace-creating `clone` only with `CAP_SYS_ADMIN`; without it, `clone` is allowed only when none of the `CLONE_NEW*` flags (mask `2114060288`) are set, and `clone3` returns `ENOSYS` [moby-seccomp].
  bwrap, which is not setuid here, has to create a user namespace, so it fails at that point **(inferred)**.
- Lifting AppArmor (what the GitHub job does [cairn-ci]) is not the fix here; the blocker is seccomp plus dropped capabilities **(inferred)**.
- Even with namespaces allowed, `bwrap --proc /proc` mounts a new procfs, which the kernel refuses while Docker's masked `/proc` paths cover parts of the existing one **(inferred)**.
  The-cluster hits the same rule one level up, which is why `dind` needs `procMount: Unmasked` [helm-release] [nested].
  The engine sets no masked-paths override, so lifting this needs a spindle code change, not just config **(inferred)**.

### KVM: no (a blocker the ticket did not list)

The workflow container gets no devices [nixery-engine], and the spindle pod mounts no `/dev/kvm` [helm-release].
Without `/dev/kvm`, nix lacks the `kvm` feature [nix-settings], so the two VM-test checks cannot be built and `nix flake check` fails on them **(inferred)**.
Forcing `system-features` to include `kvm` would make QEMU fall back to software emulation, far too slow for the timeout **(inferred)**.

### Timeout: no, unless raised

At the default 5 minutes [spindle-cfg], an 11-minute GitHub run with KVM cannot fit.
The operator would need to set `SPINDLE_NIXERY_PIPELINES_WORKFLOW_TIMEOUT` (for example `60m`) in the HelmRelease's `nonSecret` variables [spindle-cfg] [helm-release].

### Cachix `unstoppablemango`: yes

- Reading: workflow-level `environment` reaches every step [wf-ref], so `NIX_CONFIG` can add `https://unstoppablemango.cachix.org` with its key `unstoppablemango.cachix.org-1:m7uEI6X1Ov8DyFWJQX4WsRFRWFuzRW5c/Xms8ZaP74U=` (the key the cluster's ncps uses) [ncps].
  Single-user root nix honours it, with no trusted-substituter restriction **(inferred)**.
- Pushing: add `cachix` from nixpkgs as a nixery dependency [wf-ref] and a repository secret `CACHIX_AUTH_TOKEN`; secrets reach every step as environment variables [secrets].
  Secrets, caches and OIDC tokens are withheld from fork, patch and approval-gated pull request runs [secrets] [wf-ref], so a push step must skip itself when the token is absent.
- Alternative: the cluster's ncps proxy already fronts `unstoppablemango.cachix.org` at `http://ncps.nix-system.svc.cluster.local:8501` [ncps].
  Whether a workflow container nested in dind resolves cluster Service names was not checked **(inferred: dockerd's embedded DNS forwards to the pod's resolvers, so the FQDN should resolve)**.
- The spindle's own `cache:` directories feature needs `SPINDLE_CACHE_BACKEND`, which is unset [spindle-cfg] [helm-release]; it is not a fit for a nix store anyway **(inferred)**.

## `.tangled/workflows/ci.yml` for cairn

The repository must be on Tangled (on a knot) with this spindle selected under Settings → Pipelines [wf-guide]; a GitHub-only repo triggers nothing.

What can run today, once the timeout is raised: the checks that need neither KVM nor bwrap.

```yaml
# .tangled/workflows/ci.yml
when:
  - event: push
    branch: main
  - event: pull_request
    branch: main

engine: nixery

dependencies:
  nixpkgs:
    - cachix

environment:
  NIX_CONFIG: |
    allow-import-from-derivation = true
    extra-substituters = https://unstoppablemango.cachix.org
    extra-trusted-public-keys = unstoppablemango.cachix.org-1:m7uEI6X1Ov8DyFWJQX4WsRFRWFuzRW5c/Xms8ZaP74U=

steps:
  - name: Checks without VMs
    command: |
      set -euo pipefail
      checks=(treefmt consumer-services flake-module split-topology etcd-autojoin addon-manifests)
      targets=("${checks[@]/#/.#checks.x86_64-linux.}")
      if [ -n "${CACHIX_AUTH_TOKEN:-}" ]; then
        cachix watch-exec unstoppablemango -- nix build -L --no-link "${targets[@]}"
      else
        nix build -L --no-link "${targets[@]}"
      fi
```

`checks.treefmt` assumes treefmt-nix's default flake check is on **(inferred)**; drop it from the list if `nix flake show` does not list it.

The full check, once the spindle supports it, would replace that step with:

```yaml
  - name: Flake check
    command: |
      set -euo pipefail
      if [ -n "${CACHIX_AUTH_TOKEN:-}" ]; then
        cachix watch-exec unstoppablemango -- nix flake check -L
      else
        nix flake check -L
      fi
```

That needs these operator changes in the-cluster, none of them made today:

1. `SPINDLE_NIXERY_PIPELINES_WORKFLOW_TIMEOUT` raised well past 11 minutes [spindle-cfg].
2. Nested user namespaces and a fresh `/proc` for workflow containers: a `--seccomp-profile` on the `dind` dockerd that allows `unshare`/`clone` with namespace flags **(inferred: a standard dockerd flag, not checked against the dind image)**, plus a spindle change to the engine's `HostConfig` so `/proc` is not masked [nixery-engine].
3. `/dev/kvm` exposed to the spindle pod and passed into workflow containers; the engine has no device option, so this is also a spindle code change [nixery-engine].
4. Memory: two VM tests each booting cluster nodes may not fit a 4 GiB job limit **(inferred)**; `SPINDLE_NIXERY_PIPELINES_MAX_JOB_MEMORY_MB` is the knob [spindle-cfg], bounded by the `dind` 18Gi limit [helm-release].

Another way round 2 and 3, also unverified: setting `SPINDLE_SERVER_DOCKER_SOCKET` mounts the dind socket into workflow containers [spindle-cfg] [nixery-engine], so a step could `docker run` its own less-restricted nix container.
That hands every workflow control of the pod's dockerd, and still does not provide `/dev/kvm` **(inferred)**.

## Bottom line for the ticket

Not as deployed.
IFD is fine, since the nixery engine runs single-user root nix with no daemon, and Cachix works through `NIX_CONFIG` for reads plus a `CACHIX_AUTH_TOKEN` secret for pushes on trusted runs.
But three things block the full `nix flake check`:

- the workflow container's dropped capabilities and Docker's default seccomp profile stop bwrap from creating user namespaces (and masked `/proc` would stop its `--proc` mount next);
- there is no `/dev/kvm` for cairn's two clan NixOS VM tests, which is also what triggers the bwrap IFD;
- the default 5-minute workflow timeout is shorter than the 11-minute GitHub run.

The useful step today is a spindle workflow that builds cairn's non-VM checks, after raising the timeout.
The VM tests stay on GitHub until the spindle grows KVM and nested-namespace support.
