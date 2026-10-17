# TConnect working rules

Repository source: `apps/tconnect/agent/SKILLS.md`

Source SHA-256 (LF line endings): `a8177267ee9979340d668ce2e067797bee5162b13514dd429e78f129d5e2455d`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# TConnect working rules

Read the root Agent Guide, governance rules, this component README, TASK.md, and PLAN.md before changes.
Keep entity fields, schemas, seeds, persistence, routes, and UI in their owning modules.
Use Platform only for composition and trusted identity, tenant selection, activation, and permission checks.
Never trust browser-supplied tenant identifiers or publish private enquiry contact information.
Use eight-character lowercase hex UUIDs in public API references.
Keep sample businesses clearly fictional. Do not invent real association membership, certifications, or verification badges.
Keep membership validation, dependency blockers, publication filters, and transaction audit records aligned.
Use shared CODEXSUN workspace controls for authenticated forms and lists.
Keep generated assets, logs, caches, and runtime files under root dist.
Run focused checks and distinguish local runtime evidence from production deployment evidence.

## Member ownership

Registration must never accept a role ID, existing user ID, existing company ID, tenant database, or approved affiliation.
Use the injected Platform identity capability and the fixed restricted portal role.
Keep passwords out of TConnect tables, audit payloads, logs, and browser storage.
Resolve ownership from the signed Platform user UUID. Check active account status and live permissions on protected requests.
Filter every member company, product, and enquiry read. Recheck ownership on writes inside a transaction.
Do not let members assign association UUIDs. Approval and revocation must update the company affiliation consistently.
A tenant-wide permission does not remove the member ownership limit from a registered portal principal.
Run the two-account E2E suite when changing registration, permission policy, ownership, approval, or suspension.

## Buyer ownership

Use the fixed Platform buyer provisioning capability for buyer registration. Never accept buyer ownership,
email identity, role, or tenant database from authenticated enquiry payloads. Buyers must not read seller inboxes,
edit seller profiles or products, or approve association membership. Filter sent enquiries and requirements by
buyer UUID, not email. Validate product-to-seller and requirement-to-buyer relationships before inserting enquiries.
Preserve draft and closed requirement privacy on the seller board. Run buyer and member access E2E suites together.

## Private negotiations

Never accept a buyer, seller company, sender identity, computed total, or quotation state from create payloads.
Validate the thread participant for every quote and message read or write. Sellers must not see competing offers.
A buyer account can view only its received quotes and participant conversations. Staff access is not participant access.
Messages belong to Message. Thread persistence and parent activity updates belong to Conversation.
Use the public Conversation contract from Message and Quotation. Keep financial calculations and quote retention in Quotation.
Use integer minor units for stored quote calculations. Show unit, quantity, tax, shipping, validity, and payment terms in comparison.
Do not allow new quotes on closed sources. Retain history and support further participant messages.
Guest contact details do not establish a signed buyer identity. Do not claim guest enquiries by email.
Run the negotiation E2E suite with separate buyers and sellers, then run the existing account suites.

TConnect development starts through the shared preflight. Respect `CODEXSUN_DEV_PORT_POLICY`.
Do not stop an unrelated port owner. Include TConnect in Platform-style development header handling.
Verify both normal requests and a synthetic large cookie request when changing the launcher.

Public branding uses Tirupur Connect, while internal identifiers remain `tconnect`.
Do not infer exporter registration, certification, or independent verification from textile category matches.
Keep buyer and seller login links connected to the fixed Platform authentication entry points.
Illustrative photographs must not imply a pictured facility belongs to a listed company.

Use `test:e2e:tconnect-journey` for public mobile layout and browser account-to-enquiry checks.
Keep generated image prompts and illustrative-use notes with the public source assets.
Preserve natural image proportions and aligned card rows. Do not stretch contact-sheet subjects.
Keep enquiry dialog focus inside the dialog, support Escape, and restore the initiating control.

Keep network counts grounded in public records and disclose included demo data. Honor reduced-motion settings.
Do not convert standards reference panels or editorial company spotlights into unverified certification or sponsorship claims.

Preserve logo colors, proportions, clear space, and source provenance. Do not replace the ISO typographic reference with a certification seal.

Never infer certification or trust from an active profile, association affiliation, products, company name, or seller registration. Sample badges must each say Sample.
```
