# Task

## Active Batch

### Reference

`#12`

### Title

`UI docs catalog expansion and imported component registry`

### Scope Checklist

- [x] Read the imported UI files under `temp` and map them into `apps/ui`
- [x] Add missing shared UI primitives needed by the imported docs demos
- [x] Port the imported component demos into the UI docs surface without changing app ownership boundaries
- [x] Expand the docs component catalog, overview cards, and side menu with the imported components
- [x] Add a docs templates section and surface imported template metadata in the UI app
- [x] Add compatibility shims and lint scope updates needed for the imported docs registry
- [x] Add source-controlled design-system defaults, reusable blocks, and build-readiness channels to the UI workspace
- [x] Move project component defaults into a dedicated source-controlled file for agent and build reference
- [x] Move the imported variant source from docs-owned registry paths into a reusable component-registry feature
- [x] Split the reusable component-registry into `variants` and `blocks`, and add auth login page block variants
- [x] Update ASSIST task, planning, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` still fails because local `.env` values override the expected test host)

## Next Batch

### Reference

`#13`

### Title

`Domain modules, app-owned migrations, and production auth groundwork`

### Scope Checklist

- [ ] start real domain modules in `core`, `billing`, `ecommerce`, and `task`
- [ ] replace placeholder app shells with app-owned providers and domain routes
- [ ] begin app-owned migrations and seeders beyond tracked placeholders
- [ ] deepen connector execution flow for `frappe` and `tally`
- [ ] replace mock auth flow with framework-owned auth services and permission boundaries
