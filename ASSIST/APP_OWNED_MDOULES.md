# App Owned Modules

## Purpose

Reset ownership map for the current `apps/` suite. Keep this file short, boundary-focused, and aligned with `ASSIST/AI_RULES.md`.

## Current State

- All 12 apps keep the standard `src`, `web`, `database`, `helper`, and `shared` shape.
- Live database ownership is currently registered for `framework`, `cxapp`, `core`, `billing`, `ecommerce`, and `frappe`.
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
| `ecommerce` | `catalog-service`, `customer-service`, `order-service`, `razorpay-service`, storefront pages, cart, checkout, tracking | Standalone commerce app. Reads shared product and contact masters from `core`, then owns storefront content, customer accounts, cart, checkout, payments, orders, and customer portal behavior while consuming the shared `cxapp` auth session instead of minting its own login system. |
| `task` | `app-manifest`, preview app shell | Reserved task/workflow boundary. Structure exists, but live modules are not implemented yet. |
| `frappe` | settings, todos, items, purchase receipts, sync store, connector access, frappe workspace sections | ERPNext connector boundary. Owns connection settings, local snapshots, and controlled sync orchestration. |
| `tally` | `app-manifest`, preview app shell | Reserved Tally integration boundary. Structure exists, but live modules are not implemented yet. |
| `cli` | `github-helper`, `database-helper` | Operational tooling for release, repo support, migrate, seed, and database helper flows. |

## Boundary Rules

- Keep business logic out of `framework`.
- Keep suite auth, company, mailbox, bootstrap, and app settings inside `cxapp`.
- Keep `core` limited to shared masters and reusable common modules.
- Keep route files inside `api`, not inside business apps.
- Keep `ui` neutral; do not move app-specific business workflows into shared UI.
- Keep commerce-specific behavior, customer accounts, checkout, payments, and orders inside `ecommerce`.
- Keep the only browser login/session system in `cxapp`, even when the authenticated user lands in the ecommerce customer portal.
- Move any reusable master or shared cross-app contract discovered during commerce work into `core` or `core/common-modules`.

## Current Starting Point

- `ecommerce` now owns a live storefront stack from landing page to checkout and customer order views.
- `cxapp`, `framework`, and `core` now have clearer ownership separation.
- admin, desk user, and customer landings now resolve from one shared auth session instead of separate desk and storefront login stores.
- Remaining optional refinement: move the last suite-facing frontend sections from `apps/core/web` into `apps/cxapp/web` if you want frontend ownership to be as strict as backend ownership.
