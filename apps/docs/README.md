# Docs — developer documentation

Docs provides a developer reference for every local application/devkit and the external Blog integration. Its source pages explain application purpose, core business ownership, supported workflow, executable module contracts, and planned capabilities separately.

## Read the documentation

Enable Docs, run its migrations/permission seeds, then open **Docs → Developer Library** at `/app/docs/library`. The main sidebar groups pages by application and shows Overview, Business, Workflow, Module Catalog and individual module pages. Search filters app, group, module and title. Page links are bookmarkable through `?page=<application/page-key>`.

The current library contains **231 pages across 19 application groups**, including 154 module/workspace references. The generated source inventory distinguishes fixed route declarations and CREATE TABLE literals from dynamic composition; it does not claim an absent literal means an absent capability. Q Cafe's nonstandard POS/master/printing/backup surfaces and the external Blog host contract are documented explicitly.

The existing Docs Overview and Getting Started pages remain available. Platform provides the authenticated Main Layout, session, app launcher and tenant routing; Docs has no separate login or web server.

## Files and database: explicit precedence

| Source                                     | Ownership                                                                     | Rendering                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `content/applications/<app>/*.md` / `.mdx` | Reviewed repository baseline                                                  | Build-time MDX compilation to lazy React chunks                                      |
| `content/catalog.json`                     | Stable page keys, application/group headings, source paths and SHA-256 hashes | Validated metadata seeded into each enabled tenant database                          |
| `docs_knowledge_pages.body_override`       | Tenant-owned Markdown override                                                | Safe React Markdown rendering; no MDX compilation, JavaScript evaluation or raw HTML |
| `docs_knowledge_activity`                  | Transactional source/edit/restore audit                                       | Page Activity view                                                                   |

An active tenant override replaces the repository **body only**. Application groups, titles, source paths and source hashes remain file-controlled. Restoring clears the override and reveals the repository body. Editing never writes to Git. Reseeding refreshes source metadata/hashes, increments a changed source revision and preserves tenant overrides and deliberately inactive permissions/grants. Removed source keys disappear from the readable catalog without deleting historical database rows.

Every save/restore supplies `expectedRevision`; stale writes return a conflict. File paths are selected only from the validated, allowlisted manifest. The API never accepts arbitrary filesystem paths. Both sources remain developer evidence, not runtime authority or instructions to execute.

## Markdown and MDX compiler

Platform Vite uses `@mdx-js/rollup` with `@mdx-js/react`, GFM, heading slugs/links and highlighted fenced code. Reviewed MDX can use the registered `Callout` and `Workflow` React components. The reader includes tables, lists/tasks, internal documentation links, source view, table of contents, responsive typography and activity history.

Database content uses `react-markdown` with matching GFM/heading/highlight plugins and raw HTML disabled. Database JSX and script tags never become React components or executable code. The compiler only processes reviewed repository files during development/build.

## Authoring and source inventory

Edit the app's source pages under `apps/docs/content/applications`. Add each new page to `catalog.json` with a unique stable page key and the app/group/module metadata; keys determine public UUID identity. Overview/business/workflow prose is authored from the owner's current implementation. Module pages record source files, explicit routes, created tables and detected permissions; update these facts when a contract changes.

```bash
# Refresh file checksums after a reviewed source edit:
npm run docs:catalog
# Check hashes, unlisted files, duplicate keys and module coverage:
npm run docs:check
# Provision updated file metadata/permissions through tenant seeding:
npm run db:seed
```

The coverage check scans all local API/Web/Storefront module entry points and rejects missing reference pages. Do not rename page keys casually: add a new key intentionally and preserve history for the old key. Repository Assist governance remains authoritative for agent work.

## Activation, permissions and APIs

Enable `docs` through Plan Access and confirm effective tenant Entitlements. Run tenant migrations and seeding before use. Existing admin roles receive the two knowledge permissions; grant other developer roles explicitly.

| Contract                     | Value                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| App key                      | `docs`                                                                                        |
| Overview access              | `docs.overview.view`                                                                          |
| Read developer reference     | `docs.knowledge.view`                                                                         |
| Save/restore tenant Markdown | `docs.knowledge.edit` plus view access                                                        |
| Catalog                      | `GET /api/app/docs/knowledge`                                                                 |
| Read page                    | `GET /api/app/docs/knowledge/:uuid`                                                           |
| Save/restore                 | `PUT /api/app/docs/knowledge/:uuid` with `{ body: string or null, expectedRevision: number }` |

All protected operations resolve the live signed tenant database and check Docs activation and permissions. Forged browser tenant/database headers cannot switch the owner. No-store responses prevent caching a tenant override as another tenant's page. Source pages are Git-controlled protected references: runtime create, suspend and delete are intentionally absent.

## Assistant connections

**Zetro:** use `/docs billing workflow` or `/docs sales` in tenant chat. The fixed `docs.developer.read` lookup requires current Zetro chat access, Docs activation and `docs.knowledge.view`. It returns at most five 5,000-character effective tenant excerpts with page URLs, source identity and revision/origin. It persists the interaction/tool decision with chat audit and masks earlier documentation answers after permission revocation. The command does not call the AI provider or generate SQL, edits or grants. Billing/CRM capability-grant behavior remains unchanged.

**Zuno:** Super Admin can use the `search_developer_docs` model tool in diagnostics/saved conversations or `GET /api/app/zuno/developer-docs?query=...`. Its injected public Docs lookup reads reviewed repository pages only, never tenant overrides. Normal model diagnosis still requires a configured provider. Documentation evidence does not execute code or expand Super Admin correction permissions.

## Database and deployment

New Docs-owned tables are `docs_knowledge_pages` (INT internal ID, unique eight-character UUID/page key, metadata, nullable override, revision/status/timestamps) and `docs_knowledge_activity` (audit linked by restrictive page UUID foreign key). The `docs.knowledge` migration batch records step `docs_knowledge_pages` in the existing `migration_schema` ledger. Existing Core tables and applied migration checksums are unchanged.

Docs API build copies source assets to root `dist/apps/docs/content`. Production resolution supports the compiled API layout and fails closed if assets are missing. Platform Web embeds reviewed pages as lazy MDX chunks. Deploy matching API content assets, file catalog and frontend chunks; do not deploy tenant database text as executable modules.

## Verification

Run all commands from the root:

```bash
npm run docs:check
npm run test:docs
npm run test:e2e:docs
npm run check
npm run dependencies:check
npm run build
```

The E2E suite is restricted to isolated `codexsun_dev_` databases and verifies tenant access, persisted/audited overrides, stale revision conflicts, safe reseeding, restoration and Zuno's Super Admin boundary. Browser verification covers app-group navigation, compiled MDX, GFM/highlighting, source/TOC, edit/restore, search and mobile layout. Configure model providers separately; no live external model call is required by the focused assistant contract tests.

Root production builds compile from current sources (`--force`) to avoid overlapping root-dist cache restores. The MDX plugin runs before Vite's JS transform, Docs module aliases resolve the physical workspace for development HMR, and Markdown dependencies are prebundled for browser-compatible imports.
