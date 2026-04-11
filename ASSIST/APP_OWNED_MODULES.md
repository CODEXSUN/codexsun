# App Owned Modules

## Purpose

Reset ownership map for the current `apps/` suite. Keep this file short, boundary-focused, and aligned with `ASSIST/AI_RULES.md`.

Use this as the quick ownership lookup. If this file conflicts with `ASSIST/Documentation/ARCHITECTURE.md`, architecture wins and this file must be updated.

## Current State

- All framework-composed suite apps keep the standard `src`, `web`, `database`, `helper`, and `shared` shape.
- `apps/mobile` is a real companion client package and intentionally uses its Expo-native layout instead of the suite shape.
- Live database ownership is currently registered for `framework`, `cxapp`, `core`, `billing`, `ecommerce`, and `frappe`.
- `demo` is now a live admin/demo app with app-owned backend services and web workspace pages.
- `crm` is now a live suite app with app-owned backend services, internal routes, and web workspace pages.
- `api` is the transport layer for internal and public HTTP routes.
- `framework` is reusable runtime only.
- `cxapp` is the active suite application and uses `framework` as its runtime library.
- `core` holds shared masters and common reusable modules required by other apps.
- `ecommerce` is rebuilt as a live storefront app and consumes shared masters from `core`.

## Apps And Ownership

| App | Owned modules | Short behavior |
| --- | --- | --- |
| `framework` | `application`, `di`, `runtime/config`, `runtime/database`, `runtime/http`, `runtime/media`, `runtime/security`, `runtime/system-update`, `server` | Reusable runtime library. Starts hosts, wires apps, runs migrations and seeders, and provides shared platform primitives. |
| `cxapp` | `auth-service`, `auth-option-service`, `bootstrap-service`, `company-service`, `mailbox-service`, app settings, auth admin UI, suite shell pages | Main application shell. Owns the only login/session system, suite auth, bootstrap state, company identity, mailbox, suite settings, and shell-level administration. |
| `core` | `contact-service`, `product-service`, `common-module-service`, `common-modules/*`, shared master-data web sections | Shared business foundation. Owns reusable masters, products, contacts, and common modules needed across apps. |
| `api` | `internal/*`, `external/*`, `shared/request`, `shared/session`, `shared/http-responses` | Route-only boundary. Exposes HTTP surfaces and forwards requests to the owning app services. |
| `site` | site shell, landing content, public presentation pages | Presentation-only public website surface. |
| `ui` | `components/ui`, `components/blocks`, `registry/variants`, `registry/blocks`, `design-system`, `docs`, neutral dashboard/layout features | Shared design system and neutral UX building blocks. Must stay app-agnostic. |
| `billing` | categories, ledgers, voucher groups, voucher types, vouchers, reporting, compliance, billing workspace sections | Accounting and voucher domain. Owns finance-facing transactional modules and reports. |
| `ecommerce` | `catalog-service`, `customer-service`, `order-service`, `razorpay-service`, `storefront-settings-service`, `home-slider designer`, storefront pages, cart, checkout, tracking | Standalone commerce app. Reads shared product, contact, and product-master data from `core`, then owns storefront content, storefront settings, hero-slider design, customer accounts, cart, checkout, payments, orders, and customer portal behavior while consuming the shared `cxapp` auth session instead of minting its own login system. |
| `demo` | `demo-data-service`, demo installers, module install jobs, demo summary UI, demo workspace sections | Demo and showcase boundary. Owns demo-data installation, sample record generation, module-wise demo counts, and admin-facing preview/install flows for development and customer demos. |
| `task` | `app-manifest`, preview app shell | Reserved task/workflow boundary. Structure exists, but live modules are not implemented yet. |
| `crm` | `crm-repository`, leads, interactions, task-linked follow-ups, CRM workspace sections | CRM and sales-orchestration boundary. Owns lead capture, interaction logging, and task-linked follow-up orchestration. |
| `frappe` | settings, todos, items, purchase receipts, sync store, connector access, frappe workspace sections | ERPNext connector boundary. Owns connection settings, local snapshots, and controlled sync orchestration. |
| `tally` | `app-manifest`, preview app shell | Reserved Tally integration boundary. Structure exists, but live modules are not implemented yet. |
| `cli` | `github-helper`, `database-helper` | Operational tooling for release, repo support, migrate, seed, and database helper flows. |
| `mobile` | Expo app shell, device-native entry points, mobile helpers | Companion mobile client. Not part of the framework-composed app suite and does not use the standard `src/web/database/helper/shared` shape. |

## Boundary Rules

- Keep business logic out of `framework`.
- Keep suite auth, company, mailbox, bootstrap, and app settings inside `cxapp`.
- Keep `core` limited to shared masters and reusable common modules.
- Keep route files inside `api`, not inside business apps.
- Keep `ui` neutral; do not move app-specific business workflows into shared UI.
- Keep commerce-specific behavior, customer accounts, checkout, payments, and orders inside `ecommerce`.
- Keep demo-data generation and installer jobs inside `demo`; do not scatter demo seeding logic into unrelated apps.
- Keep CRM lead, interaction, and follow-up orchestration inside `crm`; do not move that workflow into `core` or `cxapp`.
- Keep the only browser login/session system in `cxapp`, even when the authenticated user lands in the ecommerce customer portal.
- Move any reusable master or shared cross-app contract discovered during commerce work into `core` or `core/common-modules`.

## Current Starting Point

- `ecommerce` now owns a live storefront stack from landing page to checkout and customer order views.
- `demo` now owns module-scoped demo installers and summary pages for installing and previewing sample business data.
- `crm` now owns live lead and interaction workspace flows inside the shared suite shell.
- ecommerce admin now reuses shared `core` product and product-master screens through ecommerce-owned routes, so shared masters stay in `core` while the commerce sidebar stays stable.
- shared server-state now routes through TanStack Query, while lightweight client state is kept in Zustand where needed for shell/session and storefront caching only.
- `cxapp`, `framework`, and `core` now have clearer ownership separation.
- admin, desk user, and customer landings now resolve from one shared auth session instead of separate desk and storefront login stores.
