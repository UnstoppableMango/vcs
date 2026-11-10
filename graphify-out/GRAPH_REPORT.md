# Graph Report - vcs  (2026-11-10)

## Corpus Check
- 81 files · ~16,591 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 4, .lock 2, .nix 1)

## Summary
- 385 nodes · 543 edges · 38 communities (19 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3b59bba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Nix tooling GitLab groups
- Forked GitHub repos
- Forges, Homes and Mirrors
- Repo tooling and CI
- GitHub labels and tiers
- TypeScript config
- Utility repos
- Package dependencies
- Personal repos
- Archived and work repos
- Demos and rulesets
- Codegen UX repos
- Library repos
- Application repos
- Fun repos
- Homelab repos
- Operator repos
- Pulumi repos
- Renovate config
- Pulumi plugin check
- Knowledge graph

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 19 edges
2. `rootGroup` - 16 edges
3. `pulumi-components` - 16 edges
4. `projectIn()` - 15 edges
5. `subgroup()` - 15 edges
6. `@pulumi/github` - 13 edges
7. `ADR 0002: The Forge program declares every repository with an on-prem copy` - 12 edges
8. `addMainRuleset()` - 10 edges
9. `pulumi job (preview on PR, up on main)` - 7 edges
10. `add-repo skill` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Verify with tsc --noEmit and pulumi preview --diff` --semantically_similar_to--> `pulumi job (preview on PR, up on main)`  [INFERRED] [semantically similar]
  .claude/skills/add-repo/SKILL.md → .github/workflows/ci.yml
- `Create vs import (pulumi import with parent URN)` --semantically_similar_to--> `Home move procedure (import, state rm, zero deletes)`  [INFERRED] [semantically similar]
  .claude/skills/add-repo/SKILL.md → docs/adr/0002-forge-program-declares-on-prem-repos.md
- `Use the glossary's vocabulary` --conceptually_related_to--> `Seed`  [INFERRED]
  docs/agents/domain.md → CONTEXT.md
- `Home move procedure (import, state rm, zero deletes)` --references--> `Home`  [EXTRACTED]
  docs/adr/0002-forge-program-declares-on-prem-repos.md → CONTEXT.md
- `Classic PAT for GitHub Mirrors` --rationale_for--> `Mirror`  [EXTRACTED]
  docs/adr/0002-forge-program-declares-on-prem-repos.md → CONTEXT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **On-prem forge ownership decision chain (ADR 0001 superseded by ADR 0002)** — docs_adr_0001_seed_stays_thin_decision, docs_adr_0002_forge_program_declares_on_prem_repos_decision, context_seed, context_forge_program, docs_adr_0002_forge_program_declares_on_prem_repos_unmango_scm [EXTRACTED 1.00]
- **Hosting domain model: Forge, Home, Mirror, Mirror hub, Seed, Forge program** — context_forge, context_home, context_mirror, context_mirror_hub, context_seed, context_forge_program [EXTRACTED 1.00]
- **Pulumi deploy pipeline: CI pulumi job, Key Vault secrets, B2 backend, prod stack** — _github_workflows_ci_pulumi_job, _github_workflows_ci_key_vault_secrets, pulumi_b2_state_backend, pulumi_prod_prod_stack_config, pulumi_vcs_project [INFERRED 0.85]

## Communities (38 total, 19 thin omitted)

### Community 0 - "Nix tooling GitLab groups"
Cohesion: 0.06
Nodes (47): aspireGroup, aspire2nix, bufGroup, buf2nix, dockerGroup, docker2nix, goreleaserGroup, goreleaser2nix (+39 more)

### Community 1 - "Forked GitHub repos"
Cohesion: 0.04
Nodes (48): akkaBootcamp, azureFunctionsNodejsLibrary, bitnamiCharts, bitnamiContainers, cloudflareTunnelIngressController, cloudProviderProxmox, clusterApi, clusterApiBootstrapProviderTalos (+40 more)

### Community 2 - "Forges, Homes and Mirrors"
Cohesion: 0.13
Nodes (21): Agent skills configuration, CLAUDE.md imports AGENTS.md, Forge, Forge program, Home, Mirror, Mirror hub, Seed (+13 more)

### Community 3 - "Repo tooling and CI"
Cohesion: 0.12
Nodes (16): add-repo skill, PublicRepo / PrivateRepo / Fork components (pulumi-components), gitlab/ group directory tree, projectIn helper, Raw gh.Repository with protect: true, Verify with tsc --noEmit and pulumi preview --diff, unmango Cachix cache, check job (nix flake check) (+8 more)

### Community 4 - "GitHub labels and tiers"
Cohesion: 0.09
Nodes (18): adventOfCode, everybodyCodes, labeledRepos, labelOptions, lang, langTiers, mangoMtg, ouranosis (+10 more)

### Community 5 - "TypeScript config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, jsx, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 6 - "Utility repos"
Cohesion: 0.11
Nodes (17): confit, devcontainers, edd, fenced, forkctl, goreleaser2nix, gossamer2nix, ideas (+9 more)

### Community 7 - "Package dependencies"
Cohesion: 0.11
Nodes (17): dependencies, pulumi-components, @pulumi/github, @pulumi/gitlab, @pulumi/pulumi, @unmango/pulumi-git, devDependencies, @types/bun (+9 more)

### Community 8 - "Personal repos"
Cohesion: 0.13
Nodes (14): config, controlPlane, dotfiles, hosts, iam, iamAzureVariables, me, nixos (+6 more)

### Community 9 - "Archived and work repos"
Cohesion: 0.22
Nodes (7): terraformProviderGit, terraformProviderPfSense, terraformProviderSmallImprovements, auctionApp, kubernetesTheWrongWay, openshiftLab, pulumi-components

### Community 10 - "Demos and rulesets"
Cohesion: 0.18
Nodes (9): github, infra, minecraftOperator, ansibleOrchard, fsharpPropertyTesting, gheIac, imaug, pulumiImaug (+1 more)

### Community 11 - "Codegen UX repos"
Cohesion: 0.18
Nodes (10): a2b, docker2nix, goProtocmd, openapi2go, openapi2terraform, pulumi2crd, sql2csharp, tdl (+2 more)

### Community 12 - "Library repos"
Cohesion: 0.20
Nodes (9): cliwrapFsharp, commandLineExtensions, dockerDotnetFsharp, dockerFsharp, dotnetProxmoxClient, godec, ihfs, nix (+1 more)

### Community 13 - "Application repos"
Cohesion: 0.18
Nodes (10): johnstonDems, keepers, mangomu, minecraftManager, slackerBot, xmageDocker, xmageRuleset, addMainRuleset() (+2 more)

### Community 14 - "Fun repos"
Cohesion: 0.25
Nodes (7): audio, fpCs, http, ocamlGo, rest, x12, xml

### Community 15 - "Homelab repos"
Cohesion: 0.25
Nodes (7): azure, cairn, controlPlane, inoculant, pfsense, theclusterIo, theclusterLan

### Community 16 - "Operator repos"
Cohesion: 0.25
Nodes (7): blockyController, blockyOperator, perryOperator, pfsenseOperator, plexOperator, pseudoSealedSecrets, wireguardOperator

### Community 17 - "Pulumi repos"
Cohesion: 0.25
Nodes (7): pulumi2nix, pulumiCiMgmt, pulumiComponents, pulumiKubernetesTheHardWay, pulumiProviderGit, pulumiProxmox, vcs

### Community 18 - "Renovate config"
Cohesion: 0.50
Nodes (3): extends, $schema, github>UnstoppableMango/renovate-config

## Knowledge Gaps
- **11 isolated node(s):** `github>UnstoppableMango/renovate-config`, `@types/bun`, `typescript`, `@sapslaj/pulumi-gitea`, `SourceRepo` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 258 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@pulumi/pulumi` connect `Application repos` to `Personal repos`, `Forked GitHub repos`, `Nix tooling GitLab groups`, `Package dependencies`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **What connects `github>UnstoppableMango/renovate-config`, `@types/bun`, `typescript` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Nix tooling GitLab groups` be split into smaller, more focused modules?**
  _Cohesion score 0.05827505827505827 - nodes in this community are weakly interconnected._
- **Why does `pulumi-components` connect `Archived and work repos` to `Forked GitHub repos`, `GitHub labels and tiers`, `Utility repos`, `Package dependencies`, `Personal repos`, `Demos and rulesets`, `Codegen UX repos`, `Library repos`, `Application repos`, `Fun repos`, `Homelab repos`, `Operator repos`, `Pulumi repos`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `Forked GitHub repos` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Why does `@pulumi/github` connect `Demos and rulesets` to `GitHub labels and tiers`, `Utility repos`, `Package dependencies`, `Personal repos`, `Library repos`, `Application repos`, `Fun repos`, `Operator repos`, `Pulumi repos`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Forges, Homes and Mirrors` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._