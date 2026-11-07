# The Forge program declares every repository with an on-prem copy

Supersedes [0001](0001-seed-stays-thin.md).

Every repository with a copy on the on-prem forge (`gitea.thecluster.io`) is declared in one new Pulumi program, the **Forge program**, hosted at `scm/self` on that forge. That covers a repository whose **Home** is the forge, and also one whose copy there is only a **Mirror hub** copy of a Tangled **Home**. Because a **Home** and its **Mirrors** stay declared together, the **Forge program** also declares that repository's Tangled **Home** and its GitHub **Mirror**, and `SourceRepo` is built there, not in vcs. vcs keeps only repositories whose **Home** is GitHub, plus gitlab.com, and unmango/scm likewise keeps only GitHub-homed `unmango` repositories, giving up its `gitea/` directory.

The **Seed** stays, hosted at `scm/seed`. It owns the `scm` org and both of its repositories (`scm/seed` and `scm/self`), the forge's service accounts (`pulumi`, `claude`, `thecluster-bot`), and their tokens. The **Forge program** owns the `unmango` org and every repository under `unmango` and `UnstoppableMango` on the forge.

## Why

0001 put on-prem repositories in vcs. Meanwhile unmango/scm had started managing the forge directly (`unmango` org, `mve`), so the forge had two owners. A single program that owns everything on the forge, with the **Seed** handling only what has to exist before that program can run, gives the forge one owner and keeps the IaC hosted where the repositories it declares live.

## Considered options

- **Split by owner, the way GitHub is split.** vcs for `UnstoppableMango`, scm for `unmango`, on every forge. Rejected: the forge's repositories end up spread across two programs that are both hosted on GitHub.
- **vcs declares every on-prem repository (0001).** Rejected for the same reason, and because vcs stays on GitHub.
- **unmango/scm moves its Home to the forge and becomes `scm/self`.** Rejected: the GitHub org's settings stay in a GitHub-hosted program.
- **A Forge program owns the forge, with the Seed bootstrapping it.** Chosen.

## Consequences

- When a repository moves its **Home** to the forge, its GitHub repository moves from vcs to the **Forge program** in the same change, together with its children (ruleset, labels): import them into the **Forge program**, then remove them from vcs's state without deleting them, running `pulumi state unprotect` first on any that are protected. Both previews must show zero deletes. scm's existing Gitea resources move the same way.
- The **Seed** mints the `pulumi` user's token and writes it to Key Vault `unstoppablemango-pulumi`. The **Forge program** reads it through an ExternalSecret. A StackReference would need the two stacks to share a passphrase (or the **Seed** would need a Key Vault secrets provider), which would let anything that runs the **Forge program** decrypt the **Seed**'s state.
- GitHub **Mirrors** under both owners use one classic PAT from the same Key Vault, because a GitHub App installation token can't create a repository under a user account (`POST /user/repos` needs a user token).
- Both programs run as PKO Stacks and keep their state in the shared B2 bucket under their own keys. The **Forge program** is TS/bun, so scm's `gitea/` code ports over directly. The **Seed** keeps the forge-seed design's choice: Pulumi YAML if the PKO image has the plugin, otherwise TS.
- Both programs use `@sapslaj/pulumi-gitea` until the mirror chain needs something it lacks.
- Neither `scm/seed` nor `scm/self` has a GitHub **Mirror** for now.

Decisions: grilling on vcs#129, 2026-11-07.
