# Mail: core business and ownership

Tenant/company mailboxes, compose, SMTP delivery and IMAP synchronisation.

## Ownership boundary

Mail owns settings, messages, attachments and events. Sending mail is a real external action and follows tenant policy.

## Inputs and outputs

- Configure company-scoped mail settings and verify the provider.
- Read mailbox state or compose a draft with permitted attachments.
- Queue delivery; inspect sent/failure state and retry safely.
- Synchronise incoming messages through module workers and preserve mail history.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/mail` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
