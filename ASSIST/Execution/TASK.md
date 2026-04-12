# Task

## Active Batch

- [x] `#136` Add live bidirectional Frappe ToDo sync
  - [x] Phase 1: add an app-owned idempotent ToDo live sync service that pulls ERPNext ToDo documents and pushes local Frappe snapshots through the strict Frappe connection factory
  - [x] Phase 2: expose the internal ToDo live sync route and frontend API helper without direct browser access to `.env` or ERPNext
  - [x] Phase 3: add the Frappe workspace live sync button and validate with typecheck, focused Frappe tests, and route-registry coverage
