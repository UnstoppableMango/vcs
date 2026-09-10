---
name: add-repo
description: Add a repository resource to this Pulumi VCS project. Use when asked to add, register, onboard, or import a repo or project into github/repositories or gitlab/, or when the user says "add <name> to vcs". Requires a repository name.
---

# Add a repository resource

Adds a GitHub repository (primary) and optionally the matching GitLab project to this Pulumi program.
The repository name is the only required input.
Every other top-level field is prompted for, each with a generated default recommendation.

## Step 0. Require a name

The argument is the canonical GitHub repo name, which is also the Pulumi resource name: `/add-repo clan-operator`.

If no name was given, ask for it and stop.
Do not infer a name from surrounding context and do not proceed without one.

## Step 1. Generate the defaults

Query the live repo. Tolerate failure on every command.

```sh
gh repo view UnstoppableMango/<name> --json name,description,visibility,isArchived,isFork,parent,repositoryTopics,templateRepository,homepageUrl
```

If that 404s, the repo does not exist yet: infer everything from the name and skip the remaining queries.

For GitHub required checks:

```sh
gh api repos/UnstoppableMango/<name>/rulesets --jq '.[].id'
gh api repos/UnstoppableMango/<name>/rulesets/<id> --jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'
```

Fall back to distinct check-run names on the default branch head:

```sh
gh api repos/UnstoppableMango/<name>/commits/HEAD/check-runs --jq '[.check_runs[].name] | unique[]'
```

Only when the GitLab gate in step 2 comes back yes, check whether the GitLab project already exists (drives step 5):

```sh
glab repo view unmango/<groupPath>/<path> --output json
```

A hit means the project exists and must be imported; its `.id` is the import ID.

### Default rules

Category picks the file on the GitHub side and the group on the GitLab side.

| Field | Generated default |
| --- | --- |
| category | `terraform-provider-*` to terraform; `*-operator` to operators; `pulumi*` / `pulumi2nix` to pulumi; `isFork` to forks; otherwise the best two or three guesses from topics and description |
| description | `gh` `.description`. If empty, prompt with no default. |
| visibility | `gh` `.visibility` lowercased, else `public` |
| archived | `gh` `.isArchived`. Omit the field when false. |

GitHub fields:

| Field | Generated default |
| --- | --- |
| component | `Fork` when `isFork`, `PrivateRepo` when private, else `PublicRepo`. Raw `gh.Repository` with `{ protect: true }` only when the live settings cannot be expressed by the component. |
| topics | `gh` `.repositoryTopics` |
| requiredChecks | Contexts from the queries above, emitted as `{ context, integrationId: integrationIds.github }` |
| template | `gh` `.templateRepository` |

GitLab fields, only when the gate is yes:

| Field | Generated default |
| --- | --- |
| path | Name with the redundant category prefix or suffix stripped. Full name for registry-locked names. Omit the field when it equals the name. |
| ciIdTokenSubClaimComponents | Omit. Recommend it only for a project whose CI federates into the Pulumi backend. |

### Path shortening

`path` shortens the resource name inside its GitLab group, since the group already carries the context:

- `clan-operator` in `operators` becomes path `clan`
- `pulumi-proxmox` in `pulumi` becomes path `proxmox`
- `pulumi2nix` in `pulumi` becomes name `2nix`, so the GitLab path is `unmango/pulumi/2nix`

Registry-locked names are never shortened and carry the comment `// Registry-locked name, do not shorten.` above the entry.
That covers `terraform-provider-*` and NuGet package IDs such as `CliWrap.FSharp` or `UnMango.Extensions.CommandLine`.

## Step 2. Prompt for the remaining fields

Three `AskUserQuestion` calls. Every option list leads with the generated default, labeled `(Recommended)`.

1. GitHub core: category, description, visibility, component type.
2. GitHub extras and the GitLab gate: `topics`, `requiredChecks`, `template`, `archived`, "also add the GitLab project?".
3. GitLab fields, only when the gate was yes: group, `path`, visibility, `ciIdTokenSubClaimComponents`.

Skip a question whose answer is already unambiguous and say which default was taken.

## Step 3. Write the GitHub entry

Append to `github/repositories/<category>.ts`, or to `github/repositories/archived.ts` when the repo is archived.
Match the file's style: tabs, double quotes, trailing commas.

```ts
export const pulumiComponents = new PublicRepo("pulumi-components", {
	description: "Reusable Pulumi component resources",
	topics: ["pulumi", "iac", "components", "typescript"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});
```

The exported const is camelCase of the resource name, disambiguated where the bare name would collide (`terraformProviderNetGear`, `pulumiProviderGit`).

Import `PublicRepo` / `PrivateRepo` / `Fork` / `integrationIds` from `pulumi-components`.
Add `import * as gh from "@pulumi/github";` only when emitting a raw `gh.Repository`.

A genuinely new category file also needs an `export *` in `github/repositories/index.ts`.

## Step 4. Write the GitLab entry, if requested

`gitlab/` mirrors the group tree: one directory per group at its GitLab path, `group.ts` declaring the group and `index.ts` declaring the projects in it.
So `unmango/operators/clan` is `gitlab/unmango/operators/index.ts`.

Append to that group's `index.ts`, below the commented-out backlog block.

```ts
export const clanOperator = projectIn(operatorsGroup, "clan-operator", {
	description: "An operator for managing clans (clan.lol) from Kubernetes",
	path: "clan",
});
```

Ensure `import { projectIn } from "../../util";` and `import { <x>Group } from "./group";` are present and uncommented.

If the group is commented out, uncomment it and every ancestor group, then say so explicitly in the summary.
That means its `group.ts`, its `index.ts`, and the `export * as <group> from "./<group>"` line in the parent's `index.ts`.
A commented group cannot be referenced and the file will not typecheck otherwise.

A genuinely new group is a new directory with `group.ts` and `index.ts`, plus a namespace re-export in the parent's `index.ts`.

## Step 5. Create vs import

State which case applies before finishing.

Resource does not exist on the platform: `pulumi up` creates it, nothing more to do.

Resource already exists: it must be imported first, or `pulumi up` fails on a name conflict.
The command depends on where the resource sits in the URN tree, so pick the matching one below.
Print it, do not run it.

A raw `gh.Repository` is a root-level resource, which is why an already-existing GitHub repo is normally declared that way rather than through a component.
It also gets `{ protect: true }`, matching the rest of `github/repositories/`.

```sh
pulumi import github:index/repository:Repository <resourceName> <repoName>
```

`PublicRepo`, `PrivateRepo`, and `Fork` create their `gh.Repository` as a child of the component, so the root command above would import a URN that never matches.
The pinned `pulumi-components` exposes no adoption option on the child, so either declare the repo raw as above, or name the component as the parent:

```sh
pulumi import github:index/repository:Repository <resourceName> <repoName> \
  --parent '<resourceName>=urn:pulumi:prod::vcs::unmango:github:PublicRepo::<resourceName>'
```

`projectIn` parents each GitLab project on its group, and groups nest, so a project import needs the group URN:

```sh
pulumi import gitlab:index/project:Project <resourceName> <projectId> \
  --parent '<groupName>=urn:pulumi:prod::vcs::gitlab:index/group:Group$gitlab:index/group:Group::<groupName>'
```

Read the parent URN off `pulumi stack export` rather than assembling it by hand.
The `Group` segments repeat once per level of nesting, which tracks the directory depth under `gitlab/`.

## Step 6. Verify and report

```sh
./node_modules/.bin/tsc --noEmit
```

It exits 0 on a clean tree, so any error comes from the new entry.

Offer `nix develop -c pulumi preview --diff` as the real check, noting it needs the Pulumi backend passphrase and the B2 state keys, so it may not run locally.

Report the expected diff shape: the new GitHub resources, plus one `gitlab:index/project:Project` when the GitLab project was added.

Do not commit unless asked.
If asked, use a Conventional Commit subject such as `feat: add clan-operator`.
