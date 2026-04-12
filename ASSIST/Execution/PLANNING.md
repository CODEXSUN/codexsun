# Planning

## Active Batch

- `#150` Extend Docker health wait for slower Codexsun and Techmedia startup
  - Scope: stop false-negative Docker setup failures when `codexsun` or `techmedia_in` takes longer to finish startup migrations and seeders before `/health` becomes ready.
  - Constraint: keep the fix inside the shared container setup script; do not change runtime business behavior or mask genuine startup failures.
  - Assumption: these two clients have heavier or more evolved databases, so `prepareApplicationDatabase()` can keep `/health` in `starting_up` state longer than the previous 240-second wait window.
  - Note: the runtime server does not mark startup as ready until after `prepareApplicationDatabase()` completes, so a healthy but busy startup can legitimately return `503` during migration work.
  - Phase 1: inspect the startup and readiness path that differs for `codexsun` and `techmedia_in`. Completed.
  - Phase 2: harden Docker setup health waiting so migration-heavy startup does not fail as a false timeout. Completed.
  - Phase 3: validate shell syntax and readiness-check behavior changes. Completed.
