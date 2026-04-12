# Planning

## Active Batch

- `#145` Remove inactive Zetro wiring and sanitize ERPNext ToDo HTML
  - Scope: remove the missing `zetro` app from active suite composition so production builds stop importing absent modules, and sanitize ERPNext ToDo HTML into plain text before it reaches the local snapshot store.
  - Constraint: keep the current workspace honest to what exists on disk today; do not leave placeholder imports or route registrations for an app that is not present in this repository.
  - Assumption: ERPNext ToDo descriptions should be stored and displayed as normalized plain text in this connector workspace even when ERP returns Quill HTML wrappers.
  - Phase 1: remove broken `zetro` app, route, desk, and database references from the active suite. Completed.
  - Phase 2: sanitize ERPNext ToDo HTML descriptions into plain text at the Frappe sync boundary. Completed.
  - Phase 3: validate `typecheck`, focused database tests, and full `npm run build`. Completed.
