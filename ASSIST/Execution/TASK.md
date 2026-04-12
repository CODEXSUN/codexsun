# Task

## Active Batch

- [x] `#150` Extend Docker health wait for slower Codexsun and Techmedia startup
  - [x] Phase 1: inspect the startup and readiness path that differs for `codexsun` and `techmedia_in`
  - [x] Phase 2: harden Docker setup health waiting so migration-heavy startup does not fail as a false timeout
  - [x] Phase 3: validate shell syntax and readiness-check behavior changes
