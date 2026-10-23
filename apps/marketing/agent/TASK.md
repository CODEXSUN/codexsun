# Marketing Delivery Tasks

## Tracking rules

Baseline: 2026-10-23. Phase 0 created planning documents. The user subsequently authorized local Phase 1 implementation.
All implementation tasks remain unchecked until exact acceptance evidence exists.
Do not mark a feature complete because its directory, button, route, or mocked response exists.
Record source checks, automated checks, database behavior, browser behavior, provider behavior, and deployment separately.

## Documentation baseline

- [x] Create README, PLAN, TASK, and SKILLS under `apps/marketing`.
- [x] Define a shared client dashboard with a separate tenant database for each client.
- [x] Define app ownership, isolated connections, CRM-style screens, email campaigns, phases, and exit gates.
- [x] Exclude TikTok and reserve cross-client administration for a separate future app.

Evidence: the four Markdown files contain the planning baseline. They do not implement a runtime capability.

## Phase 0: Ownership and readiness

Status: planning complete on 2026-10-23. Contract implementation and live account readiness remain open.
See [Phase 0 decisions and contract review](PLAN.md#phase-0-decisions-and-contract-review).

- [x] 0.1 Review app documentation and relevant source/public contracts. Record G01-G14 and owner backlog links.
- [x] 0.2 Reconcile CRM Campaign and promotional/service Consent ownership across Marketing and CRM documents.
- [x] 0.3 Specify canonical CRM Lead intake, duplicate review, assignment, conversion linkage, and outcome contract proposals.
- [x] 0.4 Specify Mail campaign dispatch, delivery feedback, suppression, sender binding, and unsent-cancellation proposals.
- [x] 0.5 Record existing Telegram account-session behavior and assign the future Bot API transport/webhook to Chat.
- [x] 0.6 Define company/brand scope, proposed permission bundles, record visibility, revision approval, and retention ownership.
- [x] 0.7 Prepare the provider account-readiness register and fallback matrix. Actual account facts remain explicitly unverified under R01-R06.
- [x] 0.8 Specify OAuth/callback mapping, account collision handling, shared routing metadata, rotation, and future transfer policy.
- [x] 0.9 Specify public form, unsubscribe, tracking, preview, media, and existing Sites/domain-app forwarding boundaries.
- [x] 0.10 Specify disposable two-tenant fixtures and replay, callback confusion, suppression, activation, and queue failure scenarios.

Exit evidence: PLAN contains ownership decisions, G01-G14 source/gap register, logical contract schemas, dependency order, readiness gates, and fixture specification.
The related owner PLAN/TASK files contain mirrored responsibilities and unchecked implementation tasks.
Fixtures and contracts are specified, not created or executed. No provider connection or approval is claimed.

### Account and client rollout prerequisites

- [ ] R01 Obtain actual client account/brand identifiers and ownership evidence through an authorized tenant setup flow.
- [ ] R02 Validate current official capabilities, scopes, limits, access reviews, costs, and availability per selected account.
- [ ] R03 Complete authorized provider applications, consent/privacy/deletion pages, callbacks, and domain verification.
- [ ] R04 Select and verify the tenant bulk email provider, sender, feedback events, quotas, and cost allowance.
- [ ] R05 Approve client consent notices, sender details, retention periods, brand/controller scope, and import provenance.
- [ ] R06 After implementation, run authorized capability pilots and record per-tenant results.

These are live readiness gates, not completed planning evidence. They cannot be inferred from a document or a developer token.

## Phase 1: Tenant foundation and capture MVP

Status: in progress locally. The broad exit gate remains open.
The implementation log below separates source, automated database tests, browser checks, and live readiness.

- [ ] 1.1 Register tenant Marketing activation, permissions, routes, migrations, seeds, and menu through public composition points.
- [ ] 1.2 Implement tenant/company/brand-scoped context for requests, storage, caches, reports, exports, and jobs.
- [ ] 1.3 Build shared CRM-style list, Show, and upsert surfaces for brands, campaigns, connections, and submissions.
- [ ] 1.4 Implement required normal lifecycle actions, validation banners, statuses, row actions, and activity history.
- [ ] 1.5 Implement secure OAuth initiation/callback, account selection, encrypted grants, capability status, and disconnect.
- [ ] 1.6 Build campaigns, channel links, tracking identity, and safe duplication as draft.
- [ ] 1.7 Build Marketing capture definitions with Sites-owned public rendering and verified tenant host mapping.
- [ ] 1.8 Build controlled imports with preview, mapping, consent review, errors, and duplicate review.
- [ ] 1.9 Persist submissions and durable CRM handoff intent with stable retry identities.
- [ ] 1.10 Implement canonical CRM Lead creation/linking, contact ambiguity review, assignment, and follow-up task request.
- [ ] 1.11 Verify tenant A cannot read, mutate, export, preview, or enqueue work for tenant B.
- [ ] 1.12 Add source-aware CRM/Frappe export policy so Marketing-origin intake cannot trigger an unapproved remote transfer.
- [ ] 1.13 Add Sites-owned durable forwarding for existing SQLite/D1 enquiries without transferring their owner or promising remote inbox sync.
- [ ] 1.14 Implement effective promotional eligibility across Marketing consent, CRM restrictions, and transport safety with fail-closed behavior.
- [x] 1.14a Implement and locally verify the promotional email evidence/check slice across Marketing, CRM, Core identity lookup, and Mail safety.
- [ ] 1.14b Add other channel authorities and bind future promotional dispatch to repeated execution checks when those transports are implemented.

Exit evidence: identical client screens on separate databases, permitted form-to-CRM flow, and duplicate-safe retry after restart.
CRM canonical Lead readiness is a dependency, not permission to hide a second Lead implementation inside Marketing.

## Phase 2: Social lead capture and publishing

- [ ] 2.1 Implement Meta Lead Ads notification, detail retrieval, source mapping, and supported reconciliation.
- [ ] 2.2 Implement Google Ads lead webhook verification and separate test submissions from production.
- [ ] 2.3 Build content drafts, revisions, media library, channel variants, and per-channel previews.
- [ ] 2.4 Build revision-bound approval, rejection reasons, scheduling, cancellation, and timezone handling.
- [ ] 2.5 Implement Facebook Page publishing for verified capabilities.
- [ ] 2.6 Implement Instagram professional publishing for verified formats and capabilities.
- [ ] 2.7 Build calendar and manual publishing tasks with evidence, native destination, media download, and caption copy.
- [ ] 2.8 Implement durable publication jobs, rate limits, uncertain-result reconciliation, and safe retries.
- [ ] 2.9 Verify reconnect, token expiry, stale callbacks, cross-tenant account collision, and disconnect behavior.

Exit evidence: authorized live lead and publishing pilots, provider references, replay tests, and restart recovery.
Manual confirmation remains distinct from API-confirmed publication.

## Phase 3: Email campaigns

- [ ] 3.1 Extend Mail public contracts and assess a suitable bulk email transport/provider.
- [ ] 3.2 Verify sender/domain ownership and SPF, DKIM, DMARC, provider limits, and feedback capability.
- [ ] 3.3 Build email campaign list, Show, upsert, sender selection, subject, preheader, and HTML/plain-text templates.
- [ ] 3.4 Build sanitized desktop/mobile preview, variable validation, and approved test-recipient sends.
- [ ] 3.5 Build segments, consent evidence, exclusion review, deduplication, and approved audience snapshots.
- [ ] 3.6 Implement preference management, visible unsubscribe, applicable one-click unsubscribe, and scoped public tokens.
- [ ] 3.7 Integrate authenticated bounce, complaint, delivery, and unsubscribe events through Mail.
- [ ] 3.8 Enforce campaign and delivery-safety suppression at enqueue and execution, including active-batch withdrawal.
- [ ] 3.9 Build revision-bound approval, schedule, batched sending, pause/resume, unsent cancellation, and safe retry.
- [ ] 3.10 Build recipient outcomes, limited engagement metrics, audit, quotas, and authorized exports.
- [ ] 3.11 Run a limited approved live pilot and reconcile transport acceptance against available delivery evidence.
- [ ] 3.12 Block implicit environment/shared-sender fallback for campaign dispatch without changing existing non-campaign transport behavior.

Exit evidence: verified sender, correct recipients, functional unsubscribe, suppression race tests, and isolated delivery records.
SMTP acceptance, open pixels, and scanned links must not appear as proven inbox delivery or human engagement.

## Phase 4: Conversations and nurturing

- [ ] 4.1 Implement tenant-owned WhatsApp Business connection using Cloud API or an authorized provider.
- [ ] 4.2 Enforce consent, approved templates, service windows, limits, and escalation.
- [ ] 4.3 Build permitted inbox threads, assignment, replies, drafts, resolve/reopen, and CRM record links.
- [ ] 4.4 Add bounded automation templates with versioned triggers, conditions, delays, caps, and approved actions.
- [ ] 4.5 Request CRM tasks and schedules through public contracts. Preserve CRM record visibility.
- [ ] 4.6 Stop or pause relevant enrollment on reply, opt-out, conversion, complaint, suspension, or human takeover.
- [ ] 4.7 Prevent integration event loops and duplicate cross-app actions.
- [ ] 4.8 Verify current authorization, consent, account rights, and approval again before every external action.

Exit evidence: verified inbound/outbound pilot and no queued action after the tested stop condition takes effect.

## Phase 5: Remaining channels

- [ ] 5.1 LinkedIn: approved publishing/engagement and separately approved Lead Sync.
- [ ] 5.2 Google Business Profile: verified locations and supported posts/reviews/performance.
- [ ] 5.3 YouTube: authorized uploads, visibility, processing, quota, and supported analytics.
- [ ] 5.4 Threads: authorized content, supported replies, and insights.
- [ ] 5.5 Pinterest: production access, Pins/boards, visibility, and supported analytics.
- [ ] 5.6 X: authorized capabilities, usage budgets, cost limits, and supported fallback.
- [ ] 5.7 Telegram: new Chat-owned Bot API adapter/transport contract, bot/channel rights, webhook receipts, and recipient eligibility. Preserve existing account-session polling.
- [ ] 5.8 For each channel, test OAuth, account binding, callbacks, formats, limits, revoke/disconnect, and tenant isolation.
- [ ] 5.9 Record unavailable features accurately and provide supported manual/import workflows.

Exit evidence: per-channel capability records and live evidence for every feature marked enabled.
TikTok remains excluded. No channel is complete merely because its connector settings screen exists.

## Phase 6: Attribution and operational readiness

- [ ] 6.1 Add consent-aware touchpoints, source mapping, spend imports, windows, and currency/timezone rules.
- [ ] 6.2 Reconcile provider conversions, CRM qualification/outcomes, and permitted Billing references.
- [ ] 6.3 Report cost per Lead/qualified Lead, response time, overdue follow-up, stale data, and attribution coverage.
- [ ] 6.4 Add permitted conversion feedback with deduplication and explicit tenant approval.
- [ ] 6.5 Complete tenant quotas, queue fairness, health, dead-letter review, and operational alerts.
- [ ] 6.6 Verify tenant backup/restore, retention, redaction, credential rotation, and private file access.
- [ ] 6.7 Run browser acceptance for list/Show/upsert, all applicable buttons, responsive widths, and keyboard access.
- [ ] 6.8 Complete automated checks, migration upgrade evidence, client pilot, and operational documentation.
- [ ] 6.9 Record deployment separately after explicit release authorization.
- [ ] 6.10 Add optional minimized Ecommerce, TConnect, and Sportsclub source adapters only after their owner backlog and consent gates pass.

Exit evidence: reconciled reports, tenant recovery drill, operational review, and a complete approved client journey.

## Deferred scope

- Separate Super Admin app for audited cross-client management.
- Advanced visual workflow builder after bounded templates prove useful.
- AI assistance through Zetro with explicit grants and action confirmation.
- Full advertisement creation and automatic budget/optimization actions after separate planning.

## Evidence log

### 2026-10-23 Phase 0 planning reconciliation

- Reviewed CRM, Core, Sites, Mail, Chat, Platform, Billing, Ecommerce, TConnect, Sportsclub, Frappe, and Zetro documentation and relevant source surfaces.
- Replaced planned CRM Campaign CRUD with a Marketing lookup/reference and generic CRM Consent with sales/service contact policy.
- Preserved existing CRM Contact Preferences, Sites SQLite/D1 intake, Ecommerce promotions, TConnect/Sportsclub business records, and Frappe transfer scope.
- Corrected Telegram planning to reflect existing account-session polling and a separate future Chat-owned Bot API adapter.
- Recorded SMTP shared-fallback risk, missing email safety contracts, source-aware Frappe export gate, and no-write Zetro runtime constraints.
- Added owner-specific implementation backlog and Phase 0 contract, gap, permission, dependency, readiness, and fixture specifications.
- No app source, migrations, runtime rules, package configuration, client connections, or live data changed in this planning task.
- `npm run check:component-docs`: passed, 33 owners with four required files each.
- `npm run test:component-docs`: passed, 2 tests.
- Prettier check: passed across the 30 updated owner documents.
- Marketing local file links: checked 10 targets with no missing files.
- Reconciliation scan found no remaining CRM Campaign-build or generic campaign/service Consent ownership wording in CRM/Marketing plans.
- `git diff --check` passed for the selected tracked documents. Marketing remains an untracked documentation directory in the existing working tree.

### 2026-10-23 documentation baseline

- Created the four component documents. No runtime code or package configuration was added.
- `npm run check:component-docs`: passed for 33 component owners, with four required files each.
- `npm run test:component-docs`: passed, 2 tests.
- Prettier check: passed for all four Marketing Markdown files.
- No API, database, browser, provider, email delivery, or deployment verification is claimed.

For later work, record phase/task, command or live scenario, tenant fixtures, date, result, and remaining limitation.
Never store credentials, recipient lists, or private message content in this evidence log.

## Local implementation and verification log

### 23-10-2026: Phase 1 foundation, local work only

The user resumed local implementation after stopping cloud deployment.
No new commit, push, version bump, cloud operation, or existing customer migration was performed during this local continuation.
Unrelated CRM, Frappe, Platform, and other working-tree changes were preserved.

Implemented source:

- Tenant Marketing registration, opt-in activation, permission seeds, additive migrations, and Platform menu composition.
- Separate tenant databases, saved default-company context, creator-owned brands, and an explicit manage-all grant.
- Brands, campaigns, capture forms, and connection setup with required validation, audited status changes, and revision checks.
- Shared CRM-style list, Show, upsert, relationship lookups, status filters, pagination, direct links, and browser refresh state.
- Campaign tracking identity and inactive duplication. Duplication does not authorize publication or sending.
- Google OAuth with PKCE, session-bound single-use state, verified channel selection, encrypted grants, account claims, and local disconnect.
- Public capture bindings for verified tenant domains, source validation, bounded payloads, notice evidence, and abuse limits.
- Strict JSON import preview and resumable results. Privacy consent remains separate from promotional consent.
- Durable submission storage before queue enqueue. Queue payloads contain references, trusted tenant identity, and company scope.
- Platform handoff processor, expired-job recovery, and rotating pending scans. A revoked actor cannot permanently block later pending records.
- CRM-owned canonical Lead intake, stable source receipts, review-only identity, assignment, and one transactional follow-up task.
- CRM Lead list and Show with a link to the assigned follow-up task. No automatic Contact merge or Enquiry/Frappe export.
- Sites-owned public capture rendering and durable SQLite/D1 forwarding. Existing enquiry ownership and source receipts remain unchanged.
- Framework request telemetry omits query values. Shared Tailwind scanning includes Marketing source.

Local evidence:

- Disposable MariaDB tests ran against two separate databases and removed only the verified disposable database names.
- Tested persisted records, company/brand scope, tenant swaps, foreign identifiers, denied grants, and strict forged payload rejection.
- Tested duplicate source replay, changed-payload conflict, pending intent after enqueue failure, and one CRM Lead/follow-up result.
- Verified Marketing intake created no CRM Enquiry or Frappe sync queue row.
- Tested OAuth session mismatch, callback replay, unverified account selection, encrypted storage, and disconnect with a simulated provider.
- Tested public origin rejection, token tampering, unavailable tenant context, inactive parent, duplicate receipt, and stale-edit conflict.
- Eight focused Sites tests passed for SQLite/D1 intake, durable forwarding, retry, safe rendering, forged scope/origin rejection, and Worker scheduled execution context.
- Framework query-redaction and Marketing desk-route regression tests passed.
- Cross-tenant provider account collisions and another tenant's release attempt were rejected in a disposable registry fixture.
- Full `npm run check` passed: component documentation, cleanup, boundaries, add-ons, synchronized Docs, 113 typecheck/build prerequisite tasks, and 59 lint tasks.
- Docs synchronization verified 574 pages across 29 groups. Added references cover the new Marketing and CRM Lead modules.
- Dependency layout passed. The Git HEAD remained `37310270` throughout this local continuation.
- Marketing, CRM, Platform, and Sites API/web typechecks passed at the recorded checks.
- Marketing, CRM, Sites, Framework, and Platform API lint passed. Platform web lint passed after the Lead render composition correction.
- Marketing, CRM, Sites, and Platform API builds and the Platform web production build passed locally.
- Module boundary and root dependency-layout checks passed.
- The Chrome fixture journey exercised the real Brand workspace against its disposable database API: validation, create, Show, refresh, Edit, Cancel, and a 390-pixel viewport without document overflow.

Coverage limits and remaining Phase 1 acceptance:

- The browser fixture is not a signed Platform-login or entitlement-activation test. Verify the complete authenticated desk separately.
- Repeat browser acceptance across Campaign, Capture, Connection, Submission, and CRM Lead workflows and configured tenant branding.
- Complete authorized export, advanced column controls, safe bulk actions, and retention/redaction acceptance under 1.4.
- Complete configurable import mapping and duplicate decisions under 1.8.
- Complete Core identity match review and CRM qualification/link decisions under 1.10.
- Complete the effective promotional eligibility contract across Marketing consent, CRM restrictions, and Mail suppression under 1.14.
- No promotional execution path is enabled. Do not interpret capture consent or imported data as permission to send campaigns.
- Complete full Platform queue restart/activation tests, browser tenant switching, and tenant suspension/revocation race tests under 1.2 and 1.11.
- Google live authorization, refresh/revocation policy, key rotation, and actual provider capability pilots remain unverified.
- Other social connectors and email campaign transport belong to their planned later phases. Setup records do not establish live connections.
- Public capture through a Sites proxy shares the proxy source-IP quota. Review this before client rollout.
- Existing customer migrations, tenant enablement, live credentials, remote D1 migration, cloud deployment, commit, and push were not performed.

Keep Phase 1 unchecked until its broader exit gates pass. Source presence and a successful build do not close those gates.

### 23-10-2026: Local app-loader and tenant desk wiring

Added Marketing to the App Catalog stack type, validation, and selection control.
The tenant desk checks Marketing activation for direct routes and uses the CRM sidebar branding treatment.
Platform health lists all five public Marketing module keys.
Loader regression tests cover opt-in activation, launcher selection, catalog validation, and all five menu destinations.

Enabled only the local development CODEXSUN tenant after verified SQL backups of its tenant database and local registry.
Backup dumps, SHA256 checksums, before/after metadata, and preservation assertions are under the ignored local directory
`dist/.cache/codexsun-marketing-loader-backup-1792758599585`.
Ran additive Marketing and CRM Lead migrations and permission seeds through public owner exports.
Added audited tenant exceptions for Marketing and the already enabled CRM dependency.
Existing enabled modules, landing app, non-Marketing module settings, and checked CRM/Core/user row counts stayed unchanged.
The other local tenant registry metadata stayed unchanged. No business sample records were created.

Signed-session checks used the actual local Platform frontend and API with the CODEXSUN tenant admin session:

- Application overview displayed Marketing and the Apps menu included Marketing.
- All five sidebar routes opened their own lists with the shared header, filters, and pagination.
- Brand, Campaign, Capture, and Connection upsert forms opened. Submission capture and import dialogs opened.
- Forms and dialogs were closed without creating customer data or initiating provider authorization.
- Authenticated list requests succeeded for all five Marketing entities and CRM Leads.
- Reloading the Connections URL preserved the signed session and selected workspace. Authenticated list requests then passed again.
- The running local health endpoint reported all five Marketing modules.
- Marketing/Platform API and Platform web typechecks passed. Focused loader/navigation tests, lint, and module boundaries passed.
- Platform web production build passed, with existing bundle-size and HRMS import warnings. Component documentation and synchronized Docs checks passed.

The prior disposable browser test remains the write/Show/Edit evidence.
This real tenant preview does not prove every signed-session write, browser tenant-switch race, live provider, or queue restart case.
A transient local API watcher restart required a list refresh during verification.
No commit, push, version bump, or deployment was performed for this wiring.

Next Phase 1 work: complete task 1.14 with Marketing-owned promotional evidence, CRM restriction checks, and Mail safety checks.
Missing or unavailable authority must deny promotional eligibility. Continue lifecycle/import/identity and queue acceptance afterward.
Keep external campaign delivery disabled until its execution and readiness gates pass.

### 23-10-2026: Promotional email eligibility and separate upsert pages

Implemented an append-only consent leaf with company/brand scope, explicit evidence, notice version, expiry, request replay, withdrawal, and stale-grant rejection.
CRM owns append-only email restrictions. Mail owns append-only complaint, hard-bounce, and delivery-policy suppression.
A public Core lookup returns all recipient identity IDs without merging records or exposing contact details.
The injected eligibility contract reads all authorities and fails closed on missing data, disabled access, permission denial, or owner failure.
A withdrawal during the check invalidates its result. Consent is read again before returning the assessment.
Eligibility does not enqueue or send email. Other channels and non-promotional purposes are rejected.

Added the Consents sidebar page, list, standalone evidence form, immutable Show/activity, and fresh eligibility action.
Brand, Campaign, Capture, Connection, and Submission upserts now render separate page views using CRM-style shared primitives.
The list is absent during form mode. Edit/create URL state and Cancel behavior remain available.
All six Marketing lists put Filters and Columns beside search. Column selections use URL state and restore through navigation.

Applied only additive consent/restriction/suppression migrations and their new permission seeds to local development CODEXSUN.
Verified full local registry/tenant SQL backups and SHA256 manifests are stored under ignored root output:
`dist/.cache/codexsun-marketing-consent-backup-1792760438027`.
Checked business row counts, module settings, enabled modules, landing settings, and other tenant registry metadata stayed unchanged.
The local Mail entitlement remains absent. A missing Mail authority must block eligibility until explicitly configured.
No customer sample records, new provider grant, external send, commit, push, version change, or deployment was created.

Local database and browser evidence:

- The disposable two-database suite passed with persisted consent, exact request replay, changed-key conflict, expiry, withdrawal, later re-consent, and stale grant rejection.
- CRM do-not-contact and legacy preference review blocked eligibility. Core identities were checked without a merge.
- Mail complaint and hard-bounce blocks survived new promotional grants. Missing CRM/Mail authority blocked checks.
- A withdrawal between owner checks blocked the result. Forged scope fields, denied grants, foreign identifiers, company changes, and another brand owner were rejected.
- The Chrome fixture passed standalone Brand/consent form validation, persisted create, Show, reload, fresh eligibility, uncached allow results, Edit, Cancel, and a 390-pixel viewport.
- The signed local CODEXSUN desk displayed the Consents list/form, required-field errors, and CRM-style search-toolbar Filters and Columns.

Remaining limits:

- Email is the implemented eligibility channel. Other social/message authorities remain in their planned phases.
- Provider feedback verification, public unsubscribe tokens, approved suppression release, campaign dispatch, and complete batch suspension races remain open.
- A manual evidence reference records an authorized operator assertion. It does not prove client notice approval or live provider permission.
- Complete the broader lifecycle, authorized exports, import mapping/duplicate decisions, identity review, and queue restart gates before closing Phase 1.

Final checks for the consent/page continuation:

- Typecheck passed for Marketing API/Web, CRM API, Mail API, Core API, and Platform API/Web.
- Lint passed for the same affected owners. Module boundaries passed for Marketing, CRM, Mail, Core, and Platform.
- Focused loader/navigation regression tests passed. Component-document checks/tests and root dependency layout passed.
- Production builds passed for Marketing API/Web, CRM API, Mail API, Core API, and Platform API/Web.
- Platform web build warnings concern existing bundle size and the HRMS static/dynamic import combination.
- Docs synchronization and coverage include the three new owner module references.
- The two-database suite also verifies exact UTC evidence/audit timestamps and a grant that expired one second before the check.
- Repositories write UTC strings and UTC audit values explicitly, avoiding driver-local Date conversion. Existing applied migration steps were not rewritten.
- Inactive brands reject grants but still accept authorized withdrawals.
- Signed-session checks opened all six standalone forms without a list behind them. Brand column selection survived a full reload through URL state.
- Real customer business records were not used for the browser write journey. Its generated screenshots use disposable test data under root `dist`.
- Full monorepo `npm run check`, live provider feedback, public unsubscribe, campaign dispatch, browser tenant switching, and full batch suspension tests were not repeated or completed for this slice.

Next Phase 1 priority: controlled import mapping and explicit duplicate/provenance decisions under 1.8, followed by remaining identity and lifecycle acceptance.
