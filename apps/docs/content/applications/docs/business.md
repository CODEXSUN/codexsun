# Docs: core business and ownership

Developer documentation authored in Git with tenant-owned metadata and Markdown overrides.

## Ownership boundary

Docs owns developer reference metadata, overrides and audit. Assist governance remains authoritative for coding rules; documentation does not grant runtime access.

## Inputs and outputs

- Review app business meaning, module contracts and workflows in repository Markdown/MDX.
- Generate/validate the catalog and provision the Docs migration and permission seeds.
- Browse app groups, modules, search, source, code blocks and table of contents in Docs.
- Apply a permitted tenant Markdown override with an expected revision; inspect its audit and restore repository content when needed.
- Zetro retrieves current authorised tenant reference excerpts; Zuno uses repository-only developer evidence.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/docs` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
