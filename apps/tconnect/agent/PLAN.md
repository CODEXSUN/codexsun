# TConnect plan

## Ownership

TConnect owns company profiles, association profiles, community posts, enquiries, and their tenant tables.
Platform owns tenant selection, active subscriptions, app activation, user sessions, and authorization context.
Public directory records belong to one selected portal tenant. Do not combine private records from different tenant databases.

## Delivery order

1. Install app contracts and tenant migrations.
2. Add deterministic demo records only when explicitly requested.
3. Build public discovery and branded detail pages.
4. Compose staff publishing and enquiry review inside the existing Platform shell.
5. Verify validation, denied access, tenant isolation, persistence, builds, and responsive page layout.

## Current limits

The first version supports one company per seller account and one association request per member.
Platform owns identity. TConnect stores an immutable user UUID to company UUID ownership mapping.
Association membership requires staff approval. Ownership checks apply to every company, product, and enquiry operation.
Member sign-in uses the existing Platform session. No independent TConnect session system exists.
Automatic message delivery, email verification, payment, private buyer record sharing, and cross-tenant search are not implemented.
Hard deletion is unavailable. Inactive records remain retained and disappear from the public directory.
Production deployment and native mobile packaging require separate verification.

## Buyer extension, 17-10-2026

Buyer identities map to a separate tenant buyer record. They do not inherit seller management rights.
Requirements and authenticated enquiries derive ownership from the signed Platform user UUID.
Writes recheck the active buyer mapping inside the transaction. Published product search requires both product
and company publication. Open requirements are visible to registered sellers without buyer contact details.
Buyer login has a fixed destination; user input cannot select a Platform role or arbitrary redirect.
Keep anonymous enquiry compatibility and existing migration checksums when extending these contracts.

## Quotation and communication ownership

Conversation owns participant threads and their source relationship. Message owns immutable text history.
Quotation owns seller offers, calculations, validity, withdrawal, and buyer comparison responses.
Platform composes fixed role grants and navigation. It does not own negotiation data or forms.

Keep source and participant validation on the server. Derive sender and seller identity from the signed account mapping.
Keep prices immutable and retain withdrawn offers. Close sources without erasing their conversation history.
Messages and quotations use parent public contracts for thread access and activity updates.
The new migration adds tables. It does not replace existing requirements, enquiries, identities, or previous ledger steps.

## Development startup

Use the shared TConnect preflight from both development commands. Keep the configured port authoritative.
Preserve Platform port ownership policy, graceful shutdown, API readiness, and development header-size handling.
Do not add a parallel launcher or silently move the public portal to a different port.

## Public editorial presentation

Use the Tirupur Connect name in the public site. Preserve internal TConnect contracts.
Keep category discovery in public presentation. Match existing published capabilities without inventing verification or exporter roles.
Use locally served illustrative images and identify sample organizations, events, and company profiles.
Approve policy details, business data, and production image rights before public deployment.

## Journey review and visual proportions

Keep account forms, search, private enquiries, quotations, and messaging connected to their existing owner contracts.
Run the browser journey for registration, sign-in, catalog, enquiry, and public mobile changes.
Run the negotiation browser option for quote forms, comparison, and private messages.
Use equal square category studies, matched row heights, readable copy, and original illustrative textile artwork.
Do not attach illustrative artwork to a real business as evidence of its products or facilities.

Network statistics must use public published records. Do not infer states, countries, transactions, or verification from city and industry fields.
Certification references remain educational until an owned certification record and approval workflow exist.

Use standard logos only as educational references with source records. Keep the ISO reference distinct from its restricted official logo.

Keep sample credential badges explicit at the badge level. Actual company credentials require server-owned evidence, approval, validity, and revocation before publication.
