# Digital Marketing Application Plan

## Baseline and delivery constraints

Date: 2026-10-23. Status: documentation only. Implementation is not authorized by this planning task.
Build one shared tenant application with one business database per client.
Keep TikTok outside scope. Reserve all-client management for a separate future Super Admin application.

Current CRM documents cover local enquiries, tasks, contacts, and schedules.
Dedicated Lead and Campaign work remains planned in the CRM task list.
The CRM WhatsApp history records a manual handoff. It does not prove provider delivery or customer readership.
Mail currently declares SMTP transport. This does not establish readiness for bulk marketing email.
Existing source and documentation do not prove production readiness or live provider access.

## Product journey

Campaign -> channel content or advertisement -> form or permitted conversation -> raw submission -> CRM Lead -> qualification -> Sales Enquiry -> outcome.

Marketing owns acquisition and approved nurturing. CRM owns sales qualification and human follow-up.
One contact may have many submissions and sales pursuits. Preserve each source without creating duplicate customer identities.

## Tenant application contract

### Shared dashboard, separate client databases

- Serve the same routes, screens, and code to every entitled tenant.
- Select the tenant database from the authenticated server context and verified Platform registry.
- Store Marketing business tables in that tenant database. Do not add redundant tenant columns to isolated business tables.
- Carry trusted tenant identity in shared queue envelopes, routing records, storage namespaces, and external callback mappings.
- Never accept a browser-selected database, tenant folder, callback tenant, or external account as proof of ownership.
- Keep company and brand scope inside the tenant. Verify company and brand access on each record operation.
- Support configured branding and permitted defaults without tenant-specific code forks or weakened backend validation.
- Hide unavailable features with an explanation. Never show seeded metrics or pretend an account is connected.

Shared hosts require the existing Corporate ID login contract.
Verified custom hosts resolve their mapped tenant through Platform.
Unknown hosts and missing, suspended, inactive, or unready tenant mappings must fail closed.
Use the existing session contract. Do not introduce a Marketing-specific authentication mechanism.

### Isolation across every access path

Check tenant and record access for lists, direct links, searches, reports, media, exports, previews, and live updates.
Partition browser query caches by authenticated tenant and company context. Clear sensitive state when the principal changes.
Scope server caches, locks, rate limits, idempotency keys, and storage paths by the trusted tenant context.
Do not expose provider tokens, email credentials, raw database names, or another tenant's account labels.

Jobs must carry a tenant registry identity and a Marketing record reference, not a caller-selected database connection.
Workers must resolve the current tenant mapping, activation, connection, permission policy, and consent before external actions.
Suspension, revoked credentials, disabled Marketing access, and changed approval must stop pending external work.
Apply this check between batches, not only when a campaign starts.

### OAuth and connector routing

1. An authorized tenant user starts Connect for a selected company and brand.
2. The server records short-lived, single-use state bound to tenant, session, actor, provider, and return destination.
3. Use PKCE where supported and fixed callback allowlists. Reject reused, expired, mismatched, or tampered state.
4. Validate provider identity and retrieve only accounts the authorized user can manage.
5. Show the account identifier, account type, capabilities, and destination brand before binding.
6. Save encrypted tenant credentials, scopes, token expiry, connection version, and audit evidence.
7. Test the selected capability with a safe read or explicitly approved provider test.

Do not collect social passwords, provider session cookies, or browser-readable long-lived tokens.
Shared developer application secrets belong in protected deployment configuration.
Tenant grants and refresh tokens belong in encrypted tenant-owned storage.
Use versioned encryption keys and a documented rotation and revocation procedure.

Default policy: one external account belongs to one tenant connection.
An attempt to bind the same account to another tenant requires a future explicit ownership-transfer workflow.
Do not reveal the existing tenant during a collision response.
A minimal server-only routing registry may map provider subscriptions and account IDs to tenant registry identities.
Platform owns that routing infrastructure. It must not hold Marketing content, recipient lists, or tenant tokens.
Store enough subscription identity to reject stale callbacks after reconnect, transfer, or disconnect.

### Webhooks, files, and public forms

Verify each provider's supported signature, secret, challenge, or authentication mechanism.
Resolve callbacks through trusted connection mappings. Do not trust a tenant field in the payload or query string.
Persist accepted events durably before acknowledgment. Process asynchronously with tenant-scoped duplicate detection.
Handle out-of-order delivery, replay, event version changes, missing records, and provider backfill where available.
Reject unresolved or ambiguous routing. Keep quarantined metadata restricted and redact message content and credentials.

Public forms use verified Sites host and publication mappings with a server-bound capture definition.
Apply schema validation, abuse controls, upload restrictions, and purpose-specific consent capture.
Do not expose tenant internals or allow public callers to select account, owner, database, or CRM privileges.
Ordinary media remains private. Provider-fetchable media uses an explicit publishing projection and bounded access where supported.
Separate draft preview links, unsubscribe links, and tracking links from authenticated record URLs.
Make public tokens opaque, limited in scope, non-enumerable, and revocable where appropriate.

### Future Super Admin application

Build cross-client operations later as a separate owner with its own authorization and review.
Reserve a narrow public contract for connection health, queue health, and approved support operations.
Do not build global recipient search, an all-tenant campaign query, or unrestricted impersonation in Marketing.
Future support access must select a tenant explicitly, explain its purpose, expire, and audit each action.
Its existence must not weaken tenant APIs, job checks, connector ownership, or client permissions.

## App integration ownership

| Data or behavior                                                                                                      | Owner     | Integration rule                                                                                        |
| --------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Brand, campaign, content, publication, manual task, raw submission, audience segment, nurturing sequence, attribution | Marketing | Own tenant tables and leaf APIs.                                                                        |
| Canonical sales Lead, qualification, Sales Enquiry, sales assignment, calls, follow-up tasks and schedules            | CRM       | Request fixed public operations. Preserve CRM record visibility.                                        |
| Shared contact, company, organization, and product identity                                                           | Core      | Read and resolve through public contracts. Do not create a second contact database.                     |
| Landing page, website copy, blog, public form rendering                                                               | Sites     | Render published Marketing capture definitions through a fixed contract.                                |
| Email campaign content, audience snapshot, enrollment, schedule, approval, unsubscribe purpose                        | Marketing | Own business intent and campaign recipient state.                                                       |
| SMTP or email service credentials, sending transport, provider adapter, transport message and provider events         | Mail      | Extend Mail's public send and status contracts before campaigns use them.                               |
| Email delivery safety suppression                                                                                     | Mail      | Reject hard-bounced and complaint-blocked addresses across applicable tenant email streams.             |
| Marketing consent and subscription preference                                                                         | Marketing | Enforce purpose/channel/brand policy and publish suppression changes to delivery owners.                |
| Existing internal chat and Telegram transport                                                                         | Chat      | Reuse one transport and webhook owner. Add a fixed Marketing delivery and receipt contract if required. |
| Social comments, supported customer conversations, campaign routing                                                   | Marketing | Own Marketing inbox records. Reuse transport without duplicating Chat records.                          |
| Quotes, accepted orders, invoices, receipts, payments                                                                 | Billing   | Read permitted outcomes. Never reproduce financial source records.                                      |
| Activation, identity, RBAC, tenant routing, public file and queue infrastructure                                      | Platform  | Compose owner contracts. Keep business rules outside Platform.                                          |
| AI provider configuration, tool grants, AI audit and action approval                                                  | Zetro     | Later assistance through fixed permission-checked tools.                                                |

These target contracts require implementation and verification.
Do not import another app's private repository, service, UI form, schema, or database tables.
Cross-app operations use public contracts, injected dependencies, or approved events.
Use durable handoff events and stable retry identities. A failed CRM handoff must retain the submission for safe retry.

Phase 0 reconciled CRM Campaign and Consent planning on 2026-10-23.
Marketing owns the canonical Campaign and promotional consent ledger. CRM owns service-contact preferences and sales communication restrictions.
The reviewed CRM module inventory has no Campaign, Lead, or dedicated Consent leaf. These remain implementation gaps, not migrated capabilities.
CRM may display campaign lookups and source history but must not maintain a second campaign master.
Preserve existing Contact Preferences records. Their communicationPermission field is not evidence of promotional opt-in.
Sales contact restrictions and Mail delivery safety remain effective when Marketing is disabled.
See the Phase 0 decisions below for exact contract proposals, gaps, dependencies, and validation fixtures.

## Planned module inventory

These are domain responsibilities, not permission to build a metadata-driven CRUD engine.
Split concrete entities into leaf modules when implementation starts.

| Area            | Owned records and behavior                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Brands          | Company link, display identity, timezone, default channels, and content defaults.                                               |
| Connections     | Social grants, external account bindings, capabilities, lifecycle, validation, and health. Email links reference Mail settings. |
| Campaigns       | Objective, offer, owner, dates, audience, budget currency, approved channels, and tracking identity.                            |
| Content         | Drafts, immutable revisions, media links, channel variants, previews, approval, publications, and manual publishing tasks.      |
| Capture         | Forms, versioned field mappings, source records, raw submissions, duplicate decisions, and CRM handoff evidence.                |
| Audiences       | Saved segment rules, evaluation evidence, recipient snapshots, exclusions, preferences, consent, and suppression.               |
| Email campaigns | Subject, preheader, sender reference, HTML/plain text, audience, test sends, schedule, and recipient outcomes.                  |
| Inbox           | Supported threads, comments, messages, assignment, reply approvals, escalation, and CRM links.                                  |
| Automation      | Versioned triggers, conditions, waits, approved actions, enrollments, executions, stop reasons, and human takeover.             |
| Attribution     | Tracking links, touchpoints, spend imports, source mapping, conversion links, and reporting projections.                        |

Use internal integer IDs and unique 8-character lowercase hex `uuid` public identifiers as required by governance.
Generate public identifiers server-side with uniqueness checks and collision retries.
Never assume a short public identifier is an authorization secret.
Use additive upgrades for existing tenant data unless the approved migration plan says otherwise.
Align migration ordering, dependencies, foreign keys, lifecycle blockers, and seed behavior.

## Channel capability plan

No provider approval or entitlement is assumed. The account-readiness gate must validate actual accounts against current official documentation.
Record support separately for publishing, formats, comments, messages, lead retrieval, analytics, and advertising.
Display exact capability gaps and a supported fallback.

| Channel                 | Target scope                                                                     | Validation and fallback                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facebook Pages          | Approved Page publishing, supported engagement, insights                         | Validate Page role, token, scope, media, and app access. Native publishing task if unavailable.                                                   |
| Meta Lead Ads           | Lead notifications, lead detail retrieval, reconciliation                        | Verify form/Page binding and lead access. Controlled provider export import if unavailable.                                                       |
| Instagram               | Professional-account content, supported comments, messages, insights             | Validate login model, professional account, scopes, and format support. Manual tasks for unsupported content.                                     |
| WhatsApp Business       | Inbound conversations, templates, delivery events                                | Cloud API or authorized provider. Enforce opt-in, approved templates, service window, and human escalation.                                       |
| LinkedIn                | Approved publishing, engagement, analytics, lead forms                           | Treat Community Management and Lead Sync as separate access programs. Authorized native export/manual publishing fallback.                        |
| Google Ads              | Lead form webhook, later spend and conversion feedback                           | Validate webhook secret and test marker. Separate API access for reporting. Provider CSV import fallback.                                         |
| Google Business Profile | Supported location updates, posts, reviews, performance                          | Validate eligibility, location ownership, and each endpoint. Native management fallback.                                                          |
| YouTube                 | Authorized upload, processing status, supported comments and analytics           | Validate OAuth, quotas, visibility, and audit requirements. Native upload fallback.                                                               |
| Threads                 | Supported content, replies, insights                                             | Validate grants, formats, and account limits. Native publishing fallback.                                                                         |
| Pinterest               | Pins, boards, supported analytics                                                | Validate production access and visibility restrictions. Native publishing fallback.                                                               |
| X                       | Authorized content and supported reporting/engagement                            | Optional usage budget and cap. Native workflow when API entitlement is unavailable.                                                               |
| Telegram                | Future Bot API channels and permitted conversations through Chat-owned transport | Existing Chat uses account sessions and polling, not Bot API webhooks. Add a reviewed Chat adapter and validate bot rights. Native task fallback. |
| Email                   | Campaign delivery through Mail and supported email service adapters              | Verify sender/domain, consent, unsubscribe, suppression, provider limits, bounce and complaint feedback.                                          |

Never implement unsupported mass direct messaging, arbitrary personal-profile access, scraping, or password-based automation.
Do not promise identical content formats, analytics, or inbox coverage across platforms.
Show manual completion as user-confirmed. Show provider confirmation only after receiving provider evidence.

### Connection validation checklist

- Tenant, company, brand, app activation, actor permission, and external account ownership agree.
- OAuth state, redirect, requested scopes, granted scopes, token expiry, refresh, revoke, and reconnect behave correctly.
- Account type and provider product approval support the selected action.
- Webhook subscription, signature or secret verification, replay handling, and tenant routing pass.
- Text, links, media dimensions, duration, size, format, disclosure, and provider policy meet channel requirements.
- Account timezone, schedule, quota, rate-limit, billing allowance, and spend cap permit execution.
- Disconnect cancels local work, removes subscriptions where safe, and revokes only this tenant's grant.
- Safe credential rotation and stale webhook rejection preserve other connections.

## Screen and action contract

### Shared visual pattern

Reference CRM Enquiry `enquiry.workspace.tsx`, `enquiry.list.tsx`, `enquiry.show.tsx`, and `enquiry.form.tsx`.
Use these as interaction references, not private imports or code copied into shared infrastructure.
Follow `assist/documentation/design-system-helper.md` and `@codexsun/ui` workspace primitives.
Keep the same main layout, header rhythm, table density, spacing, typography, borders, status tones, and form language.
Tenant branding may customize permitted tokens and logos while retaining contrast, accessibility, and layout consistency.

Lists have a title, right-side primary action, search, filters, columns, compact table, row actions, and pagination.
Include date range, status, owner, brand, campaign, channel, and company filters where relevant.
Support clear filters, refresh, authorized exports, and row selection for explicitly safe bulk operations.
Large submission, recipient, and event lists require server-side pagination and permission-aware filters.
Row clicks open Show. Buttons and menus stop propagation.

Show pages provide a back action, context header, status, relevant actions, detail cards, related records, and activity history.
Use domain tabs such as Details, Content, Audience, Schedule, Delivery, Leads, Conversations, Integrations, and Activity.
Render tabs only when meaningful and permitted. Preserve direct-link and browser-back behavior.

Upsert uses shared dialogs or pages and distinct form, list, and workspace roles.
Provide required markers, persisted relationship lookups, save/update, cancel, loading, server errors, and success states.
Show validation banners after a failed submit and field-level messages for each invalid value.
Warn before losing unsaved changes. Keep status in Details unless a real lifecycle needs dedicated controls.
Use campaign previews or calendar views only where they help an actual publishing task.

### Buttons and feature actions

Every action needs a backend permission, valid state, visible pending state, result feedback, and audit evidence.
Use existing shared button variants and concise labels. Explain unavailable actions without exposing secrets.
Do not add decorative buttons, placeholder success, or actions without working backend behavior.

| Surface           | Required relevant actions                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal records    | New, View, Edit, Refresh, Activate/Deactivate or Suspend/Restore, authorized Export, and dependency-safe Delete/Force delete where allowed.                                       |
| Connections       | Connect, Select account, Validate, Reconnect, Refresh capabilities, View health, Disconnect.                                                                                      |
| Campaign          | New campaign, Duplicate as draft, Edit, Request approval, Approve/Reject, Schedule, Pause, Resume, Cancel, View leads, View report.                                               |
| Content           | New draft, Attach media, Preview per channel, Save draft, Duplicate as draft, Request approval, Approve/Reject, Schedule, Publish now, Cancel, Retry safely, Open published post. |
| Manual publishing | Open native destination, Download approved media, Copy caption, Assign, Mark completed with URL/evidence, Reopen.                                                                 |
| Capture           | New form, Preview, Publish/Unpublish, Copy embed/link, Send test, Import, Map fields, Review errors, Review duplicate, Retry CRM handoff, Open CRM record.                        |
| Audience          | New segment, Preview matches, Refresh count, Review exclusions, Snapshot audience, Manage subscription, Import/Export with permission.                                            |
| Email campaign    | New campaign, Select Mail sender, Edit template, Preview desktop/mobile, Send test, Review audience, Request approval, Schedule, Pause, Resume, Cancel, View delivery.            |
| Inbox             | Open conversation, Assign/Reassign, Reply, Save draft, Link/Create CRM record, Create follow-up, Pause automation, Resolve/Reopen.                                                |
| Automation        | New sequence, Version, Validate, Test with fixtures, Request approval, Activate, Pause, Resume, Stop enrollment, View execution, Human takeover.                                  |
| Reports           | Filter, Refresh, Drill into permitted source, Export, View attribution coverage.                                                                                                  |

Actions apply by entity and lifecycle. Sent email cannot be recalled through Cancel.
Pause and Cancel prevent unsent local work. Provider-accepted messages or publications may already be irreversible.
Publish now and Send test still need permission, current validation, explicit recipient/account context, and applicable approval.
Bulk actions show selected scope and partial results. Recheck every record on the server.
Do not force-delete consent evidence, sent records, active connections, or referenced outcomes through ordinary CRUD actions.
Provide retention-aware archive or redaction where deletion would destroy required evidence.

## Lead capture and CRM handoff

Preserve provider submission ID, original timestamp, account, form, campaign, source URL, available click identifiers, and consent evidence.
Store versioned field mappings and submission validation outcomes.
Keep provider test submissions visibly separate from production records and metrics.
Use tenant/provider/connection/submission identity for replay protection.
Phone and email normalization help matching but must not auto-merge ambiguous contacts.
CRM supports some shared phone numbers. Review ambiguity instead of treating a phone as unique customer identity.

Persist submission and handoff intent together, then use a durable outbox for CRM delivery.
CRM validates current assignment and contact rules before creating or linking its Lead.
Repeated handoff must reuse the same CRM result. Preserve source identity across retries.
Create Core contacts only through the agreed identity/conversion contract.
Return qualification, owner, next-action, and outcome projections through permission-aware events or reads.
Marketing users do not inherit CRM-wide record visibility from campaign ownership.

## Email campaign requirements

Marketing owns campaign intent. Mail owns transport and email provider credentials.
Add a public Mail contract for campaign sends, deduplication, status events, and cancellation of unsent work.
Review SMTP limits and provider suitability before enabling bulk sends. Do not assume mailbox SMTP is a bulk email service.

- Verify sender identity and domain setup, including SPF, DKIM, and DMARC evidence.
- Support sender name, verified From, Reply-To, subject, preheader, HTML, and plain-text content.
- Validate addresses, required campaign fields, safe links, HTML, attachments, and template variables.
- Sanitize preview content and prevent scripts, unsafe URLs, and template access to unrelated data.
- Fail visibly on missing personalization values. Never send unresolved placeholders.
- Record channel-purpose consent and source. Imports must not imply consent.
- Separate marketing subscriptions from essential transactional communication.
- Provide visible unsubscribe and provider-compatible one-click unsubscribe where applicable.
- Use scoped opaque unsubscribe tokens. Protect GET requests from accidental scanner-triggered mutation and make POST handling idempotent.
- Keep required business sender identification in templates. Do not invent business addresses or legal details.
- Suppress unsubscribed, hard-bounced, complaint-blocked, and policy-blocked recipients before enqueue and again before send.
- Validate and ingest provider bounce, complaint, unsubscribe, and delivery events through Mail.
- Snapshot the approved content and audience. Recheck current exclusions when each recipient executes.
- Bind approval to content revision, sender, audience policy/snapshot, schedule, and limits. Material edits invalidate approval.
- Deduplicate recipient identities within a campaign under explicit rules without merging Core contacts.
- Batch with provider rate limits, tenant quotas, timezone-aware schedules, and maximum recipient counts.
- Restrict test sends to approved test recipients. Keep test results outside production metrics.
- Pause or cancel unsent recipients safely. Reconcile unknown delivery outcomes before retry.
- Keep credentials and recipient addresses out of unrestricted logs and exports.

Track draft, approval, scheduled, sending, paused, completed, cancelled, and failed campaign states with valid transitions.
Track recipient queued, provider-accepted, delivered where confirmed, bounced, complained, unsubscribed, suppressed, and failed outcomes separately.
Do not equate SMTP acceptance with inbox delivery.
Label opens and clicks as limited engagement signals. Privacy features and automated scanners can distort them.
Enable tracking under the tenant's consent and privacy policy. Reports must not identify these signals as proven human engagement.
Do not use purchased/scraped recipient lists as an acquisition feature.

## Automation and publishing execution

Start with bounded templates: acknowledgment, owner assignment, overdue escalation, approved nurture, qualification handoff, and stop-on-reply.
CRM owns human sales tasks and schedules. Marketing requests their creation rather than duplicating them.
Store trigger, rule version, audience policy, content revision, approval, actor, and stop reason for every enrollment.
Add delays, conditions, local-time windows, frequency caps, and a maximum execution count.
Prevent event loops between Marketing, CRM, Mail, and provider callbacks using origin and correlation identities.

Before each external action, recheck activation, permissions, connection ownership, token validity, consent, suppression, approval, and current CRM state.
Pause relevant nurturing on reply, human takeover, opt-out, conversion, complaint, or a configured exclusion.
Stop queued work after consent withdrawal. An approved sequence does not authorize unrelated future sends.
Business automation requires explicit approval of the rule and scope. AI-generated business actions need the required action confirmation.

Use durable jobs with leases, bounded retries, backoff, dead-letter review, and per-tenant fairness.
Do not rely on browser timers or an open dashboard for delivery.
Handle daylight-saving changes, tenant timezone changes, stale schedule edits, and concurrent workers.
Where a provider lacks idempotency, reconcile ambiguous results before another publish/send attempt.
Keep requested, queued, provider-accepted, published/delivered, failed, and manual-completed states distinct.
Approval of a revision must not silently approve later content changes.

## Reporting and commercial scope

Measure submissions, unique Leads, qualified Leads, first-response time, overdue follow-ups, and linked sales outcomes.
Separate organic and paid results. Preserve spend source, currency, reporting period, timezone, and synchronization timestamp.
Define attribution windows and first/last-touch rules explicitly. Keep unknown attribution visible.
Show provider-reported conversions separately from CRM-confirmed outcomes.
Calculate cost per Lead and qualified Lead only from compatible periods, currencies, and source records.
Use Billing references for revenue. Handle cancellations and refunds through authoritative financial outcomes.
Report attribution coverage and stale data. Do not add incompatible platform metrics into a misleading total.
Detailed ad creation, autonomous budget changes, and automatic campaign optimization remain later scope.

## Delivery phases and exit gates

| Phase                                    | Scope                                                                                                                               | Exit gate                                                                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0: Ownership and readiness               | Reconcile CRM Campaign/Consent ownership, public contracts, module dependencies, provider access, and threat cases.                 | Approved boundary map, account capability matrix, lifecycle rules, test fixtures, and fallback plan. No duplicate owners.                            |
| 1: Tenant foundation and capture MVP     | Tenant dashboard shell, brands, connection foundation, campaigns, tracking, Sites forms, controlled imports, CRM Lead handoff.      | Two tenants use identical screens with separate databases. A real permitted submission reaches only its CRM owner. Retries do not duplicate records. |
| 2: Social lead capture and publishing    | Meta Lead Ads, Google Ads webhook, Facebook/Instagram content, calendar, approval, media validation, manual tasks.                  | Actual authorized accounts pass capability tests. Publication evidence, replay handling, restart recovery, and manual fallback pass.                 |
| 3: Email campaigns                       | Mail contract extension, verified sender, templates, segments, audience snapshots, consent, unsubscribe, bounce/complaint handling. | A limited approved pilot passes delivery evidence, tenant isolation, suppression races, pause/cancel, and retry tests.                               |
| 4: Conversations and nurturing           | WhatsApp, supported inbox, CRM follow-up actions, bounded automation templates, human takeover.                                     | Opt-out/reply/conversion stops queued actions. Template/window rules and per-tenant execution limits pass.                                           |
| 5: Remaining channels                    | LinkedIn, Google Business Profile, YouTube, Threads, Pinterest, X, and Telegram through their approved contracts.                   | Each channel independently passes OAuth, rights, callback isolation, supported formats, quota, disconnect, and fallback tests.                       |
| 6: Attribution and operational readiness | Spend, conversion feedback, CRM/Billing outcomes, health, retention, restore, quotas, documentation, and client pilot.              | Reports reconcile. Backup/recovery and suspension drills pass. Real client workflow and operations review pass.                                      |

Prepare provider applications during readiness work. Submission and account connection need separate authorization and actual account evidence.
Approval timing does not block owned forms or controlled imports.
Email campaigns are essential committed scope, not an optional final enhancement.
Channel capability gaps may use a documented fallback. They must not be marked API-complete.
The future Super Admin app, advanced workflow canvas, and AI assistance need separate plans after the tenant baseline works.

## Phase 0 decisions and contract review

Planning review completed on 2026-10-23. This section records design decisions and source inspection, not implemented contracts.
No client credentials, live account settings, provider grants, or production databases were queried.
Account readiness remains a separate rollout gate. Unknown account details must stay unknown.
The logical contract names below are proposals for fixed operations, not existing endpoints or exported functions.

### Reconciled Campaign and Consent ownership

Marketing owns the sole Campaign master, channel execution, budget intent, content, audiences, and attribution.
CRM owns Leads and Sales Enquiries and stores a Marketing campaign UUID plus an immutable source label snapshot.
Campaign retirement must not erase CRM source history. Campaign changes do not rewrite previously captured attribution.
Ecommerce Campaign Events remain Ecommerce promotion-card presentation. They are not the acquisition Campaign master.
Core product Brand remains a catalog identity. Marketing Brand is a company-scoped communication identity, optionally linked through a public lookup.

Marketing owns an append-only promotional consent ledger and effective subscription state.
Each entry identifies the tenant-local subject/recipient, company or controller scope, brand where applicable, channel, purpose, source, notice version, time, and actor.
Retain grant, withdrawal, expiry, correction, and evidence references. Store only necessary recipient data before Core contact resolution.
Do not create a Core contact merely to record a withdrawal or an anonymous form submission.
CRM owns service-contact preferences and restrictions needed for sales/service workflows.
Existing CRM Contact Preferences are operational preferences, not a promotional consent ledger.
Mail owns hard-bounce, complaint, and delivery-policy suppression with reason and provider evidence.
Core owns identity only. A contact email, phone, address, or social link does not grant permission to send.

For promotional sends, all applicable controls must permit delivery:

1. Marketing has current, evidenced consent for the requested channel and purpose.
2. CRM has no applicable do-not-contact restriction.
3. Mail or the channel transport has no delivery-safety block.
4. Tenant activation, recipient policy, connection, approval, and rate limits still permit the action.

Unknown, expired, contradictory, or unavailable permission evidence must block promotional delivery.
Apply a withdrawal immediately in the owner, then relay cancellation through a durable event.
Execution checks must consult authoritative state so delayed events cannot permit a stale queued send.
Re-consent requires new explicit evidence. It cannot clear a complaint or hard-bounce block by itself.
Marketing disabled means no promotional delivery. CRM service workflows and Mail safety restrictions continue independently.
Essential service messages require their own approved purpose policy. Do not relabel promotions as service communication.

### Source inventory and integration gap register

All gaps below are open implementation work. Owner PLAN and TASK documents mirror these responsibilities.

| Gap | Source inspected and current baseline                                                      | Missing contract or risk                                                                                                                                                   | Owner and delivery gate                                                                                                           |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| G01 | CRM `api/src/index.ts`, module inventory, Task/Scheduler routes, Contact Preferences types | No dedicated Lead/Campaign/Consent leaf. Task and Scheduler HTTP routes do not establish an idempotent Marketing intake service.                                           | CRM Lead intake and follow-up contracts before Phase 1 exit. Marketing owns Campaign.                                             |
| G02 | Core `api/src/index.ts`, `master/contact/index.ts`, README duplicate policy                | Public contact/company lookups and resolvers exist. Marketing-specific UUID lookup, field minimization, match review, and permission scope need a fixed contract.          | Core in Phase 1. Do not merge by phone or repurpose Frappe source identity.                                                       |
| G03 | Sites README, public enquiry runtime, site exports                                         | SQLite/D1 enquiries already exist. Remote transport and remote D1 inbox sync are not implemented in the documented runtime.                                                | Sites owns existing intake and adds durable forwarding. Marketing owns new capture definitions and imported submissions. Phase 1. |
| G04 | Mail `mail.types.ts`, service, worker, public exports                                      | SMTP compose/send/sync exists. Missing campaign approval token, per-recipient contract, campaign suppression, authenticated provider feedback, and unsent-cancel protocol. | Mail in Phase 3. Generic compose/system-send is not the campaign adapter.                                                         |
| G05 | Mail worker tenant SMTP/environment fallback paths                                         | Existing fallback may use a different sender. Campaign sends must not silently switch to a shared operator sender or another company's provider.                           | Mail must bind an approved sender and fail closed before Phase 3 pilot. Preserve existing non-campaign behavior.                  |
| G06 | Chat `chat.telegram.types.ts`, routes/service, Platform `chat-host.ts`                     | Current Telegram uses phone/code/password account sessions, dialogs, and polling. No ready Bot API transport is established.                                               | Chat owns a new bot adapter and callback consumer in Phase 5. Existing account sessions remain unchanged.                         |
| G07 | Platform app registry, `app.ts`, queue and tenant composition                              | No Marketing registration. Need entitlement, permission resolution, migration ordering, job registration, account-claim/callback routing, and cancellation context.        | Platform infrastructure with Marketing business contracts. Phase 1 foundation.                                                    |
| G08 | Billing `api/src/index.ts`, reports, ownership docs                                        | Existing outstanding/period reads do not supply campaign revenue attribution. Need source-linked, company/FY/currency-scoped outcomes and reversals.                       | Billing outcome projection in Phase 6. No inferred revenue.                                                                       |
| G09 | Ecommerce promotion-card types, composition/storefront exports, README                     | Campaign Events are published promotions. Browser basket does not establish checkout/order completion or recoverable abandonment.                                          | Ecommerce optional source adapter and explicit campaign link. No automatic abandoned-cart emails or purchase claims.              |
| G10 | TConnect public and participant contracts, API index, README                               | Enquiries, registration consent, participant messages, and quotations remain TConnect-owned. No Marketing source bridge established.                                       | TConnect optional redacted handoff. No directory harvesting or competitor quote export.                                           |
| G11 | Sportsclub README, modules and public contracts                                            | Sports enquiries, membership, guardian/minor and private member data require a specific permitted projection.                                                              | Sportsclub optional enquiry handoff. Exclude medical data, member photos, and private roster from audiences.                      |
| G12 | Frappe exports, README, live-sync PLAN                                                     | CRM import/export has an explicit direction and approved scope. Marketing handoff could otherwise trigger unwanted remote exports.                                         | CRM/Frappe source-aware export policy before Phase 1 handoff. No new Campaign/Consent export or new remote read source.           |
| G13 | Zetro API exports, agent README and runtime SKILLS                                         | Current rules forbid chat writes/sends/publishing. No Marketing record skill exists.                                                                                       | Deferred read/draft proposal only. Do not edit runtime rules or imply a new capability from this plan.                            |
| G14 | Other app documentation inventory                                                          | No essential Marketing contract identified for Accounts, Auditor, HIMSX, HRMS, LogicX ERP, QCafe, Notes, Docs, or CODEXSUN product tools.                                  | No new dependency or broad data access. Any later adapter needs its own owner review and purpose.                                 |

The source review establishes file and contract presence only. It does not certify live behavior or exhaustively audit unrelated app internals.
Generic repositories exported by an app are not permission to bypass its service validation or read its tables directly.

### Fixed integration contract proposals

All authenticated operations receive server-resolved tenant, actor/service principal, company scope, correlation ID, and current authorization.
Public operations resolve tenant through verified host or signed source binding, never through a caller-selected database.
Use public UUID references, explicit schema versions, bounded payloads, and minimal fields.

| Logical operation            | Required request and result                                                                                                                                                           | Authorization, replay, and failure behavior                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing Campaign lookup    | Campaign UUID, company/brand scope -> label, lifecycle, allowed source mapping                                                                                                        | Same-tenant permitted lookup. Retired labels remain available for historical links, not new enrollment.                                             |
| Marketing Capture accept     | Bound form/source, submission key, source timestamp, fields, campaign reference, consent notice evidence -> submission UUID and status                                                | Source authentication and field mapping. Same key/same payload reuses result. Same key/different payload is a conflict.                             |
| CRM Lead intake              | Submission UUID, source/account identity, campaign UUID/label, qualification fields, consent evidence references, permitted assignment rule -> Lead UUID, created/linked/review state | CRM deduplication and record scope. Stable receipt for retries. Ambiguous contacts require review. No automatic Frappe export.                      |
| CRM Follow-up request        | Lead/enquiry UUID, handoff key, due instant/timezone, action, permitted owner rule -> task/schedule UUID                                                                              | CRM resolves supported source and assignee. Add Lead scheduler support explicitly. Reject unsupported links rather than creating a shadow reminder. |
| CRM Outcome read/event       | Source link and outcome version -> permitted qualification, next-action, enquiry outcome, timestamps                                                                                  | Preserve own-record scope. Campaign attribution gets only an approved minimized projection, not unrestricted CRM records.                           |
| Core Identity lookup/resolve | Explicit contact UUID or proposed match facts with purpose -> permitted minimal candidates or deliberate resolution                                                                   | Respect duplicate rules and caller scope. Do not expose bank, tax, or unrelated contact fields to campaign operators.                               |
| Consent eligibility          | Recipient/subject reference, controller/company, brand, channel, purpose, requested action -> allow/deny/unknown with evidence version                                                | Marketing owns promotional grant. CRM restrictions and transport blocks can veto. Unknown or unavailable blocks promotions.                         |
| Mail Campaign dispatch       | Campaign/recipient UUID, content revision/hash, approved sender UUID, purpose, approval reference, idempotency key -> transport UUID and accepted/rejected state                      | One recipient envelope per intended delivery. Recheck consent/safety. Never use generic system-send or implicit shared fallback.                    |
| Mail Cancel unsent           | Campaign/recipient UUID, expected run version, cancellation reason -> cancelled/provider-accepted/unknown result                                                                      | Fenced execution distinguishes unsent from already accepted. No recall promise and no blind retry for unknown outcomes.                             |
| Mail Delivery feedback       | Authenticated provider event, sender connection, external message ID, event/version/time -> durable receipt and recipient projection                                                  | Resolve trusted tenant mapping, deduplicate, and apply hard-bounce/complaint blocks before further delivery.                                        |
| Chat Telegram delivery       | Chat bot connection UUID, authorized destination, publication/reply revision, retry key -> provider reference/status                                                                  | Chat owns credentials and bot webhook. Marketing intent never bypasses Chat destination rights or grants account-session access.                    |
| Sites/domain-app forwarding  | Signed source identity, original record UUID/revision, purpose-specific fields, campaign evidence -> Marketing submission receipt                                                     | Original enquiry stays in its owner. Outbox retries preserve identity. Existing consent boolean is not promotional opt-in.                          |
| Billing Outcome projection   | Explicit permitted commercial source link -> status, amount, currency, company/FY, version, cancellation/refund evidence                                                              | Billing authorizes every projection. Exclude full ledgers. No contact/date heuristic represented as exact attribution.                              |

Use explicit validation, denied, not-found-without-disclosure, conflict, dependency-unavailable, and retryable-provider error categories.
Record permanent failures for review. Retain durable intent across transient failures without duplicate downstream actions.
No cross-database transaction is assumed. Each owner writes its receipt/outbox in its own transaction and reconciles delivery.

Proposed event families: capture accepted, CRM intake linked/reviewed, CRM qualification/outcome changed, consent changed, dispatch accepted, delivery changed, connection revoked.
Each carries event UUID, schema version, trusted tenant identity, source owner, aggregate UUID/version, timestamp, correlation, causation, and minimal payload.
Maintain per-consumer receipts, bounded retries, reconciliation, and stale-version handling. Preserve raw evidence according to owner retention policy.
Do not rebroadcast imported events as new user actions or trigger feedback loops.

### Activation, permissions, and dependency order

Marketing foundation requires Platform and Core. CRM activation is required for handoff, sales follow-up, and CRM-linked recipient eligibility.
Mail is required for email delivery. Chat is required for Telegram delivery. Sites is required for Sites-managed forms and landing pages.
Billing, Ecommerce, TConnect, and Sportsclub integrations remain optional and individually permission-gated.
Frappe is never a Marketing data source or intrinsic dependency. Existing CRM/Frappe activation coupling must be reviewed rather than bypassed.
If CRM is unavailable, preserve submissions as pending handoff. Do not invent a local Marketing sales pipeline.
If an optional app is disabled, stop that integration and retain evidence. Do not disable unrelated Marketing functions.

A tenant without CRM may use Marketing-only recipients under Marketing consent and transport safety checks.
The server must establish that no CRM-linked restriction source applies. An absent client-supplied link is not sufficient evidence.
Previously CRM-linked recipients remain blocked if the CRM restriction contract becomes unavailable or disabled.
Record allow, deny, unknown, and explicitly not-applicable policy results separately.
Not-applicable means an owner-validated scope decision, never a fallback after an error.

Proposed action families follow `marketing.<module>.<resource>.<action>`.
Separate read, create/update, review, approve, publish/send, connection-manage, import/export, automation-activate, and retention actions.
Map these through current Platform permissions rather than inventing a parallel role system.
Suggested personas: Viewer, Content Editor, Campaign Operator, Approver, Connection Manager, and Tenant Marketing Admin.
They are proposed permission bundles, not new global roles or automatic grants.
Every read uses record/company/brand scope. Connection management does not grant recipient export or CRM-wide access.
Do not grant self-approval by default. Explicit tenant policy may allow it only with a separate permission and audit.
Background automation uses a revocable tenant automation principal with a bounded grant, not an expired browser cookie.
User logout does not transfer authority. Principal revocation or missing owner policy stops the run.

Order: Platform/Core prerequisites -> Marketing migrations/access -> Campaign/Consent/Capture -> CRM Lead intake -> Sites/domain-source bridges -> publishing -> Mail campaigns -> inbox/automation -> other channels -> attribution.
Do not publish public forms with a CRM delivery promise before the intake dependency passes.

### Retention and version compatibility

Keep existing Sites enquiry retention until a reviewed owner change is approved. Forwarding must not silently extend source retention.
Alert on undelivered handoffs before source expiry. Define downstream redaction and deletion propagation without erasing required audit receipts.
R05 must approve retention per raw submission, message content, consent evidence, public tracking event, and delivery receipt before launch.
Do not activate a recipient import without an approved provenance and retention policy.
Use minimal tombstones or pseudonymous suppression keys where needed to prevent accidental re-import after deletion.
Define key rotation and deletion access for those records. Do not retain full recipient content merely for deduplication.
Version public contracts and mapping snapshots. Reject incompatible consumers and keep replay evidence across upgrades.
Store event timestamps as machine-readable UTC with the intended schedule timezone. Render dates using the shared application format.

### Account-readiness register and release prerequisites

For every channel in the capability matrix, current client account identity, administrator proof, production scopes, approval, quota, and spend allowance are unverified.
Maintain one restricted tenant account-readiness record per company/brand/provider connection during implementation.
Record account identifier/type, verified owner, requested/granted scopes, app access status, callback test, safe pilot result, expiry, limits, cost acceptance, and fallback.
Never put tokens, secrets, account passwords, or recipient lists into repository documents.
Do not add settings assertions based only on environment variable names or a developer token.

- R01: Obtain client-selected brands, account IDs, ownership evidence, and authorized connection operators.
- R02: Recheck current official scopes, formats, quotas, provider reviews, and country/account availability for each selected capability.
- R03: Complete provider applications and consent screens, privacy/deletion URLs, verified callbacks, and required account/domain checks.
- R04: Select a Mail bulk delivery provider, verified tenant sender, bounce/complaint feedback, volume limit, and explicit cost cap.
- R05: Approve client consent wording, required sender details, retention periods, company/brand scope, and recipient import provenance.
- R06: Run safe per-tenant capability tests after implementation and explicit external-action authorization.

R01-R06 remain open rollout gates. Phase 0 planning completion does not mark any of them passed.
If provider access is pending, use the matrix's supported manual/import workflow and display its limits.

### Fixture and acceptance specification

Use disposable tenants A and B with separate databases, separate credentials, and brands A1/A2/B1.
Create editors, approvers, connection managers, restricted CRM sales users, and revoked automation principals in each tenant.
Use synthetic recipient addresses, a shared-phone ambiguity pair, test provider accounts, and a signed fake event source.
Fixtures are specified here, not created or executed by this documentation task.

| Scenario                                                                                                  | Expected outcome                                                                                        |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A swaps tenant headers, public UUIDs, callback state, media links, exports, or job tenant identity with B | Denied without data disclosure, provider action, or writes in the wrong database.                       |
| A1 operator selects unauthorized A2 company/brand, or imports a B account identifier                      | Denied by owner checks. No inference of another client's account label.                                 |
| OAuth state replays, expires, or returns under the wrong session/provider                                 | Connection fails closed. No token persists against another tenant.                                      |
| Same provider account is claimed by B after A binds it                                                    | Opaque conflict. No transfer until a separately approved audited workflow exists.                       |
| Signed event repeats or arrives out of order after reconnect                                              | One accepted business effect. Stale connection generation cannot route to a new owner.                  |
| Capture forwards twice or worker crashes after CRM commits                                                | Same CRM intake receipt, one Lead and follow-up. Conflicting payload reuse requires review.             |
| Two prospects share a phone or an existing preference says communication allowed                          | No automatic contact merge and no inferred promotional opt-in.                                          |
| Sites SQLite/D1 retries forwarding or its upstream is unavailable                                         | Original enquiry remains saved. Tenant-bound outbox retries without duplicate Marketing capture.        |
| CRM intake source encounters an enabled Frappe bidirectional sync                                         | No new Marketing-origin export until a source-aware export rule is explicitly implemented and approved. |
| Withdrawal, complaint, app suspension, sender revocation, or principal revocation occurs during a batch   | Subsequent unsent work blocks at execution. Already accepted items remain accurately reported.          |
| CRM or consent owner is unavailable at promotional execution                                              | Run waits/fails visibly. Cached allow state cannot authorize delivery.                                  |
| Tenant SMTP fails and shared environment fallback exists                                                  | Campaign send fails without silently changing sender/provider.                                          |
| Content/audience/sender changes after approval or schedule generation changes concurrently                | Prior approval/job generation cannot execute the changed intent.                                        |
| Marketing read attempts TConnect quotes, Sportsclub medical/photo data, or unlinked Billing amounts       | Denied or omitted by minimized contracts. No audience extraction.                                       |
| Marketing/Zetro text requests sending, publishing, or arbitrary database access                           | Current backend and Zetro runtime rules remain authoritative. No new action runs.                       |

Phase 1 implementation must turn these scenarios into focused contract/database tests.
Browser and authorized live provider pilots remain separate acceptance gates.

## Verification and evidence

For each phase, retain exact commands, fixture identities without secrets, results, dates, and remaining limitations in TASK.
Documentation checks validate the four files only.
After code exists, use root formatting, focused lint, API/Web typecheck, boundary checks, production builds, dependencies, and component-doc gates.
Use `node tools/check-module-boundaries.mjs marketing` after executable modules exist.
Add package scripts only when their workspace packages exist.

Required behavioral evidence:

- Two isolated tenant databases, forged headers, swapped public identifiers, invalid hosts, and unauthorized company/brand access.
- OAuth state replay, cross-tenant callback confusion, account collisions, stale tokens, reconnect, revocation, and signed webhook replay.
- Queue restart, duplicate delivery, concurrent workers, unknown provider outcomes, tenant suspension, and consent changes during a batch.
- CRM duplicate review, stable handoff identity, assignment scope, record visibility, and approved outcomes.
- Email sender validation, missing template values, test isolation, unsubscribe, bounce, complaint, and no sends after suppression.
- Browser list, Show, upsert, buttons, disabled states, validation, keyboard access, mobile width, direct links, and browser back.
- Provider-confirmed live pilot per enabled capability. Mock responses do not prove live provider behavior.
- Tenant-specific backup/restore, retention/redaction, credential rotation, and private file access.

## Provider reference starting points

These references came from planning research on 2026-10-23. Recheck current versions, access, costs, and policies before implementation.
Some Meta developer pages were rate-limited during research. Exact permissions require direct account-readiness validation before enabling a capability.

- [Meta lead retrieval setup](https://github.com/facebookincubator/catalogue-of-api-solutions/blob/main/solutions/leads/leads-retrieval-set-up-checker.md)
- [Meta Instagram collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [WhatsApp messaging policy](https://business.whatsapp.com/policy)
- [LinkedIn Community Management](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview)
- [LinkedIn Lead Sync](https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/leadsync)
- [Google Ads lead webhook](https://developers.google.com/google-ads/webhook/docs/overview)
- [Google Business Profile](https://developers.google.com/my-business/content/overview)
- [YouTube uploads](https://developers.google.com/youtube/v3/docs/videos/insert)
- [Meta Threads collection](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api)
- [Pinterest access tiers](https://dev.pinterest.com/docs/key-concepts/access-tiers/)
- [X access pricing](https://docs.x.com/x-api/getting-started/pricing)
- [Telegram bot documentation](https://core.telegram.org/bots/faq)
