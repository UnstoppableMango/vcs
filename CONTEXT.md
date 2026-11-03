# vcs

Where each of Erik's repositories lives, and how the copies of it stay in step.

## Language

### Hosting

**Forge**:
A service that hosts git repositories: GitHub, Tangled, Gitea, Forgejo, GitLab.

**Home**:
The one **Forge** where a repository's pushes, pull requests, and CI happen. Every repository has exactly one.
_Avoid_: origin, primary, upstream

**Mirror**:
A read-only copy of a repository on another **Forge**, kept current from its **Home** automatically. A repository has zero or more.
_Avoid_: fork, backup, replica

**Mirror hub**:
The single on-prem **Forge** instance every **Mirror** sync runs through: it pulls from a **Home** that can't push mirrors, and pushes to each **Mirror**.

**Seed**:
The small program, hosted on the on-prem **Forge**, that creates what this repo needs before it can manage that **Forge**: the org, the automation user, its token, and the **Seed**'s own repository. It declares no other repository.
_Avoid_: bootstrap repo

## Relationships

- Every repository has one **Home** and zero or more **Mirrors**, declared together in one place
- A **Mirror** never takes pushes or pull requests; a pull request opened on one is closed with a pointer to the **Home**
- A private repository has no **Mirror**
- The **Seed** manages its own repository, so that repository is the one exception to "declared in vcs"

## Flagged ambiguities

- "Bootstrap repo" could mean either a program that manages every on-prem repository or one that only prepares the **Forge**. Resolved: it is the **Seed**, which only prepares the **Forge**.
