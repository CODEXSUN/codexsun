# Task

## Active Batch

### Reference

`#11`

### Title

`CLI GitHub helper and operational workflow baseline`

### Scope Checklist

- [x] Add a dedicated interactive GitHub helper under `apps/cli`
- [x] Support dirty repository commit flow with stage-all and commit prompts
- [x] Detect in-progress git operations and block unsafe helper execution
- [x] Fetch upstream state and offer pull-rebase before push when the branch is behind
- [x] Support first-push upstream setup and normal push flow from one command
- [x] Expose root scripts for source and built server helper execution
- [x] Add tests for helper parsing and push-target logic
- [x] Update ASSIST docs to reflect the new CLI helper surface

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`

## Next Batch

### Reference

`#12`

### Title

`Domain modules, app-owned migrations, and production auth groundwork`

### Scope Checklist

- [ ] start real domain modules in `core`, `billing`, `ecommerce`, and `task`
- [ ] replace placeholder app shells with app-owned providers and domain routes
- [ ] begin app-owned migrations and seeders beyond tracked placeholders
- [ ] deepen connector execution flow for `frappe` and `tally`
- [ ] replace mock auth flow with framework-owned auth services and permission boundaries
