# Marketing: Connections

Tenant setup records remain separate from provider authorization. Google supports YouTube channel discovery only. PKCE and session-bound state protect authorization. Grants stay encrypted in the tenant database. Other provider adapters and live account validation remain open.

## Ownership and access

Platform resolves trusted tenant context and live grants. Each client uses its own database.
Public UUIDs do not grant access. Company and record scope still apply.
No documentation or frontend control grants permission.

## Source contracts

- `apps/marketing/api/src/modules/connection/index.ts`
- `apps/marketing/web/src/modules/connection/index.ts`
- Owned primary table: `marketing_connections`.

## Routes

- `/marketing/connections`
- `/marketing/connections/:uuid`
- `/marketing/connections/:uuid/activity`
- `/marketing/connections/:uuid/disconnect`
- `/marketing/connections/:uuid/health`
- `/marketing/connections/:uuid/oauth/begin`
- `/marketing/connections/:uuid/oauth/complete`
- `/marketing/connections/:uuid/oauth/select`
- `/marketing/connections/count`

## Verification and limits

This is local implementation evidence. Provider access, full authenticated desk acceptance, existing customer migrations, and deployment remain separate gates.
See the owner README and agent TASK for exact checks and unfinished acceptance.
