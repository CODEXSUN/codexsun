# Global Sales and Service CRM Plan

Repository source: `apps/crm/agent/PLAN.md`

Source SHA-256 (LF line endings): `3e3f7ebc875436204ea24a1f9187ad3f47d9f491135ce0167f8daf8fdbc6062f`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

````markdown
# Global Sales and Service CRM Plan

## Product Goal

Build one local, tenant-isolated CRM for businesses that sell products, deliver
projects, install equipment, provide repair, or maintain customer assets.

CRM manages customer-facing work from first contact through follow-up. The local
tenant database is the source of truth for CRM records. Billing remains the
source of truth for invoices, receipts, payments, and balances.

## Current Implementation Baseline

SOP/Duty adapter bindings were updated on 17-10-2026.
See [the field contract](../../frappe/agent/CRM-DUTY-FIELD-MAPPING.md) for frequency and Department resolution,
assignment reuse, preserved report evidence, local-only fields, and remaining remote schema limits.
The isolated Duty API/database E2E passes with mocked remote responses.
Live delivery and readback passed against logicx.tmnext.in on 17-10-2026 for all four supported frequencies.
The live test invokes the worker directly. Platform authentication, queue relay scheduling, and browser/mobile acceptance remain separate gates.

Repository source rechecked on 2026-10-16 for local Enquiry and Call Log
persistence, legacy Frappe integration, and existing Task and Duty modules.
This source review does not verify live database or mobile behavior.

- Enquiries, call logs, call-log comments, and enquiry activities have local
  tenant-database tables and API routes.
- The Flutter app reads and writes through the Platform API. It creates enquiries,
  comments, and work updates, and can upload selected device calls with comments.
- Mobile call-log uploads use a source reference for duplicate detection. Call-log
  comments do not have a retry key, so a repeated request can add another comment.
- Enquiry and Call Log services save through their local repositories. Platform's
  legacy `crm.enquiry.frappe-sync` and `crm.call-log.frappe-sync` processors return
  `stopped`. Frappe import routes and processors remain registered in
  `apps/platform/api/src/app.ts`. Task 0.2 remains open until their removal.
- Enquiry reads return Local data, but the API keeps provider and remote-source
  contracts. Remove these leftovers when CRM becomes local-only.
- The Activities list currently reads enquiry activity rows. It is not yet a
  cross-module event history. The `task`, `sop`, `sop-item`, `duty-assignment`,
  and `duty-report` backend modules exist. Duty Assignment does not replace the
  planned general Assignment module.
- Source review does not prove persistence after restart or a complete mobile-to-
  server flow. Phase 0 must verify both with the running local database and app.

CRM writes must stay in the tenant database. The mobile app sends records to the
CRM API, which saves them locally. Enquiries may be explicitly imported from the
tenant's verified Frappe connection into local CRM; the import preserves source
serials, timestamps, mapped users, comments, and identity links. After import,
local CRM remains authoritative and no automatic enquiry export is allowed.
Call Logs remain outside this import scope. Published SOP Items, Duty Assignments,
and Duty Reports use the approved outbound queue described in
[DUTIES-SOP-PLAN.md](./DUTIES-SOP-PLAN.md). CRM reads these records locally.

## Product Shape

Use one CRM foundation with two separate workstreams.

```text
Sales:   Campaign → Lead → Qualification → Sales Enquiry → Sales Estimate when
         needed → Billing Quote when needed → Accepted Order → Sales Delivery
         Work when needed → Follow-up and Renewal

Service: Service Request → Eligibility and Diagnosis → Material Need when needed
         → Service Estimate when needed → Billing Quote when needed
         → Service Work when needed → Verification
         → Billing Follow-up → Resolved, Rework, or Renewal
```

Sales Enquiry is the active sales pursuit and pipeline record. Do not add a second
Opportunity record with the same purpose. The sales pipeline uses stages on the
Sales Enquiry. A lead may qualify directly into a Sales Enquiry.

Sales and Service share customer history and supporting modules. They keep
separate intake records, required fields, status values, and lifecycle rules.
Industry differences use versioned templates and tenant configuration for fields,
stages, checklists, and approval thresholds. Avoid branching the core lifecycle or
creating a separate CRM implementation for each industry.

## Ownership and Integration Boundaries

| Capability                                                                                           | Owner                                    | CRM relationship                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Customer, contact, organization, address, and user identity                                          | Core                                     | Use public lookups and stable public IDs.                                                                         |
| Product, unit, tax, and work-order type masters                                                      | Core                                     | Read through public contracts.                                                                                    |
| Customer quotation, accepted sales order, invoice, receipt, payment, tax, and balance                | Billing                                  | Create or read through Billing contracts. Never duplicate commercial or financial records.                        |
| Lead, Sales Enquiry, Service Request, campaign, customer asset history, and CRM activity             | CRM                                      | Store in tenant CRM tables and module-owned APIs.                                                                 |
| Sales Estimate and Service Estimate                                                                  | CRM                                      | Keep separate estimate records and rules. Keep vendor or purchase estimates separate.                             |
| CRM follow-up, assignment, tasks, calls, saved views, and CRM reports                                | CRM                                      | Store in CRM and enforce CRM permissions.                                                                         |
| Sales Delivery Work and Service Work Order, scheduling, dispatch, material request, and verification | CRM, until a dedicated owner exists      | Keep sales delivery and service execution as separate modules. Do not treat Core work-order types as work orders. |
| Stock, reservation, purchase, and material issue                                                     | Current inventory owner or Core contract | CRM records demand and reads fulfillment state. Do not alter stock directly.                                      |
| AI chat, provider settings, grants, approvals, and AI audit                                          | Zetro                                    | Add fixed CRM skills through Zetro's permission-aware tool pattern.                                               |

If a business record changes owner, migrate the schema, route, permission, public
contract, and tests together. A menu label alone does not transfer ownership.

## Core CRM Modules

| Module               | Owns                                                                           | Required behavior                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Customer 360         | Unified customer history                                                       | Shows permitted sales, service, quotation, work, calls, and follow-up records.                                      |
| Campaign             | Source, audience, dates, owner, targets, and measured spend                    | Creates leads and reports source conversion.                                                                        |
| Lead                 | Unqualified prospect, source identity, and qualification facts                 | Qualify, disqualify, merge, or convert to Sales Enquiry.                                                            |
| Sales Enquiry        | Confirmed need, pipeline stage, value, owner, close date, and outcome          | Progress through a sales pipeline with a next action.                                                               |
| Service Request      | Customer issue, location, asset, channel, priority, and owner                  | Progress through diagnosis, delivery, verification, and resolution.                                                 |
| Service Timeline     | User-authored diagnosis notes, customer updates, and decisions                 | Keep an ordered, permission-checked history linked to its Service Request. System state changes remain in Activity. |
| Sales Estimate       | Proposed sales scope, quantity, price basis, assumptions, and validity         | Create customer estimate revisions; hand approved versions to Billing for quotation.                                |
| Service Estimate     | Labor, parts, diagnosis, coverage, and service scope                           | Cost service work separately; preserve covered or no-charge decisions and approval evidence.                        |
| Sales Delivery Work  | Accepted sales scope requiring tracked delivery                                | Track milestones and acceptance; do not reuse service work states.                                                  |
| Service Work Order   | Authorized service execution for a request or agreement                        | Track visits, resources, labor, materials, checklists, and completion evidence.                                     |
| Service Agreement    | Versioned recurring service commitment                                         | Generate planned Service Requests only from active, approved agreement versions.                                    |
| Entitlement          | Coverage limits for a customer, asset, product, or location                    | Check eligibility and consumption without changing historical request snapshots.                                    |
| SLA Policy           | Response and resolution targets, calendars, pauses, and escalations            | Snapshot the applied policy and track warnings, pauses, breaches, and reasons.                                      |
| Incident Template    | Reusable diagnostic, safety, task, and checklist guidance                      | Version templates and snapshot the version used on each request or work order.                                      |
| Resource             | Service worker, skills, territory, availability, and capacity                  | Expose scheduling data through permission-checked resource contracts.                                               |
| Booking              | Time window and assigned resource for a work record                            | Track booking changes separately from work-order state.                                                             |
| Material Request     | Required parts or materials for a work record                                  | Track demand and fulfillment reference; Inventory owns stock and issue.                                             |
| Verification         | Required checks and customer acceptance for completed work                     | Record checklist version, evidence, result, verifier, and rework link.                                              |
| Service Outcome      | Resolution, closure, cancellation, or rework decision                          | Require a permitted outcome and reason; preserve the closed request history.                                        |
| Collection Follow-up | Promise, owner, next action, and reminder for an unpaid balance                | Read Billing status; never post or allocate money.                                                                  |
| Assignment           | Owner, team, queue, territory, and reassignment history                        | Apply explicit rules and retain allocation history.                                                                 |
| SOP                  | Procedure identity, purpose, ownership, lifecycle, and revision policy         | Own reusable procedures and their published revisions inside CRM.                                                   |
| SOP Item             | Ordered instruction, frequency, department, and evidence guidance              | Own versioned steps; assignments and reports reference a stable published item revision.                            |
| Duty Assignment      | SOP Item allocation to a CRM user or team, order, active dates, and recurrence | Provide each employee's current duty list and retain assignment history.                                            |
| Duty Report          | A user's completion report for one assigned SOP Item                           | Store report date, actions, author, timestamps, and immutable SOP revision context.                                 |
| Duty Reporting       | Searchable report history and completion measures                              | Query Duty Reports with date, user, SOP, department, and frequency filters under the same CRM permissions.          |
| Activity             | Immutable business events                                                      | Store actor, action, record, timestamp, and safe summary.                                                           |
| Task                 | Follow-up, due date, owner, priority, recurrence, and completion               | Link to a supported CRM record.                                                                                     |
| Call Log             | Manually selected mobile call and local comments                               | Use idempotency keys and link to a customer or supported CRM record.                                                |
| Customer Asset       | Installed equipment and service identity                                       | Track serial, location, model, warranty, and service history.                                                       |
| Attachment           | Business documents and evidence metadata                                       | Enforce tenant scope, record access, retention, and audit.                                                          |
| Consent              | CRM campaign and service communication purpose and channel preference          | Track source, time, expiry, and withdrawal. Core remains the owner of Contact identity.                             |
| Saved View           | Filters, columns, sorting, and sharing                                         | Store tenant-scoped preferences with owner and permissions.                                                         |
| Notification         | Assignment and due-work alerts                                                 | Create from persisted events and permitted recipients.                                                              |
| Report               | Sales and Service operational measures                                         | Query source modules with the same tenant and permission scope as record views.                                     |

### Shared Record Rules

- Keep Leads separate from Core Contacts until identity and qualification rules
  allow a deliberate conversion or match. Never create duplicate customer records
  merely because a lead arrived through another campaign or channel.
- Use stable public IDs, tenant scope, actor, timestamps, and source references on
  every record. Validate related-record access in the owning API.
- Preserve lifecycle history as events or immutable revisions. Correct mistakes
  with an audited correction or reversal, not by rewriting history.
- Define merge, archive, retention, deletion, export, and consent withdrawal
  behavior before broad imports or customer-facing rollout.
- Treat saved views, reports, search results, attachments, and exports as
  permission-checked data paths, not presentation-only features.

## Sales Lifecycle

```text
Campaign → Lead → Qualify or Disqualify → Sales Enquiry
→ Sales Estimate when needed → Billing Quote when needed → Accepted Order
→ Sales Delivery Work when needed
→ Won, Lost, or Follow-up → Renewal
```

1. Capture a source, consent state, customer identity, and import key with each
   lead.
2. Record qualification facts and a clear reason when a lead is disqualified.
3. Create one Sales Enquiry when a lead has a confirmed need.
4. Track stage, expected value, probability, close date, competitors, and next
   action on the Sales Enquiry.
5. Create a Sales Estimate when scope, quantity, assumptions, or price needs review.
6. Create the customer-facing Quote in Billing from an approved Sales Estimate or
   Sales Enquiry using a fixed Billing contract.
7. Preserve sent quote revisions. Revisions do not overwrite the customer's
   earlier offer.
8. Treat an accepted quote or order as the Sales win event. Do not wait for work
   completion to mark the sale won.
9. Create delivery work only when the accepted scope needs tracked execution.
10. Keep delivery progress and payment collection visible after the Sales Enquiry
    is won.
11. Require a reason and future review date for lost or deferred enquiries.
12. Create activity and audit records for each lifecycle change.

An accepted Billing Quote creates or links to one Billing-owned order using its
public contract. CRM keeps the Sales Enquiry and delivery links; it does not create
a competing order or financial document.

### Sales Measures

- Leads by source, campaign, territory, and customer segment.
- Qualification, disqualification, and conversion rates.
- Pipeline value, weighted value, stage age, and close forecast.
- Estimate turnaround, quote acceptance, revision, discount, and expiry.
- Sales cycle time, won value, lost reasons, and renewal rate.
- Follow-ups due, overdue, and missing a next action.

## Service Lifecycle

```text
Service Request → Check Coverage and SLA → Diagnose
→ Material Request when needed → Service Estimate when needed
→ Billing Quote when needed → Accepted Scope → Schedule and Execute Service Work
→ Verify
→ Resolved or Rework → Billing Follow-up → Renewal
```

1. Require customer, reported need, priority, service location, and contact
   channel.
2. Link a customer asset when the request concerns installed equipment.
3. Check active warranty, service agreement, entitlement, and SLA before
   promising response or resolution times.
4. Track diagnosis, customer updates, decisions, and next action on the service
   timeline.
5. Use incident templates for standard tasks, materials, safety checks, skills,
   and expected duration.
6. Create a CRM Material Request for demand. Inventory or Core owns reservation,
   purchase, issue, and stock balance.
7. Create a Service Estimate when scope, labor, or materials need costing. Keep
   coverage decisions and customer-payable amounts explicit.
8. Create a customer Quote in Billing when customer approval or payment terms are
   required. Free or covered work may bypass a quote with a recorded reason.
9. Create a Service Work Order only after entitlement, approval, or other required
   authorization passes. A Service Request may need no work order when guidance
   resolves it remotely.
10. Track scheduling separately from work status. A booking does not mean work
    has started or finished.
11. Track travel, time, materials used, checklist results, attachments, and
    customer acceptance on the work record.
12. Close operational work only after verification passes. Keep collection follow-
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
- Allow manual assignment f
````
