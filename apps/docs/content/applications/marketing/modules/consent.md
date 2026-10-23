# Marketing: Promotional consent

Marketing owns immutable promotional email grants and withdrawals. Eligibility consults current CRM restrictions and Mail safety through Platform composition. Enquiry privacy consent is not promotional permission.

## Ownership and access

Platform resolves the live tenant, module activation, saved company, and owner permissions.
Each client uses a separate database. Public UUIDs do not grant access.
Unavailable policy owners block eligibility. An assessment does not enqueue or send a campaign.

## Source contracts

- `apps/marketing/api/src/modules/consent/index.ts`
- Owned table: `marketing_consent_events`.
- `apps/marketing/web/src/modules/consent/index.ts`

## Routes

- `GET /marketing/consents`
- `GET /marketing/consents/count`
- `GET /marketing/consents/:uuid`
- `POST /marketing/consents`
- `POST /marketing/consents/eligibility`

## Verification and limits

The local two-database Marketing suite verifies tenant/company scope, revoked grants, immutable evidence, replay, withdrawals, expiry, and policy outages.
The browser fixture verifies persisted consent creation and a current eligibility check.
See the owner TASK for exact evidence. Live providers, campaign dispatch, and deployment remain separate gates.
