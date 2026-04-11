# Testing Strategy

This document outlines the current testing conventions for Codexsun.

## Global Structure

All automated tests currently live under the root `tests/` directory.

The structure mirrors the active repository boundaries:

```text
tests/
  api/
  apps/
  billing/
  cli/
  core/
  demo/
  e2e/
  ecommerce/
  framework/
  frappe/
  ui/
```

Current examples:

1. `tests/apps/workspace-structure.test.ts`
2. `tests/framework/application/app-suite.test.ts`
3. `tests/framework/runtime/config.test.ts`
4. `tests/framework/runtime/database.test.ts`
5. `tests/api/internal/routes.test.ts`
6. `tests/ecommerce/services.test.ts`
7. `tests/e2e/storefront-order-flow.spec.ts`

## Current Test Scope

Automated coverage is currently focused on structural, runtime, service, route, and end-to-end checks:

1. app suite registration
2. standardized app folder structure
3. environment loading
4. database driver switching
5. workspace and host baseline assembly
6. internal and external route registration
7. auth lifecycle, mailbox, and runtime-setting behavior
8. billing voucher, reporting, and period-close behavior
9. ecommerce storefront, checkout, order, and support behavior
10. demo installer behavior
11. Frappe connector contracts and boundary enforcement
12. shared UI utility behavior and Playwright end-to-end flows

## Running Tests

Run the current automated suite with:

```bash
npm run test
```

For repository-wide validation, use:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Current Reality

What exists now:

1. Node test runner based tests under `tests/**/*.test.ts`
2. Playwright end-to-end coverage under `tests/e2e/**/*.spec.ts`
3. foundation-level runtime checks
4. structural guardrails for the `apps/` model
5. focused service, route, and UI utility coverage across billing, core, ecommerce, demo, frappe, cli, and ui

What does not exist yet:

1. dedicated `.env.test` handling
2. Electron runtime tests
3. meaningful automated coverage for the still-reserved `task` and `tally` app boundaries
4. broad automated coverage for the new `crm` app baseline

## High-Risk Boundaries

When those modules are implemented, the first higher-rigor targets should be:

1. framework auth and permission boundaries
2. accounting, balancing, and reversal logic
3. stock-affecting workflows
4. ecommerce order and payment state transitions
5. connector retries, idempotency, and audit traces
