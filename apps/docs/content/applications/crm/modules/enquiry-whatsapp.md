# CRM: Enquiry WhatsApp

The Enquiry WhatsApp module stores an audit record when a user prepares a
WhatsApp message from an enquiry. Each row identifies the enquiry, recipient,
message, authenticated sender, and creation time. The saved phone number on the
enquiry determines the recipient.

The handoff history records what the CRM opened for the sender. It does not
confirm that WhatsApp delivered or that the customer read the message. A retry
key prevents duplicate rows for the same request and actor. Reusing a key with
different content is rejected.

The API checks the existing enquiry visibility and permissions before listing
or creating records. The migration adds a tenant-scoped table with a restrictive
foreign key, preserving existing enquiry data.
