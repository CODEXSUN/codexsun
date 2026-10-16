# Platform: core business and ownership

Tenant identity, access, application activation and operations.

## Ownership boundary

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

## Inputs and outputs

- Super Admin registers a tenant and its database/verified domains.
- Configure plans and effective app entitlements, provision enabled app schemas and seed access.
- A tenant user signs in with Corporate ID; server session selects the tenant database.
- Tenant roles/permissions and live module settings guard each API request.
- Queue Manager, audit, backup and registry desks supervise runtime operations.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/platform` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
