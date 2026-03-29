# Planning Index

This file maps the active planning guides to their purpose and current implementation state.

## Plan Map

1. [Plan-1](./Plan-1.md) - Workspace, Hosts, And Assembly Baseline
   Current state: active and implemented as documentation plus a machine-readable framework baseline surface.
   Done: standardized app shape, active host entries, and the internal baseline route are documented and wired.

2. [Plan-2](./Plan-2.md) - Module Naming And Boundary Rules
   Current state: substantially implemented.
   Done: framework, ui, and app boundaries are active, and shared presentation is extracted into `apps/ui`.

3. [Plan-3](./Plan-3.md) - Build, Plugin, And Release Workflow
   Current state: partially implemented.
   Done: shared build roots, lockstep versioning, and changelog discipline are active.
   Remaining: real release automation and module packaging workflow.

4. [Plan-4](./Plan-4.md) - Database Table Structure And Fields
   Current state: planned direction with runtime config and driver switching in place.
   Done: framework database runtime and driver switching exist.
   Remaining: ordered schema sections, ordered migration sections, and app-owned migrations beyond placeholders.

5. [Plan-5](./Plan-5.md) - Framework API Boundary And Integration Foundation
   Current state: first boundary split is active.
   Done: internal and external route surfaces exist.
   Remaining: public route namespace, request-context policy, API client/token models, idempotency, and webhook persistence.

6. [Plan-6](./Plan-6.md) - Company-Centric Control Foundation
   Current state: planned but not implemented.
   Done: company-root direction is documented.

7. [Plan-7](./Plan-7.md) - Workspace Desk, UI Scope, And Module Routing
   Current state: active and partially implemented.
   Done: desk shell, grouped navigation, auth layouts, and UI docs routing now exist through `cxapp` and `apps/ui`.
