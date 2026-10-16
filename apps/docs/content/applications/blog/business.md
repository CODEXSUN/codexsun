# Blog: core business and ownership

External Blog package integration and tenant publishing.

## Ownership boundary

Blog is maintained as an external package. This checkout documents integration boundaries, not private package implementation.

## Inputs and outputs

- Enable Blog and provision the external package through its public migration/host contract.
- Open the composed article/editor workspace.
- Maintain permitted articles/authors/media and review publishing/SEO/discussion capabilities from the installed package.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `external:@codexsun/blog` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
