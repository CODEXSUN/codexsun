# Explicit shared-package task scopes

## Change and ownership

Chat API 0.16.1 validates one application or shared-package owner.
Agent Chat web 0.13.2 adds Application and Shared package choices using existing public UI buttons and fields.
Codex Connection supplies package-aware task instructions. No new sandbox permissions or database migrations are required.

## Contract and use

Select Shared package, enter `ui` as the package folder name, and choose `packages/ui`.
Leave Module empty unless the path selects a named module.
Approve only the needed existing documentation folders under `assist`.
The existing `application` transport field carries the owner folder name for compatibility.
The `folderPath` prefix distinguishes applications from packages. No new response fields affect older stored conversations.

Only paths below `apps/<owner>` or `packages/<owner>` are accepted.
The validator rejects mismatched owners, traversal, root directories, and redirected folders.
The provider receives that exact source folder plus explicit documentation folders as writable roots.
An application scope never implicitly gains package access. A package scope never grants consumer application writes.
Shared changes require separate review and consumer checks before integration.

## Verification and limits

- Scope, conversation persistence, and workflow tests: 17 passed.
- Zetro API/web typecheck and lint passed. Web, API, and CLI builds passed without reported warnings.
- UI ownership, module documentation, module dependency, module boundary, and file-length checks passed.
- Largest web JavaScript chunk: 395.62 KB, below the 400 KB budget.
- No installed-desktop verification, installation, publication, or migration is included.
- The installed 0.1.30 desktop must be rebuilt and upgraded before this form is available there.
- Existing project data and conversations are unchanged. This patch does not implement multi-owner tasks or concurrent build scheduling.

## References

- [Chat API](../../../../apps/zetro/api/src/modules/chat/README.md)
- [Agent Chat web](../../../../apps/zetro/web/src/modules/agent-chat/README.md)
- [Supervisor API](../../../../apps/zetro/api/src/modules/supervisor/README.md)
