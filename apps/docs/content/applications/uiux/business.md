# UIUX: core business and ownership

Shared component/design-system gallery and developer specimens.

## Ownership boundary

UIUX is a development gallery, not a tenant-record database or CRUD engine.

## Inputs and outputs

- Browse component index and shared layout/workspace patterns.
- Choose the existing primitive matching the interaction.
- Inspect accessibility/state examples and compose them in the owning app.
- Keep business fields and validation outside the UI package.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `devkits/uiux` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
