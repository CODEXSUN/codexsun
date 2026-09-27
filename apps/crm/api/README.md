# CRM API

The API serves the CRM campaign-to-close workflow and is owned by `crm.foundation`.

## Purpose

Serve typed Zod routes for overview, campaigns, leads, customers, enquiries,
activities, and communications, plus a protected internal OpenAPI reference.

## Interfaces

- `GET /api/v1/crm/health` returns provider status.
- `GET /api/v1/crm/overview` returns counts and recent enquiries.
- Campaign, lead qualify/convert, customer, enquiry, and communication routes in `src/modules/foundation/routes/crm-routes.ts`.
- Platform Identity auth under `/api/v1/crm/auth/*`.
- Depends on `@codexsun/framework` and `@codexsun/platform-core`.

## Setup

Run from the repository root. Copy root `.env.example` and `api/.app.env.example`
to ignored local files before local runs.

## Verification

Run `npm.cmd run check --workspace=@codexsun/crm-api` and
`npm.cmd run test --workspace=@codexsun/crm-api` from the repository root.

## Configuration

Reads root `.env` and `api/.app.env`. Requires `CRM_API_PORT`,
`PLATFORM_HOST`, and `CRM_API_REFERENCE_TOKEN`.
