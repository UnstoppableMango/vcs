---
name: add-repo
description: Add a repository resource to this Pulumi VCS project. Use when asked to add, register, onboard, or import a repo or project into gitlab/repositories or github/repositories, or when the user says "add <name> to vcs". Requires a repository name.
---

# Add a repository resource

Adds a GitLab project (primary) and optionally the matching GitHub repository to this Pulumi program.
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

Once the category is chosen, check whether the GitLab project already exists (drives Step 5):

```sh
glab repo view unmango/<groupPath>/<path> --output json
```

A hit means the project exists and must be imported; its `.id` is the import ID.

### Default rules

| Field | Generated default |
| --- | --- |
| category | `terraform-provider-*` to terraform; `*-operator` to operators; `pulumi*` / `pulumi2nix` to pulumi; `isFork` to forks; otherwise the best two or three guesses from topics and description |
| description | `gh` `.description`. If empty, prompt with no default. |
| path | Name with the redundant category prefix or suffix stripped. Full name for registry-locked names. Omit the field when it equals the name. |
| visibility | `gh` `.visibility` lowercased, else `public` |
| archived | `gh` `.isArchived`. Omit the field when false. |
| ciIdTokenSubClaimComponents | Omit. Recommend it only for a project whose CI federates into the Pulumi backend, as in `gitlab/repositories/pulumi.ts`. |
| topics (GitHub) | `gh` `.repositoryTopics` |
| requiredChecks (GitHub) | Contexts from the queries above, emitted as `{ context, integrationId: integrationIds.github }` |
| template (GitHub) | `gh` `.templateRepository` |
| component (GitHub) | `Fork` when `isFork`, `PrivateRepo` when private, else `PublicRepo`. Raw `gh.Repository` with `{ protect: true }` only when the live settings cannot be expressed by the component. |

### Path shortening

`path` shortens the resource name inside its group, since the group already carries the context:

- `clan-operator` in `operators` becomes path `clan`
- `pulumi-proxmox` in `pulumi` becomes path `proxmox`
- `vcs` in `pulumi` stays `vcs`, so the field is omitted

Registry-locked names are never shortened and carry the comment `// Registry-locked name, do not shorten.` above the entry.
That covers `terraform-provider-*` and NuGet package IDs such as `CliWrap.FSharp` or `UnMango.Extensions.CommandLine`.

## Step 2. Prompt for the remaining fields

Three `AskUserQuestion` calls. Every option list leads with the generated default, labeled `(Recommended)`.

1. GitLab core: category/group, description, path, visibility.
2. GitLab extras and the GitHub gate: `archived`, `ciIdTokenSubClaimComponents`, "also add the GitHub resource?", GitHub component type.
3. GitHub fields, only when the gate was yes: topics, requiredChecks, template, pages.

Skip a question whose answer is already unambiguous and say which default was taken.

## Step 3. Write the GitLab entry

Append to `gitlab/repositories/<category>.ts`, below the commented-out backlog block, matching the file's style: tabs, double quotes, trailing commas.

```ts
export const clanOperator = projectIn(operatorsGroup, "clan-operator", {
	description: "An operator for managing clans (clan.lol) from Kubernetes",
	path: "clan",
});
```

The exported const is camelCase of the resource name, disambiguated where the bare name would collide (`terraformProviderNetGear`, `pulumiProviderGit`).

Ensure `import { projectIn } from "../util";` and `import { <x>Group } from "../groups";` are present and uncommented.

If the group export is commented out in `gitlab/groups.ts`, uncomment it and every ancestor group, then say so explicitly in the summary.
A commented group cannot be referenced and the file will not typecheck otherwise.

`gitlab/repositories/index.ts` already re-exports every category file.
Touch it only when creating a genuinely new category file, in which case add the matching `export *` to both `gitlab/repositories/index.ts` and `github/repositories/index.ts`.

## Step 4. Write the GitHub entry, if requested

Append to `github/repositories/<category>.ts`, or to `github/repositories/archived.ts` when the repo is archived.

```ts
export const pulumiComponents = new PublicRepo("pulumi-components", {
	description: "Reusable Pulumi component resources",
	topics: ["pulumi", "iac", "components", "typescript"],
	requiredChecks: [{ context: "build", integrationId: integrationIds.github }],
});
```

Import `PublicRepo` / `PrivateRepo` / `Fork` / `integrationIds` from `pulumi-components`.
Add `import * as gh from "@pulumi/github";` only when emitting a raw `gh.Repository`.

## Step 5. Create vs import

State which case applies before finishing.

Resource does not exist on the platform: `pulumi up` creates it, nothing more to do.

Resource already exists: it must be imported first, or `pulumi up` fails on a name conflict.
Print the command, do not run it:

```sh
pulumi import gitlab:index/project:Project <resourceName> <projectId>
pulumi import github:index/repository:Repository <resourceName> <repoName>
```

An existing GitHub repo brought in as a raw resource also gets `{ protect: true }`, matching the rest of `github/repositories/`.

## Step 6. Verify and report

```sh
./node_modules/.bin/tsc --noEmit
```

It exits 0 on a clean tree, so any error comes from the new entry.

Offer `nix develop -c pulumi preview --diff` as the real check, noting it needs the Pulumi backend passphrase and the B2 state keys, so it may not run locally.

Report the expected diff shape: one new `gitlab:index/project:Project`, plus the GitHub resources when added.

Do not commit unless asked.
If asked, use a Conventional Commit subject such as `feat: add clan-operator`.
