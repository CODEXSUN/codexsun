# Task

## Active Batch

- [x] `#145` Remove inactive Zetro wiring and sanitize ERPNext ToDo HTML
  - [x] Phase 1: remove broken `zetro` app, route, desk, and database references from the active suite
  - [x] Phase 2: sanitize ERPNext ToDo HTML descriptions into plain text at the Frappe sync boundary
  - [x] Phase 3: validate `typecheck`, focused database tests, and full `npm run build`
