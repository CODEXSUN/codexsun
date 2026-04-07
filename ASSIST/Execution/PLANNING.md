# Planning

## Current Batch

### Reference

`#37`

### Goal

Complete Stage `1.5.5` and `1.5.7` with framework-owned database backup and security-review operations, including admin pages, side-menu wiring, runtime settings control, and end-to-end validation.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/framework/shared/database-operations.ts`
- `apps/framework/shared/runtime-settings.ts`
- `apps/framework/src/runtime/config/server-config.ts`
- `apps/framework/src/runtime/config/runtime-settings-service.ts`
- `apps/framework/src/runtime/database/process/migrations/05-operations-governance.ts`
- `apps/framework/src/runtime/operations/database-backup-service.ts`
- `apps/framework/src/runtime/operations/security-review-service.ts`
- `apps/framework/src/server/index.ts`
- `apps/api/src/internal/framework-routes.ts`
- `apps/cxapp/web/src/app-shell.tsx`
- `apps/cxapp/web/src/desk/desk-registry.ts`
- `apps/cxapp/web/src/features/framework-data-backup/framework-data-backup-section.tsx`
- `apps/cxapp/web/src/features/framework-security-review/framework-security-review-section.tsx`
- `apps/cxapp/web/src/features/runtime-app-settings/runtime-app-settings-fallback.ts`
- `apps/cxapp/web/src/pages/framework-data-backup-page.tsx`
- `apps/cxapp/web/src/pages/framework-security-review-page.tsx`
- `apps/ui/src/features/dashboard/components/navigation/app-sidebar.tsx`
- `tests/framework/runtime/database-process.test.ts`
- `tests/framework/runtime/operations.test.ts`
- `tests/api/internal/routes.test.ts`
- `tests/e2e/framework-operations.spec.ts`

### Canonical Decisions

- database backup remains framework-owned operations infrastructure, not an app-local concern
- local backups must be retained under `storage/backups/database` and pruned to the configured maximum file count
- Google Drive upload remains optional and is controlled through runtime settings instead of hardcoded env edits
- security review uses an explicit framework-owned checklist ledger based on OWASP ASVS-style control areas, with evidence and review-run history
- backup and security-review controls must be available as dedicated framework admin pages, not only inside generic runtime settings

### Execution Plan

1. finish the framework backup and security-review contracts, persistence, and internal routes
2. wire the runtime backup scheduler and Google Drive configuration through runtime settings
3. build dedicated `Data Backup` and `Security Review` admin pages with tabbed operations UIs
4. register both pages in framework routes, side menu, desk metadata, and settings discovery
5. add migration, service, route, and admin e2e coverage
6. mark `1.5.5` and `1.5.7` complete in `TASK.md`

### Validation Plan

- run `npm run typecheck`
- run `npx.cmd tsx --test tests/framework/runtime/database-process.test.ts tests/framework/runtime/operations.test.ts tests/api/internal/routes.test.ts`
- run `npm run test:e2e -- tests/e2e/framework-operations.spec.ts`
- confirm `TASK.md` marks `1.5.5` and `1.5.7` complete

### Validation Status

- [x] `npm run typecheck`
- [x] `npx.cmd tsx --test tests/framework/runtime/database-process.test.ts tests/framework/runtime/operations.test.ts tests/api/internal/routes.test.ts`
- [x] `npm run test:e2e -- tests/e2e/framework-operations.spec.ts`
- [x] `1.5.5` and `1.5.7` marked complete in `TASK.md`

### Risks And Follow-Up

- automated backup and live restore are currently implemented for SQLite runtime only; MariaDB and PostgreSQL still need driver-specific backup strategies before production use on those drivers
- Google Drive upload is wired and configurable, but operators still need valid OAuth credentials and target folder setup before off-machine archival becomes active
