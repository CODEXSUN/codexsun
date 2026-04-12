# Task

## Active Batch

- [x] `#147` Fix cloud runtime git-root detection for system updates
  - [x] Phase 1: inspect the container startup and runtime update path that is issuing `git` outside the cloned repository
  - [x] Phase 2: harden repository root resolution so git-sync deployments resolve the actual runtime repo in cloud layouts
  - [x] Phase 3: validate typecheck and production build after the runtime fix
