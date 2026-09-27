# Billing API

The API exposes typed Zod routes and a protected internal OpenAPI reference.

## Foundation routes

- `GET /api/v1/billing/health` is public and reports enabled providers.
- `GET /api/v1/billing/workspace` requires Billing identity authentication and reports the prepared workspace and actor roles.
- `/api/v1/billing/auth/*` provides shared local identity login, logout, development login, password reset, and identity management routes.

The API initializes identity migrations at startup. Use `npm.cmd run build:deployment --workspace @codexsun/billing-api` to also produce the standalone identity preparation entrypoint for a selected deployment.
