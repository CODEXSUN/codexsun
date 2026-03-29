# Planning

## Current Batch

### Reference

`#9`

### Goal

Keep framework as the reusable runtime, promote `cxapp` into the active suite shell, and normalize every app into one isolated folder model.

### Scope

- `apps/framework`
- `apps/cxapp`
- `apps/core`
- `apps/api`
- `apps/site`
- `apps/ui`
- `apps/billing`
- `apps/ecommerce`
- `apps/task`
- `apps/frappe`
- `apps/tally`
- `apps/cli`
- `ASSIST/Documentation`
- `ASSIST/Execution`

### Canonical Decisions

- framework remains the reusable composition and runtime layer
- cxapp owns the active web and server entry wrappers
- every app keeps `src`, `web`, `database`, `helper`, and `shared`
- app manifests carry workspace metadata for explicit suite crawling
- api routes stay split between internal and external surfaces
- ui stays shared and excludes dormant app-specific feature code from the active build path
- MariaDB remains the live primary database target
- SQLite remains the offline and desktop option
- PostgreSQL remains the optional analytics path

### Execution Plan

1. remove the stale frontend/server ownership from the active app structure
2. normalize each app folder into the same isolated structure
3. wire workspace metadata into manifests and suite registration
4. keep `cxapp` as the active frontend and server wrapper while framework remains reusable underneath
5. add tests that verify the standardized structure
6. update ASSIST docs to match the real repository
7. validate typecheck, lint, test, and build

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

Validation note: the normalized multi-app structure is in place, `cxapp` is the active shell, framework remains the runtime root, and the full root validation set passes.

### Risks And Follow-Up

- most app folders are still structural scaffolds and not full domain implementations yet
- `database/migration` and `database/seeder` are placeholders until app-owned data layers are introduced
- dormant app-specific code under `apps/ui/src/features` still needs to be moved into the correct app boundaries instead of staying quarantined
- connector, auth, and audit-sensitive flows still need production-grade implementation
