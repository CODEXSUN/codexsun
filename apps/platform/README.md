# Platform

## Component documentation

The authenticated runtime, tenant routing, application composition, entitlements, permissions, queues, storage, administration, and Windows host.

Composition registers public app contracts. Business CRUD stays in each owner. Preserve Corporate ID resolution, signed session context, live authorization, and server-only secrets.

Platform passes Ecommerce its verified tenant database name and tenant public storage root. Ecommerce owns storefront organisation settings and logo files. Local development storefront routing uses the configured `DEFAULT_TENANT_CORPORATE_ID` even when demo seeding is disabled. Production retains verified-domain routing.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `access-control`, `app-orchestration`, `app-registry`, `credential-recovery`, `database-maintenance`, `entitlement`, `industry`, `plan`, `platform-activity`, `qcafe`, `queue-manager`, `storage-manager`, `subscription`, `task-manager`, `tenant`, `tenant-domain`, `tenant-permission`, `tenant-role`, `tenant-role-permission`, `tenant-user`, `tenant-user-role`.
- `web/src/modules`: `access-control`, `app-orchestration`, `app-registry`, `entitlement`, `industry`, `master-database`, `plan`, `plan-access`, `platform-activity`, `queue-management`, `storage-manager`, `subscription`, `task-manager`, `tenant`, `tenant-access`, `tenant-database`, `tenant-domain`, `tenant-permission`, `tenant-portal`, `tenant-role`, `tenant-role-permission`, `tenant-user`, `tenant-user-role`.
- `windows/`: `Packaging`, `scripts`, `src`, `src-tauri`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs platform`
- `npm run typecheck -w @codexsun/platform-api`
- `npm run lint -w @codexsun/platform-api`
- `npm run build -w @codexsun/platform-api`
- `npm run typecheck -w @codexsun/platform-web`
- `npm run lint -w @codexsun/platform-web`
- `npm run build -w @codexsun/platform-web`
- `npm run typecheck -w @codexsun/windows`
- `npm run lint -w @codexsun/windows`
- `npm run build -w @codexsun/windows`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/platform-api`.
- `web`: `@codexsun/platform-web`.
- `windows`: `@codexsun/windows`.

### Declared internal dependencies

- `@codexsun/accounts-api`
- `@codexsun/accounts-web`
- `@codexsun/auditor-api`
- `@codexsun/auditor-web`
- `@codexsun/billing-api`
- `@codexsun/billing-web`
- `@codexsun/blog`
- `@codexsun/chat-api`
- `@codexsun/chat-web`
- `@codexsun/codexsun-api`
- `@codexsun/codexsun-web`
- `@codexsun/core-api`
- `@codexsun/core-web`
- `@codexsun/crm-api`
- `@codexsun/crm-web`
- `@codexsun/docs-api`
- `@codexsun/docs-web`
- `@codexsun/ecommerce-api`
- `@codexsun/ecommerce-web`
- `@codexsun/framework`
- `@codexsun/frappe-api`
- `@codexsun/frappe-web`
- `@codexsun/himsx-api`
- `@codexsun/himsx-web`
- `@codexsun/hrms-api`
- `@codexsun/hrms-web`
- `@codexsun/logicx-erp-api`
- `@codexsun/logicx-erp-web`
- `@codexsun/mail-api`
- `@codexsun/mail-web`
- `@codexsun/notes-api`
- `@codexsun/notes-web`
- `@codexsun/project-manager-api`
- `@codexsun/project-manager-web`
- `@codexsun/qcafe-api`
- `@codexsun/sites-api`
- `@codexsun/sites-web`
- `@codexsun/ui`
- `@codexsun/uiux`
- `@codexsun/zetro-api`
- `@codexsun/zetro-web`
- `@codexsun/zuno-api`
- `@codexsun/zuno-web`
