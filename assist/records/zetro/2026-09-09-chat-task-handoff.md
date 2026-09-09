# Zetro Chat Task Handoff

Date: 2026-09-09

## Outcome

An assistant response can create a task in the active project. Zetro selects the
new task and opens its details. The task waits until the user starts it.

## Ownership and bindings

- `zetro.agent-chat.web` owns response parsing and the Send to task action.
- `zetro.project-tasks.web` owns task creation, selection, and lifecycle state.
- `zetro.projects.web` owns the active project and the Chat or Tasks view.
- `POST /api/v1/tasks` creates the task with the existing `todo` status.

The chat module uses the project-tasks public controller. It does not import a
private task file. A labeled Title becomes the task title. A labeled Task section
becomes the description. Other responses use the first line and full response.

## Interface

The task details show `Waiting to start` until the user selects Start task. The
header has Review and Split icon menus. The Split menu exposes phase and subtask
choices for the next workflow binding.

## Verification

- Zetro web type check and production build: Passed.
- Complete Zetro test suite: Passed, 21 tests.
- Module documentation, dependency, boundary, version, application documentation,
  line, affected lint, affected formatting, and `git diff --check`: Passed.
- Browser check: Passed for the waiting state, Start task, Review and Split menus,
  phase and subtask choices, and Send to task control.
- The browser check did not create a task. This avoided a duplicate project record.

No database schema changed. No commit or push was created.
