# System Tasks Foundation

Date: 2026-09-09

## Current state

Zetro activates the durable system-task service before consumer handlers start.
The service owns task and step persistence, a typed handler registry, local and
BullMQ queue adapters, cancellation, retry, and interrupted-process recovery.

## Boundary

Only `zetro.system-tasks.api` may write `zetro_system_tasks` and `zetro_system_task_steps`. Consumers must use its public service after that service exists.

## Verification

System-task completion and interrupted-task recovery tests pass. See the
[production foundation](2026-09-09-production-foundation.md) for the complete change.
