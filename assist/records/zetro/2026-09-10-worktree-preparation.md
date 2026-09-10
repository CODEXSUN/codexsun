# Worktree preparation and Sites recovery

## Outcome and ownership

Codex Connection owns deterministic empty-folder preparation before provider execution.
The source scope and approved documentation paths bind to the conversation worktree.
No business scaffolding, database migration, permission expansion, or dependency installation occurs.

## Safety rules

- Existing directories and files remain unchanged.
- Only empty top-level apps/package owners and explicit Assist directories can be prepared.
- The source folder must exist and pass physical-path validation.
- Tracked files in either HEAD or index prevent empty-folder creation.
- Uncommitted source files are not copied.
- Each created path segment must remain a physical directory inside the worktree.
- Security readiness remains mandatory before preparation and execution.
- Missing-folder errors now name the failing path.

## Live recovery

The installed Sites conversation is `f63bddbf-9cdb-4d37-a02f-3b9f149ccafd`, titled `hi`.
Its worktree at `38c7f3a` contained apps/sites but lacked assist/records/sites.
The generic error concealed that documentation was the missing folder.
After confirming a clean worktree, the supervisor used non-forced detached checkout to revision `9f317c6`.
Both approved directories now exist. Chat history and stored scope were not changed.
No other worktree, account, or running service was changed.

## Verification

Six worktree tests and 17 connection/sandbox tests passed.
API typecheck and lint passed before final documentation formatting.
Tests cover preservation, uncommitted source refusal, stale tracked folders, traversal, and redirected paths.
Installed provider execution was not triggered. The user can resume the existing Sites chat.
The automatic preparation change remains source-only until a new desktop build is installed.

## References

- [Codex Connection](../../../../apps/zetro/api/src/modules/codex-connection/README.md)
- [Stable release workflow](../../operations/stable-release-workflow.md)
