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
The small program, hosted on the on-prem **Forge**, that creates what the **Forge program** needs before it can run: the org that holds both programs, their repositories, the automation users, and their tokens. It declares no other repository.
_Avoid_: bootstrap repo

**Forge program**:
The program, hosted on the on-prem **Forge**, that declares every repository with a copy there, together with that repository's **Home** and **Mirrors** wherever they are.

## Relationships

- Every repository has one **Home** and zero or more **Mirrors**, declared together in one place
- A **Mirror** never takes pushes or pull requests; a pull request opened on one is closed with a pointer to the **Home**
- A private repository has no **Mirror**
- A repository with no copy on the on-prem **Forge** stays with the program for its GitHub owner (vcs or unmango/scm); one with a copy there, as its **Home** or as a **Mirror hub** copy, is declared in the **Forge program**
- The **Seed** declares its own repository and the **Forge program**'s repository; the **Forge program** declares neither

## Flagged ambiguities

- "Bootstrap repo" could mean either a program that manages every on-prem repository or one that only prepares the **Forge**. Resolved: it is the **Seed**, which only prepares the **Forge**; the program that manages every on-prem repository is the **Forge program**.
