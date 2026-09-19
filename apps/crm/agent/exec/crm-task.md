# CRM Task Guide

## Source Rules

1. Read `apps/crm/agent/skills.md` before CRM work.
2. Read `apps/crm/README.md`, `apps/crm/api/README.md`, and `apps/crm/web/README.md`.
3. Keep changes inside `apps/crm` unless a reviewed public contract requires shared-package work.
4. Use `@codexsun/ui`, `@codexsun/framework`, and `@codexsun/platform-core` through public exports.
5. Start hosts through root `dev:crm-api` and `dev:crm-web` commands.
6. Run CRM tests and `node tools/check-root-layout.mjs` before completion.

## Product Goal

Build CRM as a complete customer relationship management application.

CRM must help a business manage leads, accounts, contacts, activities, opportunities, quotes, sales handoff, service follow-up, and reports.

CRM owns product modules, API routes, repositories, migrations, seeders, events, and tests under `apps/crm`.

CRM must not copy platform identity, shared UI, runtime configuration, or framework behavior.

## Current State

1. CRM has an API host and a web host.
2. The API exposes `GET /api/v1/crm/health`.
3. The web host uses the shared MDI workspace.
4. CRM has one foundation provider named `crm.foundation`.
5. CRM has no customer, lead, activity, opportunity, quote, or report module yet.

## Delivery Order

### Phase 0: Baseline And Registry

Purpose: make the current CRM scaffold explicit and verifiable.

Tasks:

1. C-001: Document CRM product scope in `apps/crm/README.md`.
2. C-002: Register `crm.foundation` in `assist/modules/registry.md`.
3. C-003: Add CRM API and web configuration notes to the CRM README files.
4. C-004: Verify `npm.cmd run test:crm`.
5. C-005: Verify `node tools/check-root-layout.mjs`.

Acceptance:

1. A developer can describe the CRM scope from the README.
2. The CRM foundation module has a registry entry.
3. CRM host ports, URLs, and tokens are documented without secrets.
4. The current scaffold passes focused CRM checks.

### Phase 1: CRM Foundation Shell

Purpose: create a usable empty CRM workspace before domain data starts.

Tasks:

1. C-010: Build the CRM web landing workspace with shared MDI components.
2. C-011: Add navigation slots for Leads, Accounts, Contacts, Activities, Opportunities, Quotes, Service, and Reports.
3. C-012: Keep empty states inside CRM web modules.
4. C-013: Add a browser-visible health and API status panel.
5. C-014: Add Playwright coverage for first-load CRM shell behavior.

Acceptance:

1. The CRM web app opens inside the shared workspace.
2. The first screen shows CRM navigation and API readiness.
3. Empty states do not pretend that records exist.
4. Playwright proves the visible shell.

### Phase 2: Customer Data Core

Purpose: create the first persistent CRM data model.

Tasks:

1. C-020: Add the `crm.customer` module provider.
2. C-021: Add customer account and contact contracts with Zod schemas.
3. C-022: Add migrations for accounts, contacts, addresses, and communication methods.
4. C-023: Add repositories and services for create, read, update, list, and archive.
5. C-024: Add API routes under `/api/v1/crm`.
6. C-025: Add focused module tests and repository tests.

Acceptance:

1. CRM can store accounts and contacts.
2. API input and output use versioned contracts.
3. Repositories own all SQL access.
4. Tests cover create, update, list, archive, and validation failures.

### Phase 3: Lead Management

Purpose: track new prospects before they become customers.

Tasks:

1. C-030: Add the `crm.leads` module provider.
2. C-031: Add lead source, lead status, qualification, owner, and score fields.
3. C-032: Add lead capture routes.
4. C-033: Add lead assignment and qualification services.
5. C-034: Add lead conversion to account, contact, and opportunity.
6. C-035: Publish a lead converted event after successful conversion.

Acceptance:

1. CRM can create and qualify leads.
2. CRM can convert a lead without duplicate customer data.
3. Conversion uses one transaction.
4. The module declares published and consumed events.

### Phase 4: Activity And Follow-Up

Purpose: make CRM useful for daily sales work.

Tasks:

1. C-040: Add the `crm.activities` module provider.
2. C-041: Add tasks, calls, meetings, notes, email log entries, and reminders.
3. C-042: Link activities to leads, accounts, contacts, and opportunities.
4. C-043: Add due date, owner, status, and completion workflows.
5. C-044: Add activity timeline views in the web app.

Acceptance:

1. Users can schedule and complete CRM activities.
2. Related records show a chronological timeline.
3. Overdue and upcoming work has clear visible states.
4. API and web tests cover the main activity flow.

### Phase 5: Opportunity Pipeline

Purpose: track sales pipeline value and progress.

Tasks:

1. C-050: Add the `crm.opportunities` module provider.
2. C-051: Add pipeline, stage, probability, value, close date, and owner fields.
3. C-052: Add opportunity products or line items through a CRM-owned contract.
4. C-053: Add stage transition rules.
5. C-054: Add list, detail, and pipeline board views.
6. C-055: Add forecast summary endpoints.

Acceptance:

1. CRM can track opportunities by stage.
2. Stage changes validate required data.
3. Pipeline totals match opportunity data.
4. The web app shows list and board workflows.

### Phase 6: Quote And Sales Handoff

Purpose: prepare CRM for sale creation without owning another app business process.

Tasks:

1. C-060: Add the `crm.quotes` module provider.
2. C-061: Add draft quote contracts and line items.
3. C-062: Add quote status transitions.
4. C-063: Define the public handoff contract for a future sales or billing module.
5. C-064: Document the boundary before any shared-package or external app change.

Acceptance:

1. CRM can prepare and approve quotes.
2. CRM does not import private files from another app.
3. Sales handoff uses a documented public contract.
4. Cross-module work waits for reviewed approval.

### Phase 7: Service And Retention

Purpose: support customer follow-up after a sale.

Tasks:

1. C-070: Add the `crm.service` module provider.
2. C-071: Add cases, requests, priority, status, owner, and resolution fields.
3. C-072: Link cases to accounts, contacts, activities, and opportunities.
4. C-073: Add SLA-ready fields without hardcoding a policy.
5. C-074: Add service queue and case detail views.

Acceptance:

1. CRM can track customer service cases.
2. Case data stays inside CRM-owned modules.
3. SLA policy remains configurable and documented.
4. Web flows cover case list and case detail.

### Phase 8: Reporting And Import

Purpose: help users review CRM health and move existing data into CRM.

Tasks:

1. C-080: Add the `crm.reports` module provider.
2. C-081: Add reports for lead funnel, activity load, pipeline value, forecast, and service backlog.
3. C-082: Add CSV import contracts for accounts, contacts, and leads.
4. C-083: Add import validation and error reports.
5. C-084: Add export routes for authorized CRM records.

Acceptance:

1. Reports read only through CRM-owned repositories or public contracts.
2. Imports validate data before writes.
3. Failed imports return useful row-level errors.
4. Exports do not expose unauthorized data.

### Phase 9: Security, Audit, And Deployment Readiness

Purpose: make CRM safe for a selected deployment.

Tasks:

1. C-090: Add CRM permissions and authorization checks through platform identity contracts.
2. C-091: Add audit records for sensitive CRM actions.
3. C-092: Add backup and restore notes for CRM data.
4. C-093: Add Docker and deployment profile checks for CRM.
5. C-094: Record production evidence only after the selected deployment passes.

Acceptance:

1. Unauthenticated access fails.
2. Unauthorized access fails for protected CRM actions.
3. Audit records do not log secrets or sensitive payloads.
4. Deployment evidence names the exact environment and version.

## Work First

Start with Phase 0.

Do not build customer, lead, opportunity, or quote features before the baseline is registered and documented.

First task:

1. C-001: Document CRM product scope in `apps/crm/README.md`.

Then complete:

1. C-002: Register `crm.foundation` in `assist/modules/registry.md`.
2. C-003: Document CRM API and web configuration.
3. C-004: Run `npm.cmd run test:crm`.
4. C-005: Run `node tools/check-root-layout.mjs`.

## Required Handoff

1. Report the CRM module owner.
2. Report the exact scope.
3. Report acceptance criteria.
4. Report passed checks.
5. Report failed checks.
6. Report untested paths.
