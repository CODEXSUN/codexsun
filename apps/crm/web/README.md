# CRM Web

The web host composes the shared MDI workspace for the CRM campaign-to-close flow.

## Purpose

Provide Overview, Campaigns, Leads, Customers, and Enquiries workspaces first.
Estimates, Quotations, Work, Collections, Verification, Quality, AI Assistant,
HR Duty, and Reports remain shell pages until their task phases land.

## Interfaces

- `src/app.tsx` owns navigation and data fetching via `@codexsun/ui` and React Query.
- Depends on `@codexsun/ui` and the CRM API.

## Verification

Run `npm.cmd run check --workspace=@codexsun/crm-web` from the repository root.
