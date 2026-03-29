# Coding Standards

## Core Principles

1. TypeScript is mandatory across frontend, backend, desktop, and shared code.
2. Business logic belongs in domain or application layers, not UI handlers.
3. Framework services and app business logic must stay separated.
4. Shared business masters belong under `apps/core`.
5. Prefer explicit failures and contextual errors over silent fallbacks.

## Framework Rules

1. Platform runtime concerns belong in `apps/framework`.
2. Authentication belongs at framework level.
3. Database, config, migrations, storage, notifications, payments, HTTP helpers, and future cache/jobs/realtime/CLI blocks should stay explicit.
4. Do not move ecommerce or billing business logic into framework for convenience.

## App Rules

1. `apps/cxapp` owns the active suite-facing product shell.
2. `apps/core` owns shared business masters and reusable business-common flows.
3. `apps/api` owns internal and external route definitions.
4. `apps/ecommerce` owns ecommerce workflows.
5. `apps/billing` owns accounting, inventory, billing, and reporting workflows.
6. `apps/site` owns static presentation only.
7. `apps/ui` owns reusable UI primitives and shared UX building blocks.
8. `apps/cli` owns operational control commands.
9. `apps/task` owns enterprise task workflows.
10. `apps/frappe` owns Frappe integration boundaries.
11. `apps/tally` owns Tally integration boundaries.

## Backend Rules

1. Validate input at boundaries before invoking use cases.
2. Keep transport, application, domain, and persistence concerns separate.
3. Financial writes must be atomic, balanced, traceable, and audit-safe.
4. Never hard-delete financial or stock-affecting records.

## Frontend Rules

1. React components should compose state and presentation, not own domain rules.
2. App shells should not hide business decisions that belong in backend or domain code.
3. Reusable UI primitives belong in `apps/ui`.

## Documentation Coupling

Architecture-relevant changes must update:

1. `ASSIST/Documentation/ARCHITECTURE.md`
2. `ASSIST/Documentation/PROJECT_OVERVIEW.md`
3. `ASSIST/Documentation/CHANGELOG.md`
