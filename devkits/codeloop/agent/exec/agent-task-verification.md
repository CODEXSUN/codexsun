# CodeLoop Agent Task Verification Guide

This guide verifies the task controller and the complete CodeLoop development workflow.

## Automated checks

Run from `E:\codexsun\codexsun`:

```powershell
npm.cmd run check --workspace @codexsun/codeloop-api
npm.cmd run check --workspace @codexsun/codeloop-web
npm.cmd run test --workspace @codexsun/codeloop-api
npm.cmd run build --workspace @codexsun/codeloop-api
npm.cmd run build --workspace @codexsun/codeloop-web
git diff --check
```

The controller slice can be verified directly with:

```powershell
npx.cmd tsx --test devkits/codeloop/api/src/modules/agent/agent-task-controller.test.ts
```

The controller tests cover planned-to-running transition, checkpoint capture, validation retry, completion, owner isolation, rollback, and invalid transitions.

The MariaDB integration test is skipped unless a test MariaDB service is configured. This is expected for the SQLite-first phase.

## Manual task-flow verification

1. Start CodeLoop with `"C:\Program Files\nodejs\npm.cmd" run dev:codeloop`.
2. Open `http://127.0.0.1:6371` and connect a verified provider.
3. Create a task that makes one small TypeScript change.
4. Confirm the task enters `planned`, then `running`.
5. Confirm project inspection occurs before mutation.
6. Confirm a checkpoint is recorded before the first write.
7. Approve the requested mutation.
8. Confirm the task enters `validating` after the edit.
9. Confirm typecheck, lint, tests, and build results are attached to the attempt.
10. Introduce a controlled test failure and confirm retry count increases.
11. Exceed the retry limit and confirm rollback returns the workspace to the checkpoint.
12. Repeat with a passing change and confirm `completed` requires validation evidence.
13. Confirm commit remains approval-required.
14. Confirm `/run` automatically enters validation after provider success.
15. Force a validation failure and confirm the task retries with the previous errors.
16. Exhaust the retry limit and confirm the task rolls back to its checkpoint.

## Task API smoke checks

With an authenticated session, verify:

```text
POST /api/v1/codeloop/tasks
GET  /api/v1/codeloop/tasks/:taskId
POST /api/v1/codeloop/tasks/:taskId/start       {"approved":true}
POST /api/v1/codeloop/tasks/:taskId/run         {"approved":true,"providerIds":["ollama"]}
POST /api/v1/codeloop/tasks/:taskId/approval
POST /api/v1/codeloop/tasks/:taskId/validate
POST /api/v1/codeloop/tasks/:taskId/validation-result
POST /api/v1/codeloop/tasks/:taskId/rollback     {"approved":true}
```

Expected behavior: unauthenticated requests return `401`, missing tasks return `404`, invalid transitions return `409`, and checkpoint/rollback operations without explicit approval are rejected by request validation.

## Expected evidence

- Task id and owner id.
- Current state and previous state.
- Attempt number and retry limit.
- Checkpoint id when available.
- Tool events and approval events.
- Validation result for the current attempt.
- Changed-file summary.
- Rollback or completion timestamp.

## Known limits

- MariaDB is planned, not active.
- Full repository lint currently contains pre-existing API and web errors.
- Live authenticated task-flow verification requires a valid CodeLoop session and provider token.
