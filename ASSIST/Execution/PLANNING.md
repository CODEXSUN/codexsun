# Planning

## Current Batch

### Reference

`#11`

### Goal

Add a dedicated interactive GitHub helper under `apps/cli`, expose it through root scripts, and update ASSIST documentation so the operational workflow reflects the live helper surface.

### Scope

- `ASSIST/Documentation`
- `ASSIST/Execution`
- `apps/cli/src`
- `apps/cli/helper`
- `package.json`
- `tests/cli`

### Canonical Decisions

- ASSIST documentation must describe only what is actually implemented in the repo
- `apps/cli` owns interactive operational helper commands that remain business-agnostic
- the GitHub helper must stay native to Node and standard git commands
- the helper may assist commit, pull-rebase, and push, but it must not hide unresolved merge or rebase states

### Execution Plan

1. add a dedicated interactive helper under `apps/cli/src`
2. implement repository inspection, dirty-state commit flow, and in-progress git-operation blocking
3. add upstream fetch, behind/diverged detection, and interactive pull-rebase handling
4. add single-command push support for both tracked and first-push branches
5. expose root source and built helper scripts in `package.json`
6. add helper parsing and push-target tests under `tests/cli`
7. update architecture, contributing, task, planning, and changelog docs to reflect the new helper
8. validate typecheck, lint, test, and build

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`

### Risks And Follow-Up

- the helper intentionally stages all changes as one commit when the repo is dirty; it is not a replacement for selective staging workflows
- complex conflict resolution still stays manual if git pull-rebase cannot complete cleanly
- release tags and formal release discipline remain separate from this helper
