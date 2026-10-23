# Marketing: Brands

Tenant company brands, timezone, website, creator scope, revisions, and activity. Deactivation stops new capture and queued handoff.

## Ownership and access

Platform resolves trusted tenant context and live grants. Each client uses its own database.
Public UUIDs do not grant access. Company and record scope still apply.
No documentation or frontend control grants permission.

## Source contracts

- `apps/marketing/api/src/modules/brand/index.ts`
- `apps/marketing/web/src/modules/brand/index.ts`
- Owned primary table: `marketing_brands`.

## Routes

- `/marketing/brands`
- `/marketing/brands/:uuid`
- `/marketing/brands/:uuid/activity`
- `/marketing/brands/count`

## Verification and limits

This is local implementation evidence. Provider access, full authenticated desk acceptance, existing customer migrations, and deployment remain separate gates.
See the owner README and agent TASK for exact checks and unfinished acceptance.
