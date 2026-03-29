# Task

## Active Batch

### Reference

`#10`

### Title

`ASSIST reconciliation, Plan-1 baseline, Plan-4 foundation metadata, and Plan-5 HTTP routing`

### Scope Checklist

- [x] Move ASSIST tracking from the old `#9` normalization batch to the current repository state
- [x] Remove stale ASSIST references to `githelper`, `version:bump`, `Test/`, and retired migration/layout assumptions
- [x] Update architecture, overview, setup, testing, contributing, and planning docs to match the live repo
- [x] Record the current shared UI state: desk shell, auth layouts, and design-system docs surface
- [x] Implement a machine-readable workspace and host baseline in the framework boundary
- [x] Expose that baseline through the internal API surface
- [x] Add tests for the baseline assembly and route payload
- [x] Add ordered framework database foundation section definitions
- [x] Add ordered platform migration section definitions that map to the schema foundation
- [x] Expose the foundation plan through framework database exports
- [x] Add tests for section order and required table coverage
- [x] Add framework-owned route manifest helpers for internal, external, and public HTTP surfaces
- [x] Version internal and external routes under canonical `v1` paths with legacy path compatibility
- [x] Add a public bootstrap route and public `v1` health alias
- [x] Attach surface, version, auth, summary, and legacy-path metadata to HTTP route definitions
- [x] Add tests for versioned route assemblies and legacy matching behavior

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
