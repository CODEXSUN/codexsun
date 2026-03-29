# Task

## Active Batch

### Reference

`#9`

### Title

`CxApp isolated workspace baseline and per-app folder normalization`

### Scope Checklist

- [x] Remove legacy `apps/frontend` and `apps/server` ownership from the active architecture
- [x] Keep framework as the reusable runtime and composition root
- [x] Make `apps/cxapp` the active product shell for frontend and server entry wrappers
- [x] Normalize every app to `src`, `web`, `database/migration`, `database/seeder`, `helper`, and `shared`
- [x] Add workspace metadata to app manifests so suite composition can inspect app roots explicitly
- [x] Keep API routes split between `apps/api/src/internal` and `apps/api/src/external`
- [x] Keep `apps/ui` focused on shared UI scope and remove dormant feature folders from the active build path
- [x] Add root tests for standardized app structure
- [x] Update ASSIST architecture, overview, setup, planning, and changelog files

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`

Validation note: the repo now runs with `cxapp` as the active shell, framework as the reusable runtime, every app follows the same isolated folder shape, and root validation passes.

## Next Batch

### Reference

`#10`

### Title

`Domain modules, app-owned migrations, and real suite routes`

### Scope Checklist

- [ ] start real domain modules in `core`, `billing`, `ecommerce`, and `task`
- [ ] replace placeholder app shells with real routes and providers
- [ ] begin app-owned migrations and seeders beyond tracked placeholders
- [ ] deepen connector execution flow for `frappe` and `tally`
- [ ] start the Electron and offline delivery path on top of the existing SQLite runtime
