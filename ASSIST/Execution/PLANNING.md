# Planning

## Active Batch

- `#138` Align Frappe ToDo snapshots to the live ERPNext ToDo DocType
  - Scope: make the app-owned Frappe ToDo snapshot, sync payload, and workspace dialog match the live ERPNext `ToDo` DocType field pattern instead of the earlier simplified snapshot.
  - Constraint: use the existing env-backed Frappe connector for metadata verification and keep orchestration inside `apps/frappe`.
  - Assumption: the live site's `ToDo` DocType fields are the authority for this connector surface: status, priority, color, date, allocated_to, description, reference_type, reference_name, role, assigned_by, assigned_by_full_name, sender, and assignment_rule.
  - Phase 1: inspect the live ERPNext ToDo DocType metadata through the env-backed connector. Completed.
  - Phase 2: expand the shared ToDo contract, seed data, and sync mapping to preserve ERPNext fields. Completed.
  - Phase 3: update the ToDo dialog and data grid to expose the ERPNext field pattern and validate with focused tests. Completed.
