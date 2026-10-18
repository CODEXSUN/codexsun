# Enquiry WhatsApp history

This CRM leaf stores an audit history of WhatsApp handoffs initiated from an
Enquiry. It records the enquiry, normalized recipient, exact message, retry key,
authenticated actor, and UTC creation time. The browser opens WhatsApp only after
the API has saved the handoff. A row proves a handoff was prepared, not that the
provider delivered or the customer read the message.

The API owns persistence and validation. Reads and writes first resolve the
Enquiry through its existing tenant-scoped visibility and permission contract.
The recipient is derived from the saved Enquiry mobile number; callers cannot
override it. A unique actor/request key makes retrying a request idempotent and
rejects reuse with different content. The migration creates the history table
with a restrictive Enquiry foreign key and is registered by the CRM tenant
migration entry point.

The web tab displays message, recipient, author name, and time. Keep this leaf
focused on Enquiry WhatsApp history; do not add a provider-delivery claim or
cross-module messaging integration here. Use the component TASK, PLAN, and
SKILLS documents for changes and verification expectations.
