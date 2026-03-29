# Testing Strategy

This document outlines the testing conventions and requirements for the Codexsun ERP platform, especially given the "high-risk" nature of financial boundaries like billing and eCommerce.

## Global Structure

All tests (Unit, Integration, and End-to-End) reside in the `Test/` directory located at the root of the repository. The folder structure strictly mirrors the `apps/` bounded context layout to maintain clear separation of concerns.

```text
Test/
├── .env.test             # Dedicated testing environment variables isolated from prod/dev
├── framework/            # E2E & unit tests for core runtime, DB, config
├── core/                 # E2E & unit tests for shared business masters
├── ecommerce/            # E2E tests for product pipelines, checkout, profile
├── billing/              # E2E tests for accounting, tax, vouchers
├── task/                 # E2E tests for workflow and task management
├── desktop/              # E2E tests for Electron Shell/IPC and main window
└── ...
```

## Environment Configuration

E2E testing is strictly tied to a `.env.test` file to ensure tests do not pollute production or local development databases. 

1. Tests must read from `.env.test`.
2. Provide fallback mocks if external variables are missing.
3. The DB string in `.env.test` MUST target a safe sandbox/test database.

## Running Tests

We use unified command interfaces to trigger E2E tests for modules.

### Run tests globally
To execute the entire suite across all applications:
```bash
npm run test:e2e
```

### Run module-specific tests
To run an E2E test suite for a specific boundary:
```bash
npm run test:e2e -- --project=ecommerce
npm run test:e2e -- --project=billing
npm run test:e2e -- --project=framework
npm run test:e2e -- --project=desktop
```

*Note: For E2E frameworks like Playwright or Cypress, ensure your test database is seeded properly using `npm run test:seed` before running.*

## High-Risk Boundaries

In modules like `billing`, `ecommerce`, and `auth` (within `framework`):
1. **Mock External Calls**: Avoid executing real merchant APIs or Stripe payments. Use sandbox mode and mock external adapters.
2. **Reversibility Tests**: Run explicit E2E tests enforcing audit-trail completeness for financial writes. Every voucher creation must be verified alongside its corresponding reversal/cancellation rule.
