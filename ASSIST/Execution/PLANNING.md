# Planning

## Current Batch

### Reference

`#10`

### Goal

Bring the ASSIST documentation back in sync with the live repository, make `Plan-1` executable through a real workspace and host baseline surface, start `Plan-4` with ordered framework database foundation and migration-section metadata, and implement the first `Plan-5` HTTP routing slice.

### Scope

- `ASSIST/Documentation`
- `ASSIST/Discipline`
- `ASSIST/Execution`
- `ASSIST/Planning`
- `apps/framework/src/application`
- `apps/framework/src/runtime/database`
- `apps/framework/src/runtime/http`
- `apps/api/src/internal`
- `apps/api/src/external`
- `tests/framework`
- `tests/api`

### Canonical Decisions

- framework remains the reusable runtime, composition root, and host assembly layer
- `cxapp` remains the active suite-facing shell for web and server entry wrappers
- `apps/ui` is now an active shared layer for desk navigation, auth layouts, and a design-system docs surface
- ASSIST documentation must describe only what is actually implemented in the repo
- release and version guidance must not reference tooling that is absent from `package.json`
- the first `Plan-1` implementation slice is a machine-readable baseline surface, not a large new runtime subsystem
- the first `Plan-4` implementation slice is ordered schema and migration metadata, not a fake full migrator
- the first `Plan-5` implementation slice is versioned route assembly and public bootstrap exposure, not full auth, token, or webhook persistence

### Execution Plan

1. update the active reference, task, planning, and changelog files for the new batch
2. rewrite stale ASSIST docs so they match the actual app tree, commands, testing paths, and shared UI scope
3. add a framework-owned workspace and host baseline builder under the application layer
4. expose the baseline through the internal API route surface
5. add ordered framework database foundation sections and matching platform migration-section metadata
6. add versioned route-manifest helpers and expose canonical internal, external, and public `v1` surfaces with legacy compatibility
7. add tests for the baseline builder, route payload, section order, route versioning, and legacy path coverage
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

- many app roots are still structural or UI-level scaffolds rather than real business modules
- auth, permissions, and request safety remain mock or partial outside the host/config baseline
- plugin delivery and release automation are documented as future work, not current tooling
- schema contracts and migration ordering now exist as metadata, but executable migrations still need a real runner and table definitions
- request-context policy, API-client persistence, idempotency, and webhook safety remain future `Plan-5` slices beyond the route assembly now in place
