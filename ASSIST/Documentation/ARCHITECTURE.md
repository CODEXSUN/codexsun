# Architecture

## Purpose

This file is the single source of truth for Codexsun platform architecture.

If another ASSIST file conflicts with this file, this file wins.

## Platform Goal

Codexsun is a reusable ERP and business software platform that should support:

1. billing-only products
2. commerce-led products
3. ERP-style combined suites
4. connector-led deployments
5. future desktop and offline clients

## App Roots

Current app roots under `apps/`:

1. `framework`
2. `cxapp`
3. `core`
4. `api`
5. `site`
6. `ui`
7. `billing`
8. `ecommerce`
9. `task`
10. `frappe`
11. `tally`
12. `cli`

## Standard App Shape

Every app must keep the same baseline shape:

```text
apps/<app>/
  src/
  web/
  database/
    migration/
    seeder/
  helper/
  shared/
```

Rules:

1. `src` is the backend and composition surface
2. `web` is the frontend surface
3. `database/migration` is for app-owned migration files or tracked placeholders
4. `database/seeder` is for app-owned seeders or tracked placeholders
5. `helper` is for app-local helper exports
6. `shared` is for app-local shared contracts and workspace metadata

## Ownership Model

### Framework

`apps/framework` owns:

1. DI and composition
2. environment config
3. database runtime and driver switching
4. HTTP host and route assembly
5. reusable platform contracts
6. app suite registration
7. machine-readable workspace and host baseline metadata

Framework must remain business-agnostic.

### CxApp

`apps/cxapp` is the main suite-facing application.

CxApp owns:

1. the active frontend entry app
2. the active server entry wrapper
3. the suite-facing shell and layouts
4. the routed auth pages and shell handoff
5. the operator-facing interface for composed apps

Framework remains underneath CxApp as the reusable runtime.

### Core

`apps/core` owns shared business foundations such as:

1. company
2. contacts
3. setup
4. reusable ERP-common contracts

### API

`apps/api` owns route definitions only.

Rules:

1. internal routes live under `apps/api/src/internal`
2. external routes live under `apps/api/src/external`
3. transport ownership stays here; domain logic does not

### Site

`apps/site` owns static and public presentation surfaces.

### UI

`apps/ui` owns the shared design system.

UI owns:

1. shared CSS and tokens
2. reusable primitives
3. reusable layout blocks
4. neutral UX building blocks
5. shared desk shell presentation
6. shared auth layout presentation
7. design-system docs presentation and catalog components

UI does not own app-specific business workflows.

### Billing

`apps/billing` owns accounting, inventory, vouchers, and reporting flows.

### Ecommerce

`apps/ecommerce` owns catalog, storefront, checkout, and customer commerce flows.

### Task

`apps/task` owns workspaces, tasks, and team workflow flows.

### Frappe

`apps/frappe` owns Frappe-specific integration contracts and connector logic.

### Tally

`apps/tally` owns Tally-specific integration contracts and connector logic.

### CLI

`apps/cli` owns operational commands, diagnostics, and release helpers when those helpers actually exist in the repository.

Current helper surface:

1. interactive GitHub commit and push helper: `npm run github`
2. built server-side GitHub helper: `npm run github:server`
3. database prepare command: `npm run db:prepare`
4. database migrate command: `npm run db:migrate`
5. database seed command: `npm run db:seed`

## Runtime Model

Current active runtime:

1. frontend entry: `apps/cxapp/web/src/main.tsx`
2. frontend shell: `apps/cxapp/web/src/app-shell.tsx`
3. server entry wrapper: `apps/cxapp/src/server/index.ts`
4. reusable host: `apps/framework/src/server/index.ts`
5. DI and suite composition: `apps/framework/src/di` and `apps/framework/src/application`
6. config runtime: `apps/framework/src/runtime/config`
7. database runtime: `apps/framework/src/runtime/database`
8. HTTP runtime: `apps/framework/src/runtime/http`

Current framework route surfaces:

1. health: `/health`
2. internal app registry: `/internal/apps`
3. internal workspace baseline: `/internal/baseline`
4. external app registry: `/api/apps`

## App Suite Model

Framework composes the suite through manifests.

Current registered suite surfaces:

1. framework
2. cxapp
3. core
4. api
5. ui
6. site
7. billing
8. ecommerce
9. task
10. frappe
11. tally
12. cli

Every manifest carries workspace metadata so framework and CxApp can inspect app roots without filesystem guessing.

## Database Model

Current database direction:

1. MariaDB is the primary live transactional database
2. SQLite is the offline and desktop option
3. PostgreSQL is reserved for optional analytics workloads

Rules:

1. framework owns the live runtime driver switching
2. framework owns migration and seeder execution, ledger tracking, and registry composition
3. each app owns its individual migration files under `database/migration` and individual seeder files under `database/seeder`
4. app database modules should be exposed through server-side entry points such as `apps/<app>/src/database-module.ts`
5. stock, accounting, tax, and audit-sensitive writes must stay explicit and traceable

## Build Model

Rules:

1. all build artifacts live under the shared root `build/`
2. app builds go to `build/app/<app>/<target>`
3. future module builds go to `build/module/<module>/<target>`

Current active outputs:

1. web build: `build/app/cxapp/web`
2. server build: `build/app/cxapp/server`

## Testing Model

Current automated tests live under the root `tests/` folder.

Active coverage today includes:

1. app suite registration
2. workspace structure normalization
3. runtime config loading
4. runtime database switching
5. workspace baseline assembly and route exposure

## Current State

Implemented now:

1. framework-first DI and runtime composition
2. active CxApp frontend and server wrappers
3. normalized app folder shape across all apps
4. manifest-level suite registration with workspace metadata
5. internal and external API route split
6. MariaDB / SQLite / PostgreSQL runtime switching
7. shared desk shell and grouped app navigation from `apps/ui`
8. shared auth layouts and auth page presentation through `apps/ui`
9. shared design-system docs and routeable component catalog in the `ui` app
10. app-owned `core` and `ecommerce` migrations and seeders executed through the framework runtime and CLI helper
11. `core` and `ecommerce` services reading seeded database tables instead of bypassing the database with in-memory seed arrays
12. root tests that validate suite registration, workspace structure, framework runtime behavior, and database process execution

Still future work:

1. real domain modules inside each standalone app
2. richer relational schemas and write flows beyond the current module-payload baseline
3. real connector execution flows
4. production auth, permissions, and audit flows
5. Electron desktop runtime

## Boundary Rules

1. framework must not own billing, commerce, or task business logic
2. core must stay shared and reusable
3. ui must stay shared and presentation-focused
4. api must stay route-focused
5. connectors must stay isolated in their app boundaries
6. CxApp may orchestrate apps, but it must not erase app ownership boundaries
