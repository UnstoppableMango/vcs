# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

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
