# Platform: workflow

## Supported sequence

1. Super Admin registers a tenant and its database/verified domains.
2. Configure plans and effective app entitlements, provision enabled app schemas and seed access.
3. A tenant user signs in with Corporate ID; server session selects the tenant database.
4. Tenant roles/permissions and live module settings guard each API request.
5. Queue Manager, audit, backup and registry desks supervise runtime operations.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
