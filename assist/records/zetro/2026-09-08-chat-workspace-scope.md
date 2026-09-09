# Zetro Chat Workspace Scope

Date: 2026-09-08

## Outcome

Each Zetro chat can connect to one application or module folder inside its
active project. Codex starts the turn from that folder instead of the project
root.

## Ownership and contracts

- `zetro.chat.api` stores and validates the conversation workspace scope.
- `zetro.codex-connection.api` maps the relative folder into the isolated worktree.
- `zetro.agent-chat.web` owns the chat menu, folder drawer, and browser flow.
- `zetro.desk.web` composes the scope summary into the workspace context bar.
- `zetro.projects.web` supplies the active project root and folder browser.

The stored scope contains `application`, `module`, and `folderPath`. The folder
path is relative to the active project. The API rejects the project root,
absolute paths, missing folders, and paths outside the project.

## Interface

Each chat row has one three-dot menu. Connected folder opens the foreground
Chat workspace drawer. The drawer edits the application, module, and folder.
The header shows the connected application and module and includes the same
folder action for a new chat.

## Execution

A provider turn requires a connected folder. The App Server receives the
matching folder inside the conversation worktree as its working directory.
The prompt and developer instructions identify the connected application,
module, and folder.

## Verification

- Zetro API and web type checks: Passed.
- Chat history tests: Passed, 6 tests.
- Worktree tests: Passed, 2 tests.
- Workflow tests: Passed, 7 tests.
- Zetro API and web production builds: Passed without warnings.
- Module dependency, boundary, documentation, line, version, and chunk checks: Passed.
- Repository lint and format checks: Passed.
- Browser check at `/zetro`: Passed for both three-dot menus, the workspace drawer,
  root-bounded folder browser, inferred application, and context-bar summary.

No commit or push was created.
