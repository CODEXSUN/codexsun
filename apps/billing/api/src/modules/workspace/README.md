# Billing Workspace Module

This module owns the Billing application workspace contract before Billing business modules are enabled.

The workspace reports the application foundation, enabled workspace provider, and authenticated actor roles. It does not own invoices, payments, customers, or other business records.

The module uses the shared Platform local identity contract. Identity data remains in Billing's private SQLite database at `storage/apps/billing/private/data/billing_db.sqlite`.

## Verification

Run the Billing API check, lint, tests, and build from the repository root. The provider test verifies the public module declaration, and the identity test verifies migration initialization, seeded login, authenticated actor resolution, and logout.
