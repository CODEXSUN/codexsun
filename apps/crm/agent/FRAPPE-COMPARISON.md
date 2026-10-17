# LogicX Frappe and CODEXSUN CRM comparison

## Reference and review scope

For Frappe work, use [CODEXSUN/logicx-biz](https://github.com/CODEXSUN/logicx-biz.git).
The reviewed source is `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype`.
Snapshot: `02826403ed87903f3eb7f4c57855eb2c829a8803`, reviewed on 17-10-2026.
The local reference working tree was clean during collection.

The [complete source catalogue](../../frappe/agent/LOGICX-CRM-REFERENCE.md)
records all 25 DocTypes, declared fields, field rules, permissions, Python functions,
and JavaScript form behavior. The folder also contains HR and infrastructure records.
This review does not treat every record as a CRM-owned feature.

This is the custom LogicX app, not the separate upstream Frappe CRM product.
DocType JSON describes source metadata. It does not prove a live site's SQL schema.
Database Custom Fields, Property Setters, Server Scripts, and installed hooks need separate site verification.

## Current ownership

CRM owns local tenant records. Core owns contact and user identity.
Billing owns financial documents and balances. Frappe owns external connection and transfer adapters.
The source reference does not authorize a new integration or weaken backend permission checks.
Only the approved SOP and Duty outbound flow is in scope for ongoing CRM transfer.
Enquiry and Call Log remain local-only under the current product contract.

## DocType comparison

| LogicX DocType          | CODEXSUN source counterpart                                              | Comparison and remaining work                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enquiry                 | `api/src/modules/enquiry`, `crm_enquiries`                               | Local enquiry intake, contact reference, assignment, dates, status, priority, and outcome. LogicX links Mobile Contact and Mobile Contact Customer. CRM uses Core contact identity and captured contact fields. No identity-preserving one-to-one table copy. |
| Enquiry Group           | `list-in`, `crm_enquiry_lists`                                           | Equivalent grouping purpose. Map persisted identities when handling approved legacy data.                                                                                                                                                                     |
| Enquiry Status          | `status`, `crm_enquiry_statuses`                                         | LogicX groups statuses into New, Pending, Hold, Closed. CRM has lifecycle codes and closure checks. Define a status mapping before any approved conversion.                                                                                                   |
| Enquiry Closure Request | `closure`, `crm_closure_requests`                                        | Request, review, and audit fields exist locally. CRM approval applies the terminal status through a controlled flow.                                                                                                                                          |
| Enquiry Message         | `enquiry`, `crm_enquiry_comments`                                        | LogicX declares a child DocType with Comment/Reply mode and a parent-message link. CRM stores explicit enquiry and parent-comment relations. Preserve threading when interpreting old data.                                                                   |
| Job Type                | Enquiry and Task modules                                                 | LogicX uses a DocType master with Dynamic Links. CRM uses concrete module routes and tables. Do not introduce a generic CRUD engine to imitate Dynamic Links.                                                                                                 |
| Job Activity Type       | Module-owned activity event contracts                                    | LogicX identifies the source document type. CRM has no matching master in its source inventory.                                                                                                                                                               |
| Job Activity            | `crm_enquiry_activity`, `crm_task_activity`                              | LogicX supports multiple job types and source-record links. CRM keeps separate activity stores. A general cross-record Activity contract remains planned.                                                                                                     |
| Job Execution           | `crm_enquiry_jobs`, `crm_task_jobs`                                      | Both track running/completed work. LogicX computes hours and employee cost and handles overnight times. CRM uses local work APIs. Confirm rate, rounding, and date semantics before claiming parity.                                                          |
| Job Comments            | Enquiry and Task comment APIs                                            | LogicX comments can reference different job types and open WhatsApp from the form. CRM comments are owner-specific. A UI messaging shortcut does not authorize automated outbound messaging.                                                                  |
| Job Location            | `enquiry-location`, `crm_enquiry_locations`                              | Local repeated enquiry captures exist. LogicX supports Dynamic Links, generated map data, URL, and activity. Generic Task location parity is not established.                                                                                                 |
| Job Attachment          | Planned Attachment contract                                              | LogicX has upload, photo preview, employee/date/time, and activity behavior. CRM's contact-document metadata is not proof of a general authorized job attachment workflow.                                                                                    |
| Job Estimate            | `crm_enquiry_estimates`                                                  | Both contain supplier/vendor item estimates. These are not customer quotes or Billing orders.                                                                                                                                                                 |
| Mobile Contact          | Core contact contracts                                                   | LogicX has a ten-digit mobile identity master. CRM must not add a shadow contact identity table for parity.                                                                                                                                                   |
| Mobile Contact Customer | Core contact/customer relationships                                      | LogicX allows one mobile to relate to multiple customers and enforces pair uniqueness. CRM needs an explicit public Core relationship contract for equivalent behavior.                                                                                       |
| SOP Item                | `sop`, `sop-item`, `crm_sops`, `crm_sop_items`, `crm_sop_item_revisions` | CRM adds separate SOP identity and immutable published instructions. LogicX keeps procedure text on one editable item.                                                                                                                                        |
| SOP Assigned            | `duty-assignment`, `crm_duty_assignments`                                | CRM adds effective dates, active state, and revision reference. LogicX rejects duplicate item/Employee pairs and has no inactive field.                                                                                                                       |
| SOP Reporting           | `duty-report`, `crm_duty_reports`                                        | CRM adds recurrence uniqueness, completed/blocked result, issue details, and revision reference. LogicX has Employee, item, date, and actions plus fetched procedure fields.                                                                                  |
| Renewal Remainder       | Planned renewals and Service Agreement work                              | LogicX stores customer, vendor, period, due date, quantity, and rate. No dedicated CRM counterpart appears in the reviewed module inventory. Preserve the source spelling in remote API names.                                                                |
| Renewal Entry           | Planned renewal history                                                  | LogicX creates entries from a reminder and calculates quantity × rate in the browser. Its Python controller has no custom calculation. Server-side invariants require explicit implementation.                                                                |
| Notice                  | Notification foundation work                                             | A notice record is not equivalent to permission-scoped event delivery, read state, or retry handling.                                                                                                                                                         |
| Staff Request           | HR responsibility to confirm                                             | Leave, late-in, and absence requests are outside the current CRM product scope. Do not copy into CRM.                                                                                                                                                         |
| Scheme                  | Owner decision required                                                  | Links Sales Invoice, Brand, approval, support value, and realization. Billing and commercial ownership must be resolved first.                                                                                                                                |
| API One                 | Frappe integration infrastructure                                        | Creates authenticated Server Script endpoints. CODEXSUN uses fixed typed APIs, not tenant-authored route execution.                                                                                                                                           |
| API One Log             | Integration observability                                                | Request/response audit data needs masking, retention, and access controls. This is not CRM customer activity.                                                                                                                                                 |

Paths in the counterpart column are relative to `apps/crm`. Source presence does not certify complete UI or deployed behavior.

## Function review

- Enquiry fills the creator Employee and validates the mobile/customer relationship. Its whitelisted employee lookup uses the signed-in Frappe user.
- Mobile Contact validates ten-digit numbers and constrains rename behavior through the shared mobile validation helper.
- Mobile Contact Customer checks duplicates and adds a database unique pair constraint. Customer hooks refresh the stored display name.
- Enquiry Status exposes ordered report groups and a status-to-bucket map.
- Job Execution computes overnight duration and cost. A changed status emits Job Activity.
- Job Location validates coordinates, builds map data and a Maps URL, and emits activity when source fields change.
- Job Comments, Job Attachment, and Job Estimate emit source-linked Job Activity on relevant updates.
- `add_job_activity` inserts with `ignore_permissions=True`. Do not copy this bypass into a public CRM write path.
- SOP Assigned rejects repeated item/Employee pairs. Its form opens a prefilled SOP Reporting record.
- SOP Reporting has no custom Python validation in this folder. Recurrence limits and immutable reporting are CRM additions, not verified remote guarantees.
- Renewal calculations run in form JavaScript. Browser behavior does not protect REST writes.
- API One validates paths, checks collisions, synchronizes Server Script records, and clears path caches. Request enforcement and logging live outside this folder in `logicx_hr/api_one_hooks.py`.

The catalogue includes every adjacent controller function and complete form scripts.
Behavior outside this directory is a dependency, not fully audited by this catalogue.

## Confirmed source contract mismatches

The findings below describe the original review baseline.
The [current field mapping](../../frappe/agent/CRM-DUTY-FIELD-MAPPING.md) supersedes adapter behavior described below.
Frequency conversion, Department resolution, pair reuse, and outcome/instruction text preservation are now implemented.
Remote structured schema limits remain explicit in that mapping.

### Frequency values block direct SOP delivery

LogicX `SOP Item.frequency` accepts `Daily`, `Weekly`, `Monthly`, and `Yearly`.
CRM accepts `daily`, `weekly`, `monthly`, `quarterly`, `annually`, and `once`.
The [outbound worker](../../frappe/api/src/modules/crm-duty-sync/crm-duty-sync.worker.ts)
sends `value.frequency` without conversion.

Map supported values explicitly, including `annually` to `Yearly`.
Quarterly and once require an approved remote schema change or a clear unsupported-transfer result.
Do not silently substitute a different recurrence. Local CRM saves must remain available.

### Department needs a remote Link identity

LogicX requires `department` as a Link to Department. CRM stores department text.
The worker forwards this text directly. Delivery therefore depends on an exact remote document name.
Add a verified mapping or reject unmapped departments with a recoverable queue error.

### Assignment identity and lifecycle differ

LogicX identifies an assignment by item/Employee uniqueness, not a CRM revision or effective period.
CRM can retain several assignments for the same pair. A later remote create can fail the duplicate check.
Define whether the adapter reuses one remote pair or the remote schema gains stable assignment identity.
LogicX has no inactive state or effective dates. Local deactivation cannot currently round-trip.
Preserve history. Do not implement remote deletion as a substitute.

### Reports lose CRM-specific meaning in transfer

The worker sends Employee, item, date, and actions.
It does not send completed/blocked result, issue details, assignment ID, or published revision identity.
LogicX fetches instructions from the current SOP Item rather than the immutable CRM revision.
Remote reporting is therefore a partial copy. It cannot reconstruct all CRM history or outcomes.
Extend the remote contract explicitly before claiming reporting parity.

### Recurrence is not yet a stable assignment snapshot

CRM report submission reads frequency from the current SOP Item.
Editing frequency can change existing assignments' recurrence keys and historical report labels.
Keep recurrence with the assigned revision or assignment contract before relying on period uniqueness.

## Delivery order

1. Verify the target site's installed commit and effective DocType metadata against this reference.
2. Fix frequency conversion and define unsupported-frequency behavior.
3. Define Department and Employee identity mappings and validate them before transfer.
4. Resolve repeated assignment pairs and deactivation without deleting remote history.
5. Decide whether the remote report schema must preserve result, issue, assignment, and revision context.
6. Add contract tests using these actual field types, select options, and duplicate rules.
7. Verify failures, retries, remote create/update identity, and dependency order against a test site.
8. Continue local CRM foundation checks separately from external delivery acceptance.

## Evidence limits

This review reads local source only. It does not change schemas, records, permissions, or transfer behavior.
No Frappe server, database, remote delivery, or mobile workflow was exercised for this comparison.
Existing task completion states remain unchanged.
