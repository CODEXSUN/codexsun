# CodeLoop Agent Task Design Review

This document records the design review for the CodeLoop task controller and execution workflow.

## Decision

Use a small controller around existing tools instead of adding a second terminal, Git, validation, or memory implementation. The controller owns lifecycle state; existing modules own side effects.

The first controller slice is implemented in `api/src/modules/agent/agent-task-controller.ts`. It persists task state through `MemoryTools`, requests checkpoints and rollback through a Git-compatible boundary, and records bounded validation attempts.

The first authenticated API surface is implemented in `api/src/server.ts` under `/api/v1/codeloop/tasks`. Start and rollback require an explicit `approved: true` body value.

The task run endpoint calls the existing provider agent loop for the selected provider ids, then calls the existing unified validator after successful provider execution. A failed validation retries with the prior errors as context until `maxAttempts`; the final failure rolls back to the checkpoint. Provider approval requests pause the task in `awaiting_approval` without running validation.

## State model

```text
planned → running → validating → completed
             │          │
             │          ├─ retrying → running
             │          └─ failed
             ├─ awaiting_approval → running
             └─ rolled_back
```

Allowed terminal states are `completed`, `failed`, and `rolled_back`.

## Ownership boundaries

- `AgentTaskController` owns state transitions, attempt limits, and task evidence.
- `MemoryTools` owns durable task state and decisions.
- `GitTools` owns checkpoints, rollback, branches, and commits.
- `ValidationTools` owns validation stages and structured results.
- `AgentToolRegistry` owns individual tool authorization and execution.
- The API owns authentication and transport serialization.
- The web app owns task activity and approval presentation.

## Safety decisions

- The controller never shells out directly.
- Git checkpoint and rollback remain approval-gated by the Git module.
- Validation is bounded by the existing timeout and stage ordering.
- Retry count is capped at three by default.
- A task cannot be marked complete by a validation result that was not recorded for the current attempt.
- Memory records are owner-scoped; no cross-user task state is accepted.

## Non-goals for this slice

- No autonomous commit.
- No MariaDB adapter.
- No background queue or multi-worker scheduler.
- No vector memory or automatic embedding retrieval.
- No change to existing provider transport behavior.

## Review risks

- A Git checkpoint can fail in read-only mode; this must become an explicit task failure, not a silent continuation.
- Existing dirty work must not be included in an agent task without a user-approved scope.
- Browser and Docker actions remain approval-required even when the task itself is running.
- Validation output can be large; task evidence must remain bounded.
