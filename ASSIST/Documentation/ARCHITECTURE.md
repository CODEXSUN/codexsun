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
9. `demo`
10. `task`
11. `frappe`
12. `tally`
13. `cli`

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
8. reusable auth/runtime primitives such as hashing, JWT signing, SMTP transport, and request parsing

Framework must remain business-agnostic.

### CxApp

`apps/cxapp` is the main suite-facing application.

CxApp owns:

1. the active frontend entry app
2. the active server entry wrapper
3. the suite-facing shell and layouts
4. the routed auth pages and shell handoff
5. the operator-facing interface for composed apps
6. browser-side auth session persistence for the active suite shell
7. app-owned auth, sessions, roles, permissions, mailbox, bootstrap, company profile, and runtime app settings for the active suite shell

Framework remains underneath CxApp as the reusable runtime.

### Core

`apps/core` owns shared business foundations such as:

1. contacts
2. products
3. shared common modules and master data
4. reusable ERP-common contracts for shared master records

Inventory authority rule:

1. `apps/core` is the current authoritative source for sellable storefront stock
2. `apps/ecommerce` must read storefront availability from `core` stock rows and reserved quantities
3. `apps/frappe` may project ERPNext stock into `core`, but storefront runtime and checkout must not depend on live ERP responses
4. sellable quantity is `sum(active stock quantity - reservedQuantity)` and must never drop below zero in storefront reads
5. low-stock state begins at sellable quantity `1` to `5`; sellable quantity `0` is out of stock
6. cart and PDP quantities are advisory only until checkout confirms stock again; `payment_pending` does not yet create a new reservation hold

### API

`apps/api` owns route definitions only.

Rules:

1. internal routes live under `apps/api/src/internal`
2. external routes live under `apps/api/src/external`
3. transport ownership stays here; domain logic does not
4. auth routes follow the same split: public login and recovery flows stay external, admin and operator auth management stays internal

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

`apps/ecommerce` is the standalone commerce boundary.

Ecommerce owns:

1. catalog
2. storefront
3. checkout
4. customer commerce flows
5. payments and order tracking
6. customer accounts, profile, portal pages, and order history linked to the shared `cxapp` auth session

### Task

`apps/task` owns workspaces, tasks, and team workflow flows.

### Demo

`apps/demo` owns demo-data installation, sample business data generation, demo workspace summaries, and preview administration for sales/demo environments.

### Frappe

`apps/frappe` owns ERPNext-specific settings, snapshot storage, connector contracts, and sync orchestration.

ERPNext stock integration rule:

1. `apps/frappe` remains a connector and sync boundary, not the direct runtime stock authority for storefront requests
2. future ERPNext stock flow must follow `frappe -> core -> ecommerce`

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
5. external auth surface: `/api/v1/auth/*`
6. protected cxapp auth and mailbox surfaces: `/internal/v1/cxapp/auth/*` and `/internal/v1/cxapp/mailbox/*`
7. protected cxapp setup and company surfaces: `/internal/v1/cxapp/bootstrap`, `/internal/v1/cxapp/company*`, and `/internal/v1/cxapp/runtime-settings`
8. public storefront surfaces: `/public/v1/storefront/*`
9. external storefront customer and checkout surfaces: `/api/v1/storefront/*`

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
10. demo
11. frappe
12. tally
13. cli

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
6. database execution workflow for app-owned migrations and seeders
7. auth lifecycle flows such as seeded login, OTP registration, password reset, recovery, and session revocation
8. Frappe connector flows such as settings save, item sync, purchase receipt sync, and route registration
9. ecommerce storefront flows such as catalog reads from `core`, customer registration, checkout, payment verification, portal orders, order tracking, and role-based auth landing
10. demo-data install routes, installers, and workspace summary flows

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
10. app-owned `cxapp`, `core`, `billing`, `ecommerce`, and `frappe` migrations and seeders executed through the framework runtime and CLI helper
11. `cxapp`, `core`, `billing`, `ecommerce`, and `frappe` services reading seeded database tables instead of bypassing the database with in-memory seed arrays
12. app-owned `cxapp` auth, session, OTP, role, permission, mailbox, bootstrap, company, and app-settings storage with external and internal API surfaces
13. active `cxapp` auth pages using the live auth API and persisted browser sessions instead of placeholder-only local state
14. app-owned `frappe` connector settings, todo snapshots, item snapshots, purchase receipt snapshots, internal routes, and desk workspace sections
15. one `cxapp` login session that routes admins to `/admin/dashboard`, desk users to `/dashboard`, and customers to `/profile`
16. app-owned `ecommerce` storefront settings, dedicated home-slider designer, storefront admin editing, catalog reads from `core` products and shared product masters, customer registration linked to `core` contacts, customer accounts linked to `cxapp` auth users, orders, checkout, Razorpay-ready payments, public tracking, and customer portal pages
17. app-owned `demo` install profiles, module-specific demo data installers, progress tracking, and demo workspace counts for customer, supplier, product, category, and order data seeding
18. TanStack Query as the shared server-state layer for runtime settings, storefront shell data, and demo installer polling, with Zustand used only for lightweight session and storefront shell client state
19. shared storefront editor and docs surfaces in `apps/ui` such as reusable search, featured-card, category-card, rich-text editor, and toast blocks that are consumed by both the storefront and design-system docs
20. root tests that validate suite registration, workspace structure, framework runtime behavior, database process execution, auth lifecycle behavior, ecommerce service flows, demo installer flows, and Frappe connector behavior

Still future work:

1. real domain modules inside each standalone app
2. richer relational schemas and write flows beyond the current module-payload baseline
3. richer connector execution flows such as webhooks, job queues, and deeper bidirectional reconciliation
4. auth hardening such as refresh-token rotation, MFA, rate limiting, richer admin UX, and deeper audit flows
5. promotions, couponing, inventory reservation, shipment carriers, and post-order commerce workflows inside `apps/ecommerce`
6. Electron desktop runtime

## Boundary Rules

1. framework must not own billing, commerce, or task business logic
2. core must stay shared and reusable
3. ui must stay shared and presentation-focused
4. api must stay route-focused
5. connectors must stay isolated in their app boundaries
6. CxApp may orchestrate apps, but it must not erase app ownership boundaries
7. framework may host reusable auth primitives, but auth domain rules, tables, mailbox records, bootstrap state, and company records stay app-owned in `cxapp`
8. `ecommerce` must not create a second browser auth store or JWT/session system; customer portal access must resolve through the shared `cxapp` auth session
