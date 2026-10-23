# Crm: Contact restrictions

CRM owns company-scoped email do-not-contact and release evidence. The policy also checks legacy Contact Preferences across all Core identities matching the recipient. It never grants promotional consent.

## Ownership and access

Platform resolves the live tenant, module activation, saved company, and owner permissions.
Each client uses a separate database. Public UUIDs do not grant access.
Unavailable policy owners block eligibility. An assessment does not enqueue or send a campaign.

## Source contracts

- `apps/crm/api/src/modules/contact-restriction/index.ts`
- Owned table: `crm_contact_restrictions`.

## Routes

- `POST /crm/contact-restrictions`

## Verification and limits

The local two-database Marketing suite verifies tenant/company scope, revoked grants, immutable evidence, replay, withdrawals, expiry, and policy outages.
The browser fixture verifies persisted consent creation and a current eligibility check.
See the owner TASK for exact evidence. Live providers, campaign dispatch, and deployment remain separate gates.
