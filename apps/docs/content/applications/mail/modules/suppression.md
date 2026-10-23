# Mail: Delivery safety

Mail owns company-scoped hard-bounce, complaint, and delivery-policy suppression evidence. Marketing cannot clear these blocks by recording a new grant. Provider feedback and suppression release remain future work.

## Ownership and access

Platform resolves the live tenant, module activation, saved company, and owner permissions.
Each client uses a separate database. Public UUIDs do not grant access.
Unavailable policy owners block eligibility. An assessment does not enqueue or send a campaign.

## Source contracts

- `apps/mail/api/src/modules/suppression/index.ts`
- Owned table: `mail_suppressions`.

## Routes

- `POST /mail/suppressions`

## Verification and limits

The local two-database Marketing suite verifies tenant/company scope, revoked grants, immutable evidence, replay, withdrawals, expiry, and policy outages.
The browser fixture verifies persisted consent creation and a current eligibility check.
See the owner TASK for exact evidence. Live providers, campaign dispatch, and deployment remain separate gates.
