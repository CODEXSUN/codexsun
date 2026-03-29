# Testing Strategy

This document outlines the current testing conventions for Codexsun.

## Global Structure

All automated tests currently live under the root `tests/` directory.

The structure mirrors the active repository boundaries:

```text
tests/
  apps/
  api/
  framework/
```

Current examples:

1. `tests/apps/workspace-structure.test.ts`
2. `tests/framework/application/app-suite.test.ts`
3. `tests/framework/runtime/config.test.ts`
4. `tests/framework/runtime/database.test.ts`

## Current Test Scope

Automated coverage is currently focused on structural and runtime foundation checks:

1. app suite registration
2. standardized app folder structure
3. environment loading
4. database driver switching
5. workspace and host baseline assembly

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
2. foundation-level runtime checks
3. structural guardrails for the `apps/` model

What does not exist yet:

1. dedicated `.env.test` handling
2. Playwright or Cypress E2E suites
3. Electron runtime tests
4. app-level business workflow coverage for billing, ecommerce, or task

## High-Risk Boundaries

When those modules are implemented, the first higher-rigor targets should be:

1. framework auth and permission boundaries
2. accounting, balancing, and reversal logic
3. stock-affecting workflows
4. ecommerce order and payment state transitions
5. connector retries, idempotency, and audit traces
