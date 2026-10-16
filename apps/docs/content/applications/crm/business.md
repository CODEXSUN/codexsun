# CRM: core business and ownership

Contact relationships, enquiries, assignment, work activity and estimates.

## Ownership boundary

Core owns shared contacts. CRM owns enquiry workflow and Contact 360 extensions; the selected source determines Local or Frappe writes.

## Inputs and outputs

- Configure Local or verified Frappe enquiry data source.
- Capture a contact/enquiry and verify phone matches and duplicate candidates.
- Assign/enrich the enquiry, record comments and start/stop work activity.
- Collect estimates and change enquiry status with record-scope access checks.
- Use Contact 360 and scoped lists/reports; review source limitations.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/crm` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
