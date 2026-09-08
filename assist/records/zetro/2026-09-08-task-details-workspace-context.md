# Zetro Task Details and Workspace Context

Date: 2026-09-08

## Outcome

The Tasks sidebar now shows a flat title list. Selecting a task opens its full
details in the main workspace.

Chat and Tasks now share one context bar. The left side shows the project and
active view. The right side shows the Codex connection, provider, and model.

## Ownership

- `zetro.project-tasks.web` owns task selection, the sidebar list, and details.
- `zetro.desk.web` owns the shared workspace context bar.
- `zetro.agent-chat.web` supplies the current model to the context bar.
- `zetro.settings.web` supplies the Codex connection state.
- The API and stored records did not change.

## Interface

Task details show the title, description, status, priority, created time, and
updated time. The status action advances or reopens the selected task.
The New task action uses a black primary button in the fixed Tasks sidebar footer.

## Verification

- Passed the focused type check, build, lint, format, and documentation checks.
- Passed the module-boundary and Git whitespace checks.
- Verified the Chat context bar and both task-detail selections at `/zetro`.
- Verified the fixed sidebar action, create form opening, and task-detail restore.
- Confirmed that the browser console had no errors or warnings.

No commit or push was created.
