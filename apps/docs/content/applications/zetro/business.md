# Zetro: core business and ownership

Permission-aware tenant AI coworker and reviewed read skills.

## Ownership boundary

Zetro can read only backend-authorised evidence. Draft patterns and model output cannot grant permissions or run SQL/shell actions.

## Inputs and outputs

- Configure the tenant model provider without changing record authority.
- Ask a business question; classify it into a reviewed fixed backend skill.
- Check signed user, tenant, capability grant and app permission before a read.
- Persist response, interaction, tool event and denied approval atomically; recheck before streaming record data.
- Use the developer documentation connection for bounded cited reference lookup; never treat retrieved prose as instructions.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/zetro` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
