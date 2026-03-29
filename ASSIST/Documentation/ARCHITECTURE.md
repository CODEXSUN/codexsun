# Architecture

## Purpose

This file is the single source of truth for framework and app architecture.

If another ASSIST file conflicts with this file, this file wins.

## Platform Goal

Codexsun is not intended to become one oversized app with many screens. It is intended to become a reusable business software platform that can deliver:

1. billing-only products
2. ERP-style combined suites
3. ecommerce and shopping cart products
4. CRM products
5. connector-led integration solutions for systems such as Frappe, Zoho, and Tally

## Source Roots

All source code lives under one `apps/` container:

1. `apps/framework`
2. `apps/core`
3. `apps/ecommerce`
4. `apps/billing`
5. `apps/site`
6. `apps/ui`
7. `apps/docs`
8. `apps/cli`
9. `apps/orekso`
10. `apps/task`
11. `apps/frappe`
12. `apps/mcp`

## Platform Structure

The whole system is one platform with explicit boundaries between reusable framework code, shared business-common foundations, standalone apps, and integration connectors.

### Framework

`apps/framework` owns reusable platform-level services and contracts. It should be reusable for any standalone app and should not depend on app business rules.

Framework responsibilities:

1. authentication
2. database
3. config
4. migrations
5. files and media storage
6. notifications
7. payments
8. HTTP runtime helpers
9. platform manifests
10. hosted services and background jobs
11. app composition contracts
12. connector runtime contracts
13. future cache and realtime blocks

Database migration rule:

1. migrations are owned by framework modules under `apps/framework/src/runtime/database/migrations/modules/<module>`
2. each module keeps its own migration files and registry instead of adding everything to one flat dump list
3. the top-level migration index only builds the ordered execution plan from module registries
4. new migrations must use sortable ids so execution order stays deterministic across modules
5. migration sections must stay ordered under `migrations/modules/<module>/sections`
6. major tables or stable logical table groups must live in separate ordered files or ordered section files
7. schema contracts for large table sets must also be split by ordered section files under `apps/framework/src/runtime/database/schema/sections`

HTTP contract rule:

1. framework-owned HTTP namespaces, request context, route policy, and route manifests belong under `apps/framework/src/runtime/http`
2. internal, external, and public API surfaces must stay explicit even before a live host mounts them
3. do not mix all API surfaces and request rules into one oversized runtime file
4. public framework HTTP docs must be added under `apps/docs/framework` in the same batch as new runtime HTTP modules

Current framework code lives mainly in:

1. `apps/framework/src/auth`
2. `apps/framework/src/connectors`
3. `apps/framework/src/mailbox`
4. `apps/framework/src/runtime`
5. `apps/framework/src/runtime/http`
6. `apps/framework/src/runtime/database/schema`
7. `apps/framework/src/app-suite.ts`
8. `apps/framework/src/manifest.ts`

### Core

`apps/core` owns shared business masters and reusable business-common behavior.

Core is not the dumping ground for app logic. It exists only for capabilities that are valid across multiple standalone apps.

Target core ownership:

1. company
2. contact
3. common modules
4. media
5. shared settings
6. setup/bootstrap
7. shared schemas and domain contracts

Planned core code will live in:

1. `apps/core/api`
2. `apps/core/desktop`
3. `apps/core/domain`
4. `apps/core/shared`

### Ecommerce

`apps/ecommerce` owns ecommerce and customer-commerce behavior.

Target ecommerce ownership:

1. product
2. storefront
3. checkout
4. commerce order operations
5. customer profile
6. customer helpdesk
7. ecommerce web UX

Planned ecommerce code will live in:

1. `apps/ecommerce/api`
2. `apps/ecommerce/web`
3. `apps/ecommerce/domain`

### Billing

`apps/billing` is the separate accounting, inventory, and reporting application.

Target billing structure:

1. `apps/billing/api`
2. `apps/billing/web`
3. `apps/billing/desktop`
4. `apps/billing/core`
5. `apps/billing/connectors`

### Site

`apps/site` is the static presentation surface. It is not a business app.

### UI

`apps/ui` owns reusable UI and UX building blocks for the full product suite.

UI responsibilities:

1. global design tokens and shared CSS
2. theme and provider wiring
3. reusable primitives
4. reusable UX building blocks
5. neutral layout and composition patterns
6. open-source redistribution packaging for the shared design layer
7. shared desk and dashboard presentation patterns for multi-app shells

Current UI code lives mainly in:

1. `apps/ui/src/components/ui`
2. `apps/ui/src/components/ux`
3. `apps/ui/src/styles`
4. `apps/ui/src/theme`
5. `apps/ui/src/lib`

Shared UI scope rule:

1. `apps/ui` is the only shared design-system surface for other apps
2. app code should consume the public package exports, not internal docs or demo files inside `apps/ui`
3. docs-only, registry-only, or migration/demo helper files under `apps/ui` must not become hidden production dependencies for framework or business apps

### Docs

`apps/docs` owns the consolidated documentation surface for the whole suite.

It should contain:

1. startup documentation
2. app ownership documentation
3. server operations notes
4. cross-app reference documentation

### CLI

`apps/cli` owns server-side operational control commands for the suite.

It should provide:

1. app listing
2. build orchestration
3. server start helpers
4. runtime health and environment checks
5. githelper automation for version bump, changelog checks, commit flow, and release tagging

### Orekso

`apps/orekso` owns the local-first support-assistant runtime.

Target Orekso ownership:

1. approved Codexsun knowledge ingestion
2. Qdrant vector indexing for support-safe sources
3. Ollama-backed answer generation
4. assistant-specific runtime health and indexing status

Planned Orekso code will live in:

1. `apps/orekso/server`

### Task

`apps/task` owns the standalone enterprise task management application.

Target task ownership:

1. task creation and editing
2. task workspaces
3. team task workflows

Planned task code will live in:

1. `apps/task/domain`
2. `apps/task/legacy`
3. `apps/task/web`

### Frappe

`apps/frappe` acts as the domain boundary for Frappe-specific external system data contracts and integration logic.

Target frappe ownership:

1. Frappe-specific data contracts
2. Frappe connector boundary

Planned frappe code will live in:

1. `apps/frappe/domain`

## Application Model

Every standalone app should follow this model:

1. the app owns its business rules, routes, UI flows, and delivery surface
2. the app consumes framework services through a composition root and DI-style registration model
3. the app may reuse shared core capabilities, but must not hide app behavior inside core
4. the app may expose optional connectors, but connector code must stay isolated behind explicit boundaries

The framework should make it possible to run apps:

1. alone
2. together in a suite host
3. with client-specific enablement
4. with or without optional connectors

Frontend bootstrap rule:

1. the browser entry point belongs to `apps/framework/src/main.tsx`
2. standalone app shells register under framework bootstrap instead of owning the top-level startup forever
3. app-specific pages may still live in their own app folders while bootstrap ownership is being extracted

App shell rule:

1. each app web surface should expose a dedicated shell module under its own app folder such as `apps/<app>/web/src/shell`
2. the shell owns app-specific providers, routing, toasters, and browser-router setup
3. framework bootstrap should only select and render shells, not absorb app-specific provider trees
4. feature pages and app business flows must stay behind the app shell instead of leaking into framework bootstrap

Route ownership rule:

1. route definitions must be grouped by module, bounded feature, or stable surface under the app boundary
2. shared desk shells may read route metadata, but the desk must not become the dumping ground for every page definition
3. route metadata should stay explicit so sidebars, headers, and future permissions can scale without filesystem guessing

Shared web runtime rule:

1. shared global web styles belong to `apps/ui/src/styles`
2. shared theme contracts and providers belong to `apps/ui/src/theme`
3. shared UI primitives and shared UX building blocks belong to `apps/ui/src/components`
4. framework may compose shared UI, but framework must not re-own shared styles or shared theme providers inside its own source tree
5. app-specific presentation still belongs in the app when it cannot be reused safely across apps

Workspace artifact rule:

1. workspace packages may keep package-local `package.json` and minimal `tsconfig` files when needed for npm workspaces or package-specific tooling
2. package-local `node_modules`, `dist`, and TypeScript cache folders should not be treated as permanent homes for builds or installs
3. root `node_modules`, root `build/`, and root cache locations should carry shared workspace artifacts instead

## Standalone App And Plugin Module Model

1. standalone apps are shippable delivery surfaces such as framework, billing, or future CRM apps
2. plugin modules extend standalone apps through framework contracts instead of direct hidden imports
3. module packages such as `frappe` must publish clear manifests, entry files, and runtime targets
4. plugin modules may target server, web, desktop, or shared runtime layers, but must remain behind explicit contracts
5. standalone apps own business delivery while plugin modules own bounded extensions or connectors

## Build Output Model

1. all generated build artifacts live under the shared root `build/`
2. standalone app builds go to `build/app/<app>/<target>`
3. plugin or module builds go to `build/module/<module>/<target>`
4. app-local source trees should not become permanent homes for release artifacts once a shared build root exists
5. the root build layout exists to simplify multi-app packaging, release audits, and future CI/CD flows

Shared UI redistribution rule:

1. `apps/ui` must produce a redistribution-ready package artifact under `build/app/ui/package`
2. the publishable package must include runtime entry files, type declarations, styles, README, and license material
3. framework and future apps should consume the workspace package instead of copying shared presentation code

## Delivery Modes

The repository should support these delivery modes over time:

1. billing-only
2. commerce-only
3. CRM-only
4. ERP-style multi-app suite
5. integration-only bridge deployments

Delivery strategy rule:

1. each new app should begin with an explicit MVP scope before broadening into full-suite behavior
2. SaaS-first hosted delivery is the default speed path for rapid iteration
3. desktop, offline, and connector-heavy paths should branch from stable SaaS-proven contracts instead of being the first implementation target

## Runtime Model

Current runtime reality:

1. `apps/framework` is the active browser bootstrap and shared runtime package.
2. `apps/ui` is the active shared UI and UX workspace package for cross-app presentation.
3. `apps/cli` now owns githelper and release automation for the repository.
4. `apps/framework/src/main.tsx` is the active browser entry point.
5. `apps/framework/src/runtime` owns the initial environment and multi-database runtime configuration.
6. `apps/framework/src/runtime/http` now defines framework API namespaces, request metadata contracts, route policies, and route assemblies.
7. `apps/framework/src/runtime/database/schema` now defines the first platform-foundation table contracts and ordered layer plan.
8. `apps/framework/src/connectors` now defines the first plugin-module contracts.
9. standalone app builds now target the root `build/app` layout.
10. `apps/ui` now produces a redistribution-ready package artifact under `build/app/ui/package`.
11. plugin or module builds are reserved under the root `build/module` layout.
12. additional app roots such as `core`, `billing`, `ecommerce`, and `task` remain planned but are not scaffolded yet.

Rule:

1. new API hosts and desktop runtimes should be added through framework composition instead of bypassing the documented app boundaries.
2. long term, hosts should become clearer composition roots instead of permanent ownership centers.

## Boundary Rules

1. Framework code must not depend on ecommerce, billing, CRM, or other app business rules.
2. Framework code should be reusable for new apps and future client-specific products.
3. Core code must stay reusable across apps.
4. App-specific business rules must not be added back into `apps/core`.
5. Billing code must stay independent from ecommerce behavior.
6. Connectors must depend on clear app or framework contracts, not hidden cross-imports.
7. UI primitives belong in `apps/ui`, not inside business apps unless they are app-specific.
8. Composition roots may wire dependencies, but feature modules should not self-bootstrap hidden runtime singletons.

## Authentication And Authorization

1. Authentication is framework-level.
2. Authorization is app-level on top of framework auth primitives.

## Current Extraction Status

Completed:

1. the root npm workspace and shared TypeScript configuration are in place.
2. the first framework browser bootstrap now lives under `apps/framework/src/main.tsx`.
3. framework auth, connector, mailbox, manifest, app-suite, and runtime folders now exist under `apps/framework/src`.
4. framework database configuration, ordered schema sections, and executable module-owned migration sections now exist under `apps/framework/src/runtime/database`.
5. the first framework HTTP contract foundation now exists under `apps/framework/src/runtime/http` with explicit internal, external, and public namespaces.
6. the shared root build layout now exists under `build/app` and `build/module`.
7. the CLI workspace now exists under `apps/cli` for githelper and release automation.
8. the shared UI and UX workspace now exists under `apps/ui` with reusable primitives, theme/provider wiring, and neutral presentation building blocks.
9. the shared UI layer now builds a redistribution-ready package artifact under `build/app/ui/package`.
10. lockstep versioning and reference-first release discipline are now documented across the repository.

Remaining:

1. add a backend composition root under the framework boundary.
2. formalize the DI/composition-root pattern for future hosts and standalone apps.
3. scaffold the desktop runtime path for offline SQLite-backed billing workflows.
4. create `apps/core`, `apps/billing`, `apps/ecommerce`, and other app roots in boundary-correct increments.
5. harden connector and plugin boundaries for Frappe, Zoho, Tally, and future integrations.
6. keep future database schema changes module-owned so billing, commerce, CRM, and connectors can evolve without one global migration dump.
7. mount the framework HTTP assemblies through a real backend composition root.
8. keep every new web app behind an explicit app shell so framework bootstrap remains thin while the product suite grows.
9. continue improving docs so the platform vision stays clear as real app code lands.
10. add CI/CD automation on top of the shared build layout and githelper policy.

## Target Shape

```text
apps/
  framework/
    src/
      app/
      auth/
      connectors/
      contracts/
      jobs/
      mailbox/
      runtime/
  core/
    api/
    desktop/
    domain/
    shared/
  ecommerce/
    api/
    web/
    domain/
  billing/
    api/
    web/
    desktop/
    core/
    connectors/
  crm/
    api/
    web/
    domain/
  site/
  cli/
    src/
  orekso/
    server/
  ui/
    src/
  docs/
    framework/
    ui/
  task/
    domain/
    legacy/
    web/
  frappe/
    domain/
  mcp/
    server/
```
