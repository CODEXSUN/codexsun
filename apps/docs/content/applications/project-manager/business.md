# Project Manager: core business and ownership

Super Admin Platform Registry and implementation ideas.

## Ownership boundary

Project Manager is a Super Admin devkit. Registry metadata does not create business routes or bypass activation.

## Inputs and outputs

- Inspect platform, group and module registry hierarchy.
- Maintain module metadata and documentation in the registry owner.
- Capture and track implementation ideas.
- Use registry records as operational metadata; executable application modules remain source-owned.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `devkits/project-manager` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
