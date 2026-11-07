# The on-prem Seed only prepares the forge; vcs still declares every repository

Status: superseded by [0002](0002-forge-program-declares-on-prem-repos.md).

The on-prem forge gets its own Pulumi program, the **Seed** (`forge`), hosted on that forge and run by the Pulumi Kubernetes Operator. It owns the `unmango` org, the `thecluster-bot` user, the API token vcs uses, and its own repository. Nothing else. Every other on-prem repository, its branch protection, and its **Mirrors** are still declared in vcs, so a repository's **Home** and **Mirrors** stay declared together.

The obvious alternative, letting the **Seed** grow into the program for all on-prem repositories, would split one codebase's declaration across two programs whenever it has a GitHub **Mirror**, and the **Mirror hub** wiring would have no single owner.

## Considered options

- **A third program that owns everything on the on-prem side.** Splits **Home** from **Mirror** across programs.
- **Replace vcs with an on-prem program.** vcs stays on GitHub until on-prem has a track record.
- **A thin Seed.** Chosen. The cost is that the **Seed**'s own repository is the one repository vcs doesn't declare, and it has no GitHub **Mirror** for now.

Decisions and build order: the forge-seed design (17 decisions, recorded 2026-11-02).
