# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Knowledge graph

`graphify-out/` holds a [graphify](https://github.com/Graphify-Labs/graphify) knowledge graph of this repository: code structure parsed with tree-sitter, plus the concepts and decisions in its docs.
Read `graphify-out/GRAPH_REPORT.md` before exploring files. It lists the graph's communities, its most connected nodes, and links between them you might not expect.
Ask the graph before searching: `graphify query "<question>"`, `graphify path "<A>" "<B>"`, `graphify explain "<name>"`.
`graphify` is in the dev shell, from `unmango/pkgs`.

A pull request that changes code or docs rebuilds the graph and commits it in the same pull request.
`graphify update .` re-extracts code without an LLM.
After a doc change, run the graphify skill with `--update` in an agent session (`graphify install` adds the skill), so the docs are read again.
Commit `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, and `graphify-out/.graphify_labels.json`, which keeps the community names across rebuilds; the rest of `graphify-out/` is ignored.
`unmango/architecture` merges this graph with the other source control repositories' graphs.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues, through the `gh` CLI.
See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels, each named after its role: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root.
See `docs/agents/domain.md`.

## Applying

The Pulumi Kubernetes Operator Stack `vcs` in UnstoppableMango/the-cluster (`apps/vcs/stack.yml`) applies `prod`; CI only runs `pulumi preview --diff` on pull requests.
The operator applies the head of `main`, so commits that land between two reconciles are never applied on their own.
A change that must be applied in steps, such as adding an `alias` and later removing it, lands as separate merges, each applied before the next one merges.
