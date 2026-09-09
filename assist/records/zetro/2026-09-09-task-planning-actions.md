# Zetro Task Planning Actions

Date: 2026-09-09

## Outcome

The Task header actions are now operational. Review persists the `review`
workflow binding and opens a deterministic task readiness scorecard. Phase and
subtask actions create three project-scoped child task records linked to the
selected parent task.

## Ownership and bindings

- `zetro.tasks.api` owns the persisted `workflow`, `planningKind`, and
  `parentTaskId` task fields through its existing task routes.
- `zetro.project-tasks.web` owns the action menus, local duplicate guard,
  generated child-task wording, and the scorecard presentation.
- The scorecard is computed from the current task and its linked children. It
  does not claim provider execution, authorization, or publication.

## Decisions

- Review means a non-editing assessment workflow. It binds the task for review
  but does not start a provider turn or make repository changes.
- Phases and subtasks are saved as ordinary Task records, rather than transient
  checklist entries, so they retain project isolation and the existing task
  lifecycle.
- Generation is deterministic and uses no provider call. This makes the action
  available offline and avoids presenting generated language as verified work.

## Verification

- `npm.cmd run test:tasks --workspace @codexsun/zetro-api`: Passed.
- `npm.cmd run typecheck --workspace @codexsun/zetro-web`: Passed.
- `npm.cmd run build --workspace @codexsun/zetro-web`: Passed; largest chunk
  was 348.66 kB, within the 400 kB limit.
- `npm.cmd run typecheck --workspace @codexsun/zetro-api`: Blocked by existing
  `CodexModel` and `CodexReasoningEffort` export errors in the unrelated
  `codex-connection` module.

## Follow-up work

- Add an API-level atomic batch-plan endpoint if split generation later needs
  cross-device duplicate prevention or all-or-nothing writes.
