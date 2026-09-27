# CodeLoop Agent Task Plan

This document defines the phased plan for turning CodeLoop tools into a reliable software-engineering task loop.

## Outcome

CodeLoop must accept one development task, understand the project, make bounded changes, validate the result, retry recoverable failures, and return evidence before commit approval.

## Current baseline

CodeLoop already provides bounded filesystem, terminal, Git, test, validation, browser, process, Docker, package, project, code-intelligence, provider, and memory tools. The missing layer is orchestration: durable task state, checkpoint ownership, validation retry, rollback, approval handoff, and final evidence.

## Phases

### Phase 1: Task controller

- Define the task state machine.
- Persist task state through `memory.task_state`.
- Create a Git checkpoint before mutation.
- Track attempts, approval requirements, validation results, and errors.
- Provide explicit transitions for start, pause, retry, completion, failure, and rollback.

### Phase 2: Execution loop

- Add one task runner around the existing agent tool loop.
- Run project discovery before edits.
- Execute tools within the six-round agent limit.
- Run `validate` after edits.
- Retry recoverable validation failures up to three attempts.
- Roll back when the retry limit is reached.

### Phase 3: Product workflow

- Add API endpoints for task creation, status, approval, validation, rollback, and evidence.
- Add workspace task activity UI.
- Show changed files, validation stages, tool events, provider, model, and checkpoint.
- Require explicit approval before destructive actions and commit.

### Phase 4: Evaluation and transports

- Add repeatable benchmark tasks for React, TypeScript, API, test, and migration changes.
- Record success, retries, rollback, changed-file scope, and validation evidence.
- Keep SQLite as the default memory transport.
- Use JSON for export and recovery.
- Add MariaDB only when multi-user or multi-worker coordination requires it.

## Acceptance criteria

- A task has one durable owner and one state machine.
- Every mutating task starts from a checkpoint or explicitly reports why it cannot create one.
- Validation results are persisted and are linked to the task attempt.
- Recoverable failures retry automatically within the configured limit.
- Failed tasks can be rolled back without changing unrelated work.
- Completion requires passing validation or an explicit user-approved exception.
- No task can commit without approval.

## First implementation slice

Implement and test the task state machine and controller boundary before adding API or UI surfaces. The controller must be usable with the existing memory and Git tools and must not execute arbitrary commands itself.

The first API surface and UI activity panel are now started: authenticated task creation, status, approval, validation, validation-result, rollback, and provider-driven run routes are available. Automatic validation, bounded retry, and final rollback are now executed by the run endpoint. The next slice is richer validation evidence and task activity history.
