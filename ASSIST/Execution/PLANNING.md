# Planning

## Current Batch

### Reference

`#10`

### Goal

Bring the ASSIST documentation back in sync with the live repository, then make `Plan-1` executable by adding a real workspace and host baseline surface inside the framework and internal API boundary.

### Scope

- `ASSIST/Documentation`
- `ASSIST/Discipline`
- `ASSIST/Execution`
- `ASSIST/Planning`
- `apps/framework/src/application`
- `apps/api/src/internal`
- `tests/framework`
- `tests/api`

### Canonical Decisions

- framework remains the reusable runtime, composition root, and host assembly layer
- `cxapp` remains the active suite-facing shell for web and server entry wrappers
- `apps/ui` is now an active shared layer for desk navigation, auth layouts, and a design-system docs surface
- ASSIST documentation must describe only what is actually implemented in the repo
- release and version guidance must not reference tooling that is absent from `package.json`
- the first `Plan-1` implementation slice is a machine-readable baseline surface, not a large new runtime subsystem

### Execution Plan

1. update the active reference, task, planning, and changelog files for the new batch
2. rewrite stale ASSIST docs so they match the actual app tree, commands, testing paths, and shared UI scope
3. add a framework-owned workspace and host baseline builder under the application layer
4. expose the baseline through the internal API route surface
5. add tests for the baseline builder and route payload
6. validate typecheck, lint, test, and build

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

- many app roots are still structural or UI-level scaffolds rather than real business modules
- auth, permissions, and request safety remain mock or partial outside the host/config baseline
- plugin delivery and release automation are documented as future work, not current tooling
