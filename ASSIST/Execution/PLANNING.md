# Planning

## Current Batch

### Reference

`#16`

### Goal

Add an app-owned Frappe connector baseline that keeps ERPNext settings, snapshots, and sync orchestration inside `apps/frappe`, uses `apps/api` only for protected route exposure, keeps `apps/ecommerce` as the owner of commerce records, and uses `apps/framework` only for reusable runtime plumbing.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/SETUP_AND_RUN.md`
- `apps/framework/src/runtime/database`
- `apps/framework/src/application`
- `apps/api/src`
- `apps/cxapp/web/src`
- `apps/frappe/shared`
- `apps/frappe/database`
- `apps/frappe/src`
- `apps/frappe/web/src`
- `apps/ecommerce/src`
- `tests/api`
- `tests/frappe`
- `tests/framework/runtime`
- `ASSIST/AI_RULES.md`

### Canonical Decisions

- ERPNext settings, todo snapshots, item snapshots, purchase receipt snapshots, and connector sync logs belong to `apps/frappe`, not `apps/framework` or `apps/ecommerce`
- `apps/ecommerce` remains the owner of products and storefront projection, so Frappe may only use a narrow app-owned write service there instead of writing tables ad hoc
- `apps/api` should stay route-only, with the new `frappe` endpoints mounted under the protected internal surface
- `apps/cxapp` should render the Frappe workspace through the shared desk route model instead of importing temp-only pages or route structures
- the first Frappe baseline should be database-backed, desk-visible, sync-capable, and test-covered, but still documented honestly as a baseline connector rather than a complete ERPNext integration platform

### Execution Plan

1. move the Frappe contracts and temp-derived connector data into app-owned `apps/frappe/shared`, `apps/frappe/database`, and `apps/frappe/src`
2. register `frappe` database migrations and seeders through the framework runtime
3. implement `frappe` services for settings, todos, items, receipts, and ecommerce sync orchestration
4. expose protected internal `frappe` routes through `apps/api`
5. adapt the connector UI into the shared desk pattern through `apps/frappe/web` and `apps/cxapp/web`
6. add a narrow ecommerce product admin write path for item sync
7. add route, database, and connector sync tests
8. update ASSIST docs and validate typecheck, lint, test, and build

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing imported table warnings only)
- [x] `npm run test`
- [x] `npm run build`

### Risks And Follow-Up

- the connector still uses app-owned snapshot tables and baseline sync logic rather than a full ERPNext webhook, job queue, or bidirectional reconciliation model
- connection secrets are stored in the Frappe app database table for now; stronger secret-management rules can come later if the deployment model requires them
- some broader business modules remain read-oriented; this batch focused on the Frappe connector boundary and its ecommerce sync adoption, not every remaining downstream write workflow
