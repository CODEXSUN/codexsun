# Planning

## Active Batch

- `#147` Fix cloud runtime git-root detection for system updates
  - Scope: stop cloud deployments from issuing runtime `git` commands outside the cloned repository when `GIT_SYNC_ENABLED=true`.
  - Constraint: keep the fix inside framework runtime infrastructure; do not change app-owned business behavior or introduce deploy-specific hardcoded paths.
  - Assumption: the repeated `fatal: not a git repository` lines come from the system-update runtime service resolving the wrong root under `/opt/codexsun/runtime/repository`.
  - Note: the Docker image build path was healthy; no Dockerfile change was required for this failure.
  - Phase 1: inspect the container startup and runtime update path that is issuing `git` outside the cloned repository. Completed.
  - Phase 2: harden repository root resolution so git-sync deployments resolve the actual runtime repo in cloud layouts. Completed.
  - Phase 3: validate typecheck and production build after the runtime fix. Completed.
