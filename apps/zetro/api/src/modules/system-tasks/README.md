# Zetro System Tasks API

## Contract

- Module ID: `zetro.system-tasks.api`
- Version: `1.1.0`
- Owner: Zetro API
- Data schema: `1`

The module owns durable background tasks, execution history, cancellation, retries,
and restart recovery. Other modules register typed handlers through its public service.

## Routes

- `GET /api/v1/system-tasks` lists recent tasks.
- `GET /api/v1/system-tasks/:taskId` returns one task and its steps.
- `POST /api/v1/system-tasks/:taskId/stop` requests cancellation.
- `POST /api/v1/system-tasks/:taskId/retry` retries a stopped, blocked, or failed task.

## Persistence and queues

The module stores tasks and step history in module-owned SQLite or MariaDB tables.
SQLite uses WAL mode. Startup returns interrupted tasks to `pending` and records a
recovery step.

Handlers can register with `{singleAttempt: true}`. These tasks cannot retry and become blocked
after interrupted execution. This policy prevents agent jobs from repeating changes after restart.
Active-task queries bypass the recent-history limit. Local queue shutdown waits for active execution before storage closes.

The local queue is the desktop default. Set `ZETRO_QUEUE_DRIVER=bullmq` and
`REDIS_URL` to run retryable work through BullMQ. Queue messages contain only task IDs.

## Lifecycle

Install applies immutable migrations. Activate recovers tasks and starts workers.
Deactivate aborts local work and closes the queue. Uninstall preserves history.

## Verification

Run the Zetro API type check and system task tests. Kill a worker during a running
test task. Restart it and confirm that the task returns to `pending`.

## Development records

- [Desktop supervisor bridge](../../../../../../assist/records/zetro/2026-09-10-desktop-supervisor.md)

- [2026-09-09 Production foundation](../../../../../../assist/records/zetro/2026-09-09-production-foundation.md)
