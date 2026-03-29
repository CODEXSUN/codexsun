# Task

## Active Batch

### Reference

`#10`

### Title

`ASSIST reconciliation and Plan-1 workspace baseline surface`

### Scope Checklist

- [x] Move ASSIST tracking from the old `#9` normalization batch to the current repository state
- [x] Remove stale ASSIST references to `githelper`, `version:bump`, `Test/`, and retired migration/layout assumptions
- [x] Update architecture, overview, setup, testing, contributing, and planning docs to match the live repo
- [x] Record the current shared UI state: desk shell, auth layouts, and design-system docs surface
- [x] Implement a machine-readable workspace and host baseline in the framework boundary
- [x] Expose that baseline through the internal API surface
- [x] Add tests for the baseline assembly and route payload

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`

## Next Batch

### Reference

`#11`

### Title

`Domain modules, app-owned migrations, and production auth groundwork`

### Scope Checklist

- [ ] start real domain modules in `core`, `billing`, `ecommerce`, and `task`
- [ ] replace placeholder app shells with app-owned providers and domain routes
- [ ] begin app-owned migrations and seeders beyond tracked placeholders
- [ ] deepen connector execution flow for `frappe` and `tally`
- [ ] replace mock auth flow with framework-owned auth services and permission boundaries
