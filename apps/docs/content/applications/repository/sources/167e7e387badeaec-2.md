# Global Sales and Service CRM Plan

Repository source: `apps/crm/agent/PLAN.md`

Source SHA-256 (LF line endings): `9c1ef01c8215b9c0da5d577d4b75e4c6f13a3e7adcdd1770d4feb675bdc8fdcc`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
y after verification passes. Keep collection follow-
    up open when Billing still reports an amount due.
13. A failed verification creates a rework cycle with a reason and owner.
14. A warranty or repeat issue can create a new request linked to prior service
    history. Do not reopen a closed request by changing its history.
15. Create activity and audit records for each lifecycle change.

### Service Measures

- Requests by type, channel, asset, location, priority, and owner.
- First response, diagnosis, estimate, quote, schedule, and resolution time.
- SLA warning, pause, breach, and escalation counts.
- Material readiness, schedule adherence, utilization, and repeat visits.
- First-time fix, verification pass, rework, and warranty rates.
- Outstanding collection follow-ups from Billing balances.
- Agreement renewal and recurring work completion.

## Shared Commercial Rules

1. Sales Estimate, Service Estimate, Billing Quote, and accepted Billing Order
   are distinct records. CRM owns the first two as scope and cost proposals;
   Billing owns customer-facing quotations and orders.
2. Existing vendor estimates remain procurement or enquiry-cost records. Do not
   reuse them as customer estimates. Sales and Service estimates also remain
   separate because their costing and approval rules differ.
3. Read products, units, tax, currency, and work-order types from their owning
   module contracts.
4. Snapshot approved item, price, tax, discount, and terms on each sent document.
5. Make sent quote revisions immutable. Accept one revision for an order.
6. Record scope or price changes as a change request and a new estimate or quote
   revision. A new estimate revision is required when scope or cost changes before
   the quote is issued.
7. Billing owns invoices, receipts, payment allocations, and posted balances.
8. CRM collection follow-up stores promises and next actions. It does not post
   payments or decide that an invoice is settled.
9. Separate sale status, work status, verification status, and payment status.
10. Do not use a single status field to imply both work completion and payment.

### Lifecycle and Handoff Rules

- Keep lead qualification, Sales Enquiry outcome, quote decision, order state,
  delivery state, Service Request state, work state, verification, and payment as
  separate lifecycles with explicit transitions and terminal outcomes.
- Every handoff records the source record, destination record, actor, timestamp,
  and outcome. Retries must be idempotent and must not create duplicate orders,
  requests, work, or follow-ups.
- Require reason codes for disqualification, loss, cancellation, quote rejection,
  service closure without work, SLA pause, no-show, failed verification, and
  rework. Keep free-text explanation where a code alone is insufficient.
- Define which transitions require approval, who may approve, and whether the
  approver can be the initiating user before implementation.

## Service Terms and Scheduling

### Service Agreement and Entitlement

- Define covered customers, contacts, assets, products, channels, locations, and
  dates.
- Track included cases or hours, usage, remaining coverage, expiry, suspension,
  cancellation, and renewal.
- Define response and resolution targets with business calendars, time zones,
  holidays, pause rules, warnings, and escalation paths.
- Snapshot the terms applied to each Service Request. Later agreement edits must
  not change historical commitments.
- Recurring agreements create planned work from a versioned schedule. Each
  generated request or work item uses an idempotency key.

### Scheduling and Work

- Track resource skills, working hours, territory, leave, capacity, service
  location, travel buffer, and customer time window.
- Allow manual assignment first. Add optimization only after schedule data proves
  accurate.
- Keep resource booking state separate from work-order state.
- Record schedule changes, dispatch, start, pause, completion, cancellation, and
  no-show reasons.
- Support partial completion, multiple visits, multiple assets, and split work.
- Store material demand separately from inventory reservation and issue.

## Data and Record Connections

1. A customer has many leads, Sales Enquiries, Service Requests, assets, and
   communication records.
2. A lead may create one Sales Enquiry. Preserve the source lead and its history.
3. A Sales Enquiry may have Sales Estimates, Billing quotes, orders, Sales Delivery
   Work, tasks,
   activities, calls, attachments, and follow-ups.
4. A Service Request may have diagnosis entries, material requests, Service
   Estimates, Billing quotes, Service Work Orders, tasks, activities, calls,
   attachments, and follow-ups.
5. Customer assets link to customer, service location, warranty, agreement, and
   completed work history.
6. A quote may have many revisions. One accepted revision links to one Billing-
   owned order. Billing enforces one order per accepted revision unless its
   contract explicitly supports split orders.
7. Accepted sales orders may create multiple Sales Delivery Work records; service
   agreements may create Service Requests and Service Work Orders from a versioned
   schedule.
8. A Service Work Order may have multiple bookings, tasks, material requests, visits,
   verification attempts, and attachments.
9. Every relationship uses a fixed public ID and is validated by the owner API.
10. Customer 360 composes records through permitted APIs. It does not copy them
    into a shadow table.

## Zetro CRM Agent

Zetro provides read and drafting support through fixed CRM contracts. The model
does not own CRM permissions or perform business mutations.

### Initial Skills

1. Summarize permitted Customer 360, Sales Enquiry, or Service Request history.
2. List the signed user's assigned work and next actions.
3. Explain overdue tasks, SLA risks, unresolved verification, and collection
   follow-up.
4. Summarize pipeline and service metrics within the user's scope.
5. Draft qualification questions, service diagnosis summaries, quote messages,
   and follow-up notes for user review.
6. Suggest missing facts, next steps, incident templates, and verification checks.

### Agent Controls

1. The backend checks tenant, signed user, role grant, module permission, and
   record scope for every skill.
2. Each skill calls a named module API. The model cannot generate SQL or choose a
   tenant, table, or arbitrary endpoint.
3. Require user confirmation for every create, edit, assignment, message, quote,
   approval, work transition, or verification decision.
4. Never allow the agent to post payment, change price, approve a quote, send a
   customer message, close work, or alter verification results.
5. Treat prompts, attachments, and record text as untrusted data.
6. Audit prompt, model and rule version, selected skill, source record IDs,
   response, confirmation, and result.
7. Test authorization, source accuracy, prompt injection, denial, audit failure,
   and user correction for each skill.
8. Expand an agent skill only after measured quality meets an agreed target.

## Data Migration and Governance

1. Inventory current enquiries, vendor estimates, jobs, comments, activities,
   call logs, statuses, assignments, and links before schema changes.
2. Preserve record IDs, URLs, creators, timestamps, comments, and activity order.
3. Migrate current generic enquiries into Sales Enquiry with a reversible,
   tenant-by-tenant migration and a reconciliation report.
4. Do not migrate vendor estimates into customer estimates. Preserve their
   supplier and costing meaning.
5. Start Service Request with separate tables, APIs, permissions, and lifecycle.
6. Define duplicate, merge, conflict, import, archive, retention, and deletion
   rules before bulk loads.
7. Require import preview, field mapping, validation, duplicate review, and
   idempotency keys before records are written.
8. Track consent, communication purpose, attachment access, and retention.
9. Rehearse migration, reconciliation, backup, rollback, and access checks before
   production rollout.

## User Experience

1. Provide separate Sales and Service workspaces with shared Customer 360.
2. Show next action, owner, due date, status, and timeline on record pages.
3. Provide list, board, calendar, and timeline views only where each workflow
   needs them.
4. Provide mobile intake, call upload, assignment, task, schedule, work update,
   material, evidence, and verification flows.
5. Support poor connectivity with retry-safe writes and idempotency keys. Do not
   claim offline mode until local conflict handling is implemented.
6. Provide mobile duty lists, SOP instructions, completion reports, and the same
   authorized report history as web.
7. Keep search, filters, saved views, and exports tenant-scoped and permission-
   checked on the server.
8. Format calendar dates as `DD-MM-YYYY` and date-times as `DD-MM-YYYY HH:mm`.

## Delivery Plan

### Phase 0: Local Boundary and Product Contracts

1. Record current web, mobile, API, database, and queue behavior. Use the baseline
   above and update it with test evidence.
2. Remove Frappe provider switching, remote reads, imports, sync event creation,
   and sync workers from CRM routes and Platform CRM composition. Preserve existing
   local records and sync history during this cutover.
3. Run a local-only smoke flow for web and mobile enquiry, call-log, and comment
   actions with Frappe disabled. Confirm writes reach the tenant CRM database.
4. Confirm Sales Enquiry stages and Service Request outcomes.
5. Confirm Billing owns order creation and map its quote-to-order contract.
6. Map Core product and work-order type APIs, Billing quotation APIs, and
   Inventory material APIs.
7. Define permission roles, source IDs, audit events, and tenant migration rules.
8. Confirm which work and scheduling records CRM will own until a dedicated
   execution module exists.
9. Define global defaults and tenant-configurable stages, date and time zones,
   currency, units, consent, retention, and approval settings.

**Exit:** CRM uses only local tenant data, and each planned record has one owner,
one public contract, and one migration path.

### Phase 1: Stabilize Current CRM Foundation

1. Verify fresh migrations, upgrades, tenant isolation, and persistence after API
   restart for existing CRM records.
2. Complete local Enquiry, Activity, Task, Call Log, Assignment, and Customer 360
   contracts. Keep Activity history linked to any supported CRM record.
3. Make mobile writes retry-safe, including enquiry comments and call-log comments.
4. Preserve record links, IDs, creators, timestamps, comments, and activity order.
5. Preserve current vendor estimates and define their migration separately from
   Sales and Service Estimates.
6. Complete Service Contact Policy, Attachment, Saved View, Notification, and operational Report
   modules only where the current CRM workflow needs them.
7. Define SOP, SOP Item, Duty Assignment, Duty Report, and Duty Reporting
   boundaries and permissions in `DUTIES-SOP-PLAN.md` before implementation.
8. Reconcile current records and preserve existing user URLs.

**Exit:** Current CRM data survives upgrade and restart. Mobile and web use the
same local contracts. SOP and duty contracts have approved owners, lifecycle
rules, permissions, and migration order.

### Phase 2: Sales Intake

1. Add the CRM Lead module and a read-only Marketing Campaign reference contract.
2. Migrate Enquiry to Sales Enquiry without losing history.
3. Add qualification, pipeline stage, close reason, assignment, and next action.
4. Add sales lists, follow-up queues, and source conversion reports.

**Exit:** A team can track a lead through a reasoned Sales Enquiry outcome.

### Phase 3: Service Intake

1. Add Service Request, Customer Asset, Service Timeline, Service Agreement,
   Entitlement, SLA, and Service Outcome modules.
2. Add coverage checks, diagnosis, customer updates, and escalation timers.
3. Add service lists, queues, asset history, and SLA reports.

**Exit:** A team can receive, assign, diagnose, and resolve a covered or uncovered
service request with a complete history.

### Phase 4: Commercial Documents

1. Add separate Sales Estimate and Service Estimate modules with typed source
   links, revisions, product/price lookups, and approval rules.
2. Connect approved estimates and Sales or Service sources to Billing Quotes
   through one stable Billing contract.
3. Add sent revisions, approvals, acceptance, rejection, expiry, and scope change.
4. Connect accepted quotes to Billing orders where supported.

**Exit:** Every customer offer has an approved source, immutable sent revision,
and traceable acceptance.

### Phase 5: Delivery and Service Execution

1. Add separate Sales Delivery Work and Service Work Order modules. Share only
   assignment, schedule, activity, and attachment primitives where their contracts
   truly match.
2. Add Resource Schedule, Material Request, and Verification modules.
3. Integrate with Inventory or Core for reservation, availability, and material
   issue.
4. Add manual scheduling, resource skills, capacity, travel, and schedule history.
5. Add work completion, partial delivery, no-show, cancellation, and rework.

**Exit:** Accepted sales scope and authorized service scope can be scheduled,
executed, and verified with distinct work states and clear material status.

### Phase 6: Collections, Renewals, and Reporting

1. Add CRM Collection Follow-up backed by Billing balance reads.
2. Add recurring agreement generation with idempotency and approval controls.
3. Add Sales and Service dashboards from source-module queries.
4. Reconcile report totals with underlying owner records.

**Exit:** Teams can track operational follow-up and renewals without duplicating
financial records.

### Phase 7: Zetro CRM Agent

1. Add read-only CRM skills first.
2. Add record summaries and draft-only assistance next.
3. Add approvals, audit review, quality measurement, and feedback.
4. Release each skill only after permission and evaluation checks pass.

**Exit:** Zetro helps users find and prepare work within current permissions, with
every result traceable to source records.

## Release Gates

1. Test fresh migrations and upgrades for every affected tenant database.
2. Test role permissions, record ownership, tenant isolation, and public IDs.
3. Test lifecycle transitions and rejected transitions for Sales and Service.
4. Test price, tax, currency, quote revision, approval, and immutable sent data.
5. Prove CRM cannot write Billing payment or Inventory stock records directly.
6. Test SLA calendars, entitlement limits, scheduling capacity, material state,
   work completion, verification, and rework.
7. Test mobile retries, duplicate submissions, and data persistence after restart.
8. Test Zetro authorization, source accuracy, prompt injection, denial, audit
   failure, and user confirmation.
9. Reconcile imports, migrations, dashboards, and financial summaries against the
   owning databases.
10. Run formatting, typecheck, focused tests, module boundaries, and composed
    web and mobile flows.

## Product References

- [Sales lifecycle](https://learn.microsoft.com/en-us/dynamics365/sales/nurture-sales-from-lead-order-sales)
- [Quote lifecycle](https://learn.microsoft.com/en-us/dynamics365/sales/create-edit-quote-sales)
- [Service SLAs](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/overview-service-level-agreements)
- [Service entitlements](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-entitlement-define-support-terms-customer)
- [Service work orders](https://learn.microsoft.com/en-us/dynamics365/field-service/field-service-architecture)
- [Recurring service agreements](https://learn.microsoft.com/en-us/dynamics365/field-service/agreements-overview)
```
