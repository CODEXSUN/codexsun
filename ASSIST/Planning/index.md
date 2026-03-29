# Planning Index

This file maps the active planning guides to their purpose and current implementation state.

## Plan Map

1. [Plan-1](./Plan-1.md) - Workspace, Hosts, And Assembly Baseline
   Current state: rewritten for the real `apps/` architecture.
   Done: framework, UI, CLI, docs, and database/migration assembly rules are now documented for the current repo model.

2. [Plan-2](./Plan-2.md) - Module Naming And Boundary Rules
   Current state: substantially implemented.
   Done: `framework` and `ui` boundaries are active, and shared presentation is extracted into `apps/ui`.

3. [Plan-3](./Plan-3.md) - Build, Plugin, And Release Workflow
   Current state: mostly implemented.
   Done: shared build roots, lockstep versioning, changelog discipline, and `githelper` workflow are active.

4. [Plan-4](./Plan-4.md) - Database Table Structure And Fields
   Current state: first implementation increment is active.
   Done: framework database schema sections, ordered migration sections, migration runner wiring, and SQLite smoke-test path are established from this plan.

5. [Plan-5](./Plan-5.md) - Framework API Boundary And Integration Foundation
   Current state: active and partially implemented in the framework boundary.
   Done: the plan now targets the real `apps/framework` runtime, and the first HTTP and integration foundation batch is the next implementation slice.

6. [Plan-6](./Plan-6.md) - Company-Centric Control Foundation
   Current state: planned but not implemented.
   Done: company-root control direction is documented, but the implementation batch has not started yet.

7. [Plan-7](./Plan-7.md) - Workspace Desk, UI Scope, And Module Routing
   Current state: active for the current framework and UI cleanup batch.
   Done: the plan now targets the real `apps/framework` desk shell, shared `apps/ui` design-system scope, and module-grouped route ownership.
