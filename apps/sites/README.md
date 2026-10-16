# Sites

## Site Studio direction

Agents must start with [AGENTS.md](AGENTS.md), then read the [agent guide](agent/README.md), [skills](agent/skills.md), and [work plan](agent/PLAN.md).

All Site Studio implementation and tests belong inside `apps/sites`.
Studio uses Platform identity through public host contracts. Platform contains only host composition references for Sites.
Studio business logic, screens, migrations, workers, and client runtimes must stay in Sites.

The current [Site Studio plan](STUDIO-PLAN.md) defines client ownership, MariaDB authoring, SQLite/D1 delivery, publishing, deployment, and monitoring phases.
It supersedes the foundation-only inventory below. The repository now also contains a portfolio site registry and three client website builds.
Phase 0 includes a runnable local SQLite identity store under `clients/runtime/content`. It does not yet publish or sync content.
See the plan for initialization commands, current security gaps, and acceptance gates.

Sites provides **Sites & Web Portals** management. Its purpose is managing public websites, portals, domains, and web content.

## Implemented app foundation

- Separate `@codexsun/sites-api` and `@codexsun/sites-web` workspaces, versioned with the repository.
- Tenant launcher entry, app switching and default-landing selection.
- An app-owned desk with **Overview** and **Getting Started** side-menu entries.
- Authenticated, permission-checked overview showing the current tenant, signed-in user and last checked time. Loading, retry and access-error states use shared UI components.

| Contract                     | Value                                    |
| ---------------------------- | ---------------------------------------- |
| App / entitlement key        | `sites`                                  |
| Overview module / permission | `sites.overview` / `sites.overview.view` |
| Desk URL                     | `/app/sites/overview`                    |
| Getting Started URL          | `/app/sites/guide`                       |
| Browser overview API         | `GET /api/app/sites/overview`            |
| Module-owned API route       | `GET /sites/overview`                    |

The desk uses Platform's existing `TenantMainLayout`, including top menu, sidebar, app header, workspace and status bar. The frontend is composed into Platform Web on its configured port; this foundation does not start an additional web server. Backend routes are composed through the app's public export in Platform API. No app has a separate login or stores browser tokens.

## Activation and access

1. Seed the Platform app registry so the app is available in Plan Access.
2. Enable `sites` through Plan Access; use tenant Entitlements only for an explicit exception and confirm effective access.
3. Run tenant seeding to register `sites.overview.view` and grant it to the existing admin role. Assign other roles explicitly through tenant access management.
4. Sign in or reload tenant runtime context, then select Sites in the app launcher.

The API resolves the active tenant and its isolated database from the authenticated session. It checks live `app_module_settings` activation and the overview permission. Browser tenant/database headers cannot select another tenant. A disabled app is hidden from app switching and its API rejects access. Permission seeds are deterministic and repeatable; rerunning them preserves deliberately disabled permissions and role grants.

## Ownership and database impact

Sites will own web pages, navigation, media assets, templates, and domain mappings. Consume shared contact, organisation and storage services through public contracts.

This read-only foundation creates **no new business tables or migrations**. It uses the existing master `platform_apps` registry and tenant runtime permission/module-setting tables. No existing Core schema is altered. Overview modules explicitly have no CRUD lifecycle, migration, repository, events or workers because they return verified session/tenant context rather than business records.

## Planned modules

Pages and navigation; layout templates and themes; media library; custom domain bindings; SEO metadata and analytics integrations.

These are planned workflows, not implemented screens. The side menu exposes only working overview and onboarding pages. No pages, domains, or assets are fabricated or seeded.

## Development and verification

Run commands from the repository root; use the root dependency installation and output directories:

```bash
npm run dev:api
npm run dev:web
npm run typecheck -w @codexsun/sites-api
npm run typecheck -w @codexsun/sites-web
node tools/check-module-boundaries.mjs sites-api
node tools/check-module-boundaries.mjs sites-web
npm run test:tenant-app-foundations
```
