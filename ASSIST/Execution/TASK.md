# Task

## Active Batch

### Reference

`#16`

### Title

`App-owned frappe connector baseline and ecommerce sync adoption`

### Scope Checklist

- [x] add app-owned `frappe` shared contracts, workspace metadata, migrations, and seeders for connector settings, todo snapshots, item snapshots, purchase receipt snapshots, and item sync logs
- [x] register the `frappe` database module through the framework runtime without moving connector ownership into `apps/framework`
- [x] add app-owned `frappe` services for settings, todos, items, purchase receipts, and ecommerce sync orchestration
- [x] expose protected internal `frappe` routes through `apps/api`
- [x] add an app-owned `frappe` workspace in the shared desk with overview, connection, todo, item, and purchase receipt sections
- [x] add a narrow ecommerce product admin write path so the connector can project item syncs into ecommerce without moving commerce ownership into `frappe`
- [x] add connector tests that cover database registration, route exposure, settings save, item sync, and purchase receipt sync
- [x] update ASSIST task, planning, architecture, setup, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run test`

## Next Batch

### Reference

`#17`

### Title

`Domain write flows and auth hardening`

### Scope Checklist

- [ ] add write flows for create and update operations where the current desk is still read-only
- [ ] normalize the current module payload tables into richer relational structures where the baseline schema is still coarse
- [ ] add refresh-token rotation, rate limiting, stronger audit trails, and admin-facing auth management surfaces beyond the current baseline
