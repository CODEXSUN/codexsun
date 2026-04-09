# Task

## Active Batch

### Reference

`#107`

### Title

`Repository-wide refactor task ordering from full project scan`

## Scope Rule

This file is the ordered refactor queue created after scanning the current repository source.

Planning only in this batch:

- [ ] no implementation started
- [ ] no file moved yet
- [ ] no behavior changed yet
- [ ] no new concept introduced without approval

## Scan Notes

Source scan basis:

1. scanned active source under `apps/`, `tests/`, and repo-level code files
2. excluded `node_modules`, `build`, `storage`, `test-results`, and `temp` from the main refactor queue
3. ordered targets by a mix of file size, mixed responsibility risk, app boundary importance, and likely refactor value

Protection rules for every future task:

- [ ] do not collapse the design system
- [ ] do not change current behavior unless separately approved
- [ ] do not change product nature or UX flow by accident
- [ ] do not create a new engine, abstraction, package, or concept until user approval
- [ ] keep work app-oriented and split into small jobs

## Phase 1. Billing Frontend Decomposition

Priority reason:

This is the largest active UI surface in the repo and the strongest candidate for controlled file-splitting without changing app ownership.

### 1.1

- [x] Refactor candidate: `apps/billing/web/src/workspace-sections.tsx`
- [x] Current size at planning start: `9223` lines
- [x] Goal: split workspace sections by billing module and section responsibility
- [x] Preserve: current billing UX flow, screen behavior, routing, and existing design-system usage
- [x] Status: entrypoint stabilized via `workspace-sections.tsx` re-export and section modules extracted under `apps/billing/web/src/workspace-sections/`
- [x] Validation: `npm.cmd run typecheck` and `npm.cmd run build`

### 1.2

- [x] Refactor candidate: `apps/billing/src/services/reporting-service.ts`
- [x] Current size: `2399` lines
- [x] Goal: split report generation, report mapping, filtering, calculations, and output shaping into app-owned modules
- [x] Preserve: reporting correctness and current report outputs
- [x] Status: behavior hardened first by normalizing legacy product payloads that were breaking `/internal/v1/billing/reports` with `Invalid request payload.`
- [x] Validation: `npx.cmd tsx --test tests/billing/reporting-service.test.ts`

### 1.3

- [ ] Refactor candidate: `apps/billing/src/services/voucher-service.ts`
- [ ] Current size: `1746` lines
- [ ] Goal: split voucher orchestration, posting rules, validation, and persistence coordination
- [ ] Preserve: voucher behavior, lifecycle rules, posting integrity, and existing contracts

### 1.4

- [ ] Refactor candidate: `apps/billing/shared/schemas/accounting.ts`
- [ ] Current size: `1539` lines
- [ ] Goal: split accounting schemas by bounded concept instead of one oversized schema surface
- [ ] Preserve: schema meaning, API contracts, and type compatibility

### 1.5

- [ ] Refactor candidate: `apps/billing/src/services/voucher-split-store.ts`
- [ ] Current size: `1078` lines
- [ ] Goal: isolate persistence helpers, query logic, and voucher storage responsibilities
- [ ] Preserve: current data behavior and storage semantics

### 1.6

- [ ] Refactor candidate: `apps/billing/src/data/billing-seed.ts`
- [ ] Current size: `920` lines
- [ ] Goal: split seed definitions by billing domain concern
- [ ] Preserve: seed content and install behavior

## Phase 2. Core Workspace and Masters Refactor

Priority reason:

`apps/core` owns shared business masters and has several large mixed-responsibility frontend and service files.

### 2.1

- [ ] Refactor candidate: `apps/core/web/src/workspace-sections.tsx`
- [ ] Current size: `4294` lines
- [ ] Goal: split workspace sections by feature area
- [ ] Preserve: current workspace navigation and page composition

### 2.2

- [ ] Refactor candidate: `apps/core/web/src/features/product/product-upsert-section.tsx`
- [ ] Current size: `1731` lines
- [ ] Goal: split form sections, validation display, and action logic into feature-local modules
- [ ] Preserve: current product form behavior and UX

### 2.3

- [ ] Refactor candidate: `apps/core/web/src/features/company/company-upsert-section.tsx`
- [ ] Current size: `957` lines
- [ ] Goal: split company form responsibilities into smaller feature files
- [ ] Preserve: current company form behavior

### 2.4

- [ ] Refactor candidate: `apps/core/src/services/product-service.ts`
- [ ] Current size: `874` lines
- [ ] Goal: separate business rules, repository coordination, and mapping logic
- [ ] Preserve: product service behavior and existing outputs

### 2.5

- [ ] Refactor candidate: `apps/core/web/src/features/product/product-form-state.ts`
- [ ] Current size: `740` lines
- [ ] Goal: isolate state transitions, form helpers, and normalization logic
- [ ] Preserve: state behavior and validation expectations

### 2.6

- [ ] Refactor candidate: `apps/core/web/src/features/contact/contact-upsert-section.tsx`
- [ ] Current size: `681` lines
- [ ] Goal: split contact form composition and interaction logic
- [ ] Preserve: current contact UX and data handling

## Phase 3. Ecommerce Domain and Web Refactor

Priority reason:

`apps/ecommerce` contains the largest backend service files and several large customer/admin pages with clear split opportunities.

### 3.1

- [ ] Refactor candidate: `apps/ecommerce/src/services/order-service.ts`
- [ ] Current size: `4230` lines
- [ ] Goal: split order lifecycle logic into smaller service modules and repository-facing units
- [ ] Preserve: order behavior, payment flow assumptions, status transitions, and current APIs

### 3.2

- [ ] Refactor candidate: `apps/ecommerce/web/src/pages/storefront-checkout-page.tsx`
- [ ] Current size: `2729` lines
- [ ] Goal: split checkout page into feature-local sections, hooks, and action handlers
- [ ] Preserve: current checkout UX, validation, and payment behavior

### 3.3

- [ ] Refactor candidate: `apps/ecommerce/web/src/features/storefront-admin/storefront-settings-section.tsx`
- [ ] Current size: `2424` lines
- [ ] Goal: split admin settings sections by concern
- [ ] Preserve: current admin settings flow and existing controls

### 3.4

- [ ] Refactor candidate: `apps/ecommerce/src/services/customer-service.ts`
- [ ] Current size: `2092` lines
- [ ] Goal: split customer workflows, repository logic, and mapping
- [ ] Preserve: current customer data behavior and contracts

### 3.5

- [ ] Refactor candidate: `apps/ecommerce/web/src/features/storefront-admin/storefront-customers-section.tsx`
- [ ] Current size: `1442` lines
- [ ] Goal: split customer admin UI into smaller app-owned sections
- [ ] Preserve: current filters, actions, and user flows

### 3.6

- [ ] Refactor candidate: `apps/ecommerce/shared/schemas/order.ts`
- [ ] Current size: `1222` lines
- [ ] Goal: separate order schemas by concept while preserving shared contract compatibility
- [ ] Preserve: schema contracts and consumer compatibility

### 3.7

- [ ] Refactor candidate: `apps/ecommerce/web/src/features/storefront-admin/storefront-payments-section.tsx`
- [ ] Current size: `1142` lines
- [ ] Goal: split payment settings, forms, and table views
- [ ] Preserve: current payment configuration behavior

### 3.8

- [ ] Refactor candidate: `apps/ecommerce/web/src/pages/storefront-account-page.tsx`
- [ ] Current size: `1141` lines
- [ ] Goal: split account page layout, customer sections, and side effects
- [ ] Preserve: current account experience

### 3.9

- [ ] Refactor candidate: `apps/ecommerce/src/data/storefront-seed.ts`
- [ ] Current size: `913` lines
- [ ] Goal: split seed data by catalog, content, and configuration concerns
- [ ] Preserve: current seed output

### 3.10

- [ ] Refactor candidate: `apps/ecommerce/web/src/workspace-sections.tsx`
- [ ] Current size: `900` lines
- [ ] Goal: split workspace composition by ecommerce module
- [ ] Preserve: current workspace structure and behavior

### 3.11

- [ ] Refactor candidate: `apps/ecommerce/src/services/storefront-settings-service.ts`
- [ ] Current size: `882` lines
- [ ] Goal: separate settings orchestration, validation, and persistence
- [ ] Preserve: settings behavior and stored outputs

### 3.12

- [ ] Refactor candidate: `apps/ecommerce/src/services/catalog-service.ts`
- [ ] Current size: `780` lines
- [ ] Goal: split catalog orchestration and catalog read/write concerns
- [ ] Preserve: current catalog behavior

### 3.13

- [ ] Refactor candidate: `apps/ecommerce/web/src/api/storefront-api.ts`
- [ ] Current size: `778` lines
- [ ] Goal: split API client methods by storefront domain area
- [ ] Preserve: request contracts and response handling

### 3.14

- [ ] Refactor candidate: `apps/ecommerce/shared/schemas/catalog.ts`
- [ ] Current size: `766` lines
- [ ] Goal: split catalog schemas into smaller concept files
- [ ] Preserve: schema compatibility

### 3.15

- [ ] Refactor candidate: `apps/ecommerce/web/src/components/storefront-top-menu.tsx`
- [ ] Current size: `749` lines
- [ ] Goal: split menu rendering, data shaping, and mobile/desktop view logic
- [ ] Preserve: current storefront navigation behavior

## Phase 4. CXAPP Auth and Shell Refactor

Priority reason:

`apps/cxapp` is the active suite shell. These files are central and need careful, small-scope decomposition.

### 4.1

- [ ] Refactor candidate: `apps/cxapp/web/src/app-shell.tsx`
- [ ] Current size: `1855` lines
- [ ] Goal: split shell composition, routing surfaces, auth wiring, and workspace layout responsibilities
- [ ] Preserve: current shell behavior and auth/session flow

### 4.2

- [ ] Refactor candidate: `apps/cxapp/src/services/auth-service.ts`
- [ ] Current size: `1350` lines
- [ ] Goal: split auth workflow orchestration, validation, token/session coordination, and app-owned business rules
- [ ] Preserve: current auth behavior, session system, and ownership rules

### 4.3

- [ ] Refactor candidate: `apps/cxapp/web/src/desk/desk-registry.ts`
- [ ] Current size: `1334` lines
- [ ] Goal: split registry declarations by desk/workspace area
- [ ] Preserve: current workspace registration behavior

### 4.4

- [ ] Refactor candidate: `apps/cxapp/src/data/auth-seed.ts`
- [ ] Current size: `1124` lines
- [ ] Goal: split auth seed data by concept and install phase
- [ ] Preserve: current bootstrap/auth seed behavior

### 4.5

- [ ] Refactor candidate: `apps/cxapp/web/src/features/framework-media/media-browser.tsx`
- [ ] Current size: `1014` lines
- [ ] Goal: split browser layout, actions, and state handling
- [ ] Preserve: current media browser UX

### 4.6

- [ ] Refactor candidate: `apps/cxapp/src/repositories/auth-repository.ts`
- [ ] Current size: `834` lines
- [ ] Goal: isolate persistence operations and query helpers
- [ ] Preserve: repository outputs and auth storage behavior

## Phase 5. UI and Design-System Safety Refactor

Priority reason:

These are high-value shared UI files. Refactor only after app-level pilot patterns are proven. Preserve defaults, aliases, variants, and reusable blocks.

### 5.1

- [ ] Refactor candidate: `apps/ui/src/registry/data/catalog.tsx`
- [ ] Current size: `2903` lines
- [ ] Goal: split registry catalog data without changing registry meaning
- [ ] Preserve: current registry keys, component identity, and documentation output

### 5.2

- [ ] Refactor candidate: `apps/ui/src/components/blocks/inline-editable-table.tsx`
- [ ] Current size: `1315` lines
- [ ] Goal: split table core, cell editing logic, toolbar behavior, and helpers
- [ ] Preserve: current table behavior and block API

### 5.3

- [ ] Refactor candidate: `apps/ui/src/design-system/pages/design-system-workbench-page.tsx`
- [ ] Current size: `889` lines
- [ ] Goal: split page composition and view-specific helpers
- [ ] Preserve: current design-system docs behavior

### 5.4

- [ ] Refactor candidate: `apps/ui/src/components/blocks/master-list.tsx`
- [ ] Current size: `691` lines
- [ ] Goal: split list composition, item rendering, and action logic
- [ ] Preserve: current block behavior and props

### 5.5

- [ ] Refactor candidate: `apps/ui/src/registry/data/component-variants.ts`
- [ ] Current size: `660` lines
- [ ] Goal: split component variant metadata by domain while keeping the canonical model intact
- [ ] Preserve: project defaults and component governance expectations

### 5.6

- [ ] Refactor candidate: `apps/ui/src/features/dashboard/components/navigation/app-sidebar.tsx`
- [ ] Current size: `564` lines
- [ ] Goal: split navigation sections and sidebar state helpers
- [ ] Preserve: current shared navigation behavior

## Phase 6. API and Framework Boundary Refactor

Priority reason:

These files affect cross-app routing and runtime composition. Refactor late and in very small batches.

### 6.1

- [ ] Refactor candidate: `apps/api/src/internal/ecommerce-routes.ts`
- [ ] Current size: `881` lines
- [ ] Goal: split route registration by ecommerce domain area
- [ ] Preserve: current internal route contracts

### 6.2

- [ ] Refactor candidate: `apps/api/src/internal/billing-routes.ts`
- [ ] Current size: `639` lines
- [ ] Goal: split billing route wiring by feature group
- [ ] Preserve: current billing route contracts

### 6.3

- [ ] Refactor candidate: `apps/framework/shared/runtime-settings.ts`
- [ ] Current size: `1058` lines
- [ ] Goal: split runtime setting definitions, parsing, and normalization
- [ ] Preserve: current config keys and runtime behavior

### 6.4

- [ ] Refactor candidate: `apps/framework/src/server/index.ts`
- [ ] Current size: `698` lines
- [ ] Goal: split server composition, startup wiring, and host assembly
- [ ] Preserve: current framework composition behavior

### 6.5

- [ ] Refactor candidate: `apps/framework/src/runtime/config/server-config.ts`
- [ ] Current size: `595` lines
- [ ] Goal: isolate config shaping and environment resolution
- [ ] Preserve: current runtime config behavior

## Phase 7. Demo and Frappe Cleanup

Priority reason:

These are medium-size files with value, but they are lower priority than billing, core, ecommerce, cxapp, ui, and framework.

### 7.1

- [ ] Refactor candidate: `apps/demo/src/services/demo-data-service.ts`
- [ ] Current size: `744` lines
- [ ] Goal: split demo orchestration and seed generation helpers
- [ ] Preserve: current demo installation behavior

### 7.2

- [ ] Refactor candidate: `apps/demo/src/data/demo-seed.ts`
- [ ] Current size: `620` lines
- [ ] Goal: split demo seed data by domain section
- [ ] Preserve: current demo seed behavior

### 7.3

- [ ] Refactor candidate: `apps/demo/web/src/workspace-sections.tsx`
- [ ] Current size: `616` lines
- [ ] Goal: split workspace sections by demo area
- [ ] Preserve: current demo workspace behavior

### 7.4

- [ ] Refactor candidate: `apps/frappe/shared/schemas/frappe.ts`
- [ ] Current size: `726` lines
- [ ] Goal: split frappe schemas by connector concept
- [ ] Preserve: shared contract compatibility

## Phase 8. Test Alignment After Each Source Batch

Rule:

Do not run one huge test rewrite. Align tests with each source refactor immediately after the related source batch.

### 8.1

- [ ] Align billing tests after each billing batch
- [ ] Targets: `tests/billing/*.test.ts`

### 8.2

- [ ] Align ecommerce tests after each ecommerce batch
- [ ] Targets: `tests/ecommerce/*.test.ts`

### 8.3

- [ ] Align core tests after each core batch
- [ ] Targets: `tests/core/*.test.ts`

### 8.4

- [ ] Align api tests after api route refactors
- [ ] Targets: `tests/api/**/*.test.ts`

### 8.5

- [ ] Align framework tests after framework/runtime refactors
- [ ] Targets: `tests/framework/**/*.test.ts`

## Phase 9. Explicit Hold Zone

These areas stay out of the active queue unless you approve them separately.

### 9.1

- [ ] `temp/**` stays excluded from the main refactor program

### 9.2

- [ ] do not introduce new shared packages

### 9.3

- [ ] do not create new repo-wide architectural concepts

### 9.4

- [ ] do not redesign the design system

### 9.5

- [ ] do not change auth ownership boundaries already defined in `ASSIST/AI_RULES.md`

## Suggested First Execution Order

Use this order for actual refactor work after approval:

1. Phase 1.1
2. Phase 1.2
3. Phase 1.3
4. Phase 2.1
5. Phase 3.1
6. Phase 4.1
7. Phase 5.1
8. Phase 6.1

## Completion Review

- [ ] tasks are ordered by priority and impact
- [ ] tasks are broken into phases
- [ ] tasks use numbering
- [ ] tasks use checkboxes for confirmation
- [ ] tasks stay app-oriented
- [ ] tasks stay small enough for controlled execution
- [ ] design system protection is explicit
- [ ] behavior protection is explicit
- [ ] new concept creation is blocked until approval
