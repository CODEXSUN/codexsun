# Marketing: Campaigns

Marketing owns campaign identity and source attribution. The foundation stores objective, channel, and landing URL. Inactive duplication requires review before activation. No publication or email execution is enabled.

## Ownership and access

Platform resolves trusted tenant context and live grants. Each client uses its own database.
Public UUIDs do not grant access. Company and record scope still apply.
No documentation or frontend control grants permission.

## Source contracts

- `apps/marketing/api/src/modules/campaign/index.ts`
- `apps/marketing/web/src/modules/campaign/index.ts`
- Owned primary table: `marketing_campaigns`.

## Routes

- `/marketing/campaigns`
- `/marketing/campaigns/:uuid`
- `/marketing/campaigns/:uuid/activity`
- `/marketing/campaigns/:uuid/duplicate`
- `/marketing/campaigns/count`

## Verification and limits

This is local implementation evidence. Provider access, full authenticated desk acceptance, existing customer migrations, and deployment remain separate gates.
See the owner README and agent TASK for exact checks and unfinished acceptance.
