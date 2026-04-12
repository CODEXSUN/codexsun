# Planning

## Active Batch

- `#144` Align Frappe product manager with ToDo workspace
  - Scope: make the Frappe item/product manager use a dedicated product snapshot table and the same compact operational UX pattern as the ToDo workspace.
  - Constraint: keep Frappe-owned snapshot persistence inside `apps/frappe`; syncing into core products remains an explicit super-admin projection action.
  - Assumption: `frappe_products` should become the current product snapshot store while `frappe_items` remains readable as a legacy fallback for existing databases.
  - Phase 1: add an app-owned Frappe product snapshot table and seed path. Completed.
  - Phase 2: persist current Frappe product snapshots through the new table with legacy item fallback. Completed.
  - Phase 3: refactor the Item Manager UI into the same compact MasterList and popup pattern as ToDos. Completed.
  - Phase 4: validate typecheck and focused Frappe/database tests. Pending.
