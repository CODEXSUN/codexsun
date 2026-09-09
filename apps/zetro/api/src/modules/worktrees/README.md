# Zetro Worktrees API

## Contract

- Module ID: `zetro.worktrees.api`
- Version: `1.0.0`
- Owner: Zetro API
- Dependency: `zetro.codex-connection.api@^0.7.0`

The module owns worktree inventory, disk usage, safe cleanup, and retention sweeps.

## Routes

- `GET /api/v1/worktrees` lists managed worktrees.
- `POST /api/v1/worktrees/remove` removes one clean managed worktree.
- `POST /api/v1/worktrees/sweep` removes clean worktrees older than the retention period.

## Safety

The service resolves every target below `ZETRO_WORKTREE_ROOT`. It verifies the Git
worktree root and refuses to remove dirty worktrees. Git performs removal and pruning.

## Persistence

Git owns worktree metadata. This module stores no business table or separate registry.

## Verification

Create clean and dirty temporary worktrees. Confirm that cleanup removes only the clean
target and that a retention sweep preserves recent or dirty targets.

## Development records

- [2026-09-09 Production foundation](../../../../../../assist/records/zetro/2026-09-09-production-foundation.md)
