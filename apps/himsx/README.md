# Himsx

Himsx means **Hospital Information Management System**. Its purpose is hospital information and administrative operations.

## Implemented app foundation

- Separate `@codexsun/himsx-api` and `@codexsun/himsx-web` workspaces, versioned with the repository.
- Tenant launcher entry, app switching and default-landing selection.
- An app-owned desk with **Overview** and **Getting Started** side-menu entries.
- Authenticated, permission-checked overview showing the current tenant, signed-in user and last checked time. Loading, retry and access-error states use shared UI components.

| Contract                     | Value                                    |
| ---------------------------- | ---------------------------------------- |
| App / entitlement key        | `himsx`                                  |
| Overview module / permission | `himsx.overview` / `himsx.overview.view` |
| Desk URL                     | `/app/himsx/overview`                    |
| Getting Started URL          | `/app/himsx/guide`                       |
| Browser overview API         | `GET /api/app/himsx/overview`            |
| Module-owned API route       | `GET /himsx/overview`                    |

The desk uses Platform's existing `TenantMainLayout`, including top menu, sidebar, app header, workspace and status bar. The frontend is composed into Platform Web on its configured port; this foundation does not start an additional web server. Backend routes are composed through the app's public export in Platform API. No app has a separate login or stores browser tokens.

## Activation and access

1. Seed the Platform app registry so the app is available in Plan Access.
2. Enable `himsx` through Plan Access; use tenant Entitlements only for an explicit exception and confirm effective access.
3. Run tenant seeding to register `himsx.overview.view` and grant it to the existing admin role. Assign other roles explicitly through tenant access management.
4. Sign in or reload tenant runtime context, then select Himsx in the app launcher.

The API resolves the active tenant and its isolated database from the authenticated session. It checks live `app_module_settings` activation and the overview permission. Browser tenant/database headers cannot select another tenant. A disabled app is hidden from app switching and its API rejects access. Permission seeds are deterministic and repeatable; rerunning them preserves deliberately disabled permissions and role grants.

## Ownership and database impact

Himsx will own patient, encounter and hospital records. Consume shared contact, organisation and Billing services through public contracts. Clinical access and audit must be designed before introducing patient or clinical records.

This read-only foundation creates **no new business tables or migrations**. It uses the existing master `platform_apps` registry and tenant runtime permission/module-setting tables. No existing Core schema is altered. Overview modules explicitly have no CRUD lifecycle, migration, repository, events or workers because they return verified session/tenant context rather than business records.

## Planned modules

Patient registration and identity; appointments and queues; encounters and clinical records; admissions, beds and discharge; diagnostics/pharmacy; hospital charge capture and billing integrations.

These are planned workflows, not implemented screens. The side menu exposes only working overview and onboarding pages. No employee, documentation-page, patient, payroll or clinical records are fabricated or seeded.

## Development and verification

Run commands from the repository root; use the root dependency installation and output directories:

```bash
npm run dev:api
npm run dev:web
npm run typecheck -w @codexsun/himsx-api
npm run typecheck -w @codexsun/himsx-web
node tools/check-module-boundaries.mjs himsx-api
node tools/check-module-boundaries.mjs himsx-web
npm run test:tenant-app-foundations
npm run test:e2e:tenant-app-foundations
```

The E2E command requires the development Platform stack and an isolated `codexsun_dev_` master and tenant database. It verifies login, published launcher metadata, each overview, forged-header isolation, inactive module/permission rejection and repeatable permission seeding. It restores any temporary access changes. Root `npm run check`, `npm run dependencies:check` and `npm run build` remain the release gates.
