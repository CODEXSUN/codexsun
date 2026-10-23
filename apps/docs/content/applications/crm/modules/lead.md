# Crm: Leads

CRM owns canonical Leads received through its public Marketing intake contract. Source identity is company-scoped and duplicate-safe. Intake creates one assigned follow-up Task transactionally. Leads remain under review. No automatic Core identity merge, Enquiry creation, qualification, conversion, or Frappe export is enabled by this contract.

## Ownership and access

Platform resolves trusted tenant context and live grants. Each client uses its own database.
Public UUIDs do not grant access. Company and record scope still apply.
No documentation or frontend control grants permission.

## Source contracts

- `apps/crm/api/src/modules/lead/index.ts`
- `apps/crm/web/src/modules/lead/index.ts`
- Owned primary table: `crm_leads`.

## Routes

- `/crm/leads`
- `/crm/leads/:uuid`

## Verification and limits

This is local implementation evidence. Provider access, full authenticated desk acceptance, existing customer migrations, and deployment remain separate gates.
See the owner README and agent TASK for exact checks and unfinished acceptance.
