# Coding Standards

## Core Principles

1. TypeScript is mandatory across frontend, backend, desktop, and shared code.
2. Business logic belongs in domain or application layers, not UI handlers.
3. Framework services and app business logic must stay separated.
4. Shared business masters belong under `apps/core`.
5. Prefer explicit failures and contextual errors over silent fallbacks.

## Framework Rules

1. Platform runtime concerns belong in `apps/framework`.
2. Authentication primitives may live in `apps/framework`, but auth domain ownership belongs in `apps/cxapp`.
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
11. `apps/crm` owns CRM workflows.
12. `apps/tally` owns Tally integration boundaries.

## Backend Rules

1. Validate input at boundaries before invoking use cases.
2. Keep transport, application, domain, and persistence concerns separate.
3. Financial writes must be atomic, balanced, traceable, and audit-safe.
4. Never hard-delete financial or stock-affecting records.
5. Follow a pragmatic hexagonal model for new backend work: business rules depend on ports and contracts, while transport, DB, payment, mail, ERP, and media concerns stay in adapters.
6. Treat cross-app private imports as architectural violations; cross-app usage must go through app-owned `src/public` contracts.
7. Prefer application services for use-case orchestration and keep framework or SDK details out of domain logic.
8. Introduce repository interfaces, ports, and adapters where complexity justifies them; do not add ceremony without a real use case.
9. Use DDD selectively in stable domains only; aggregates, value objects, and domain events are not mandatory for every module.
10. Introduce typed in-process events only after state changes and only when real cross-module reactions exist.

## Frontend Rules

1. React components should compose state and presentation, not own domain rules.
2. App shells should not hide business decisions that belong in backend or domain code.
3. Reusable UI primitives belong in `apps/ui`.
4. New app-specific frontend work should prefer feature folders that separate page composition, data access, view mapping, and presentation.
5. Do not bury API calls, domain decisions, and transformation logic directly inside routed page components when a feature module is warranted.

## Pragmatic Adoption Levels

1. Mandatory first:
   - boundary hardening
   - app-owned `src/public` entry points
   - thin transport layers
   - explicit ownership
2. Introduce when complexity exists:
   - application and domain separation
   - ports and adapters
   - repository interfaces
   - feature-folder frontend structure
3. Introduce only in stable, complex domains:
   - aggregates
   - value objects
   - domain events
   - command and query split
   - event listeners and richer event workflows

Rules:

1. Do not create folders only because the target blueprint mentions them.
2. Add structure only when the use case, boundary, or review burden justifies it.
3. Prefer strangler-style refactors over broad delete-and-rebuild rewrites.

## Documentation Coupling

Architecture-relevant changes must update:

1. `ASSIST/Documentation/ARCHITECTURE.md`
2. `ASSIST/Documentation/PROJECT_OVERVIEW.md`
3. `ASSIST/Documentation/CHANGELOG.md` when the change belongs in project history
