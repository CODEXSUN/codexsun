# Planning

## Active Batch

- `#136` Add live bidirectional Frappe ToDo sync
  - Scope: let super-admin operators sync Frappe ToDo snapshots both ways, pushing app-owned local ToDos to ERPNext and pulling ERPNext ToDo documents back into the local Frappe snapshot table.
  - Constraint: keep `.env` as the only Frappe connection source, keep ERPNext orchestration inside `apps/frappe`, and expose the browser only to the internal API.
  - Assumption: the existing Frappe connection must be enabled, configured, and successfully verified before ToDo live sync can run.
  - Phase 1: add an app-owned idempotent ToDo live sync service that pulls ERPNext ToDo documents and pushes local Frappe snapshots through the strict Frappe connection factory. Completed.
  - Phase 2: expose the internal ToDo live sync route and frontend API helper without direct browser access to `.env` or ERPNext. Completed.
  - Phase 3: add the Frappe workspace live sync button and validate with typecheck, focused Frappe tests, and route-registry coverage. Completed.
