# CRM Task Plan

## 1. Scope Rules

| Rule | Requirement |
| --- | --- |
| Repository boundary | Work only inside `E:/codexsun/codexsun`. |
| App boundary | Keep CRM product work inside `apps/crm`. |
| Source app | Use `apps/temp/crm` only for CRM workflow ideas. |
| Main flow | Campaign to lead to enquiry to estimate to quotation to assignment to field work to collection to verification. |
| Service focus | Support sales and service teams that send engineers to customer workplaces. |
| Communication | Support WhatsApp, chat app, email, SMS, and voice call records as CRM communication channels. |
| AI | Add an AI assistant only as a CRM helper. It must not own CRM data. |
| HR link | Add HR duty and attendance only where CRM service delivery needs it. |
| Identity | Use Platform Identity for users, actors, roles, and permissions. |
| Database | CRM owns CRM tables, migrations, seeders, repositories, events, and tests under `apps/crm`. |

## 2. Source Review Status

| Done | Task ID | Source | Finding |
| --- | --- | --- | --- |
| [x] | CRM-READ-001 | `apps/temp/crm/src/platform/web/src/modules/crm` | The app has CRM list, detail, form, overview, reports, filters, and desk patterns. |
| [x] | CRM-READ-002 | `apps/temp/crm/src/platform/api/src/modules/crm` | The app has enquiry list, create, update, message, assignment, job, overview, and report service ideas. |
| [x] | CRM-READ-003 | `apps/temp/crm/src/platform/web/src/modules/docs/content/crm-usage.mdx` | Users create enquiries, search mobile numbers, update status, and add work records. |
| [x] | CRM-READ-004 | `apps/temp/crm/src/platform/web/src/desks/app/AppDesk.tsx` | The app uses Overview, My Job, My Calls, All Enquiries, Open Enquiry, and Reports navigation. |
| [x] | CRM-READ-005 | `apps/temp/crm/src/platform/api/src/modules/estimate` | The app has supplier estimate workflow ideas. |
| [x] | CRM-READ-006 | `apps/temp/crm/src/platform/api/src/modules/quotation` | The app has quotation workflow ideas. |
| [x] | CRM-READ-007 | `apps/temp/crm/src/platform/api/src/modules/hr` | The app has staff request and duty workflow ideas. |
| [x] | CRM-READ-008 | `apps/temp/crm/apps/techmedia_flutter` | The app has mobile call capture, engineer job feed, and notification ideas. |

## 3. Product Goal

Build a real-life CRM for sales and service field teams.

The first full workflow must support this path:

1. Create a campaign.
2. Capture a lead.
3. Qualify the lead.
4. Convert the lead to an enquiry.
5. Communicate with the customer.
6. Get estimates from one or more suppliers.
7. Prepare and send a quotation.
8. Assign work to an engineer or team.
9. Schedule the visit or remote work.
10. Track check-in, check-out, location, work notes, and commitments.
11. Track collection or payment commitment.
12. Complete the assigned work.
13. Verify quality with proof.
14. Close the enquiry.
15. Review performance and follow-up.

## 4. Status Legend

| Status | Meaning |
| --- | --- |
| [x] | The planning or review task is complete. |
| [ ] | The task is not complete in `apps/crm`. |
| [~] | Use only when a future edit proves partial completion. |

## 5. Phase 0: Approval And Baseline

Purpose: lock the service CRM flow before code starts.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [x] | CRM-000 | Read temp CRM workflow ideas. | Source review notes in this file. | CRM ideas are listed. |
| [ ] | CRM-001 | Approve the service CRM flow. | Approved campaign to close scope. | The scope includes communication, estimates, quotation, field work, collection, and verification. |
| [ ] | CRM-002 | Approve task IDs and phase order. | Locked task plan. | Each phase has a clear owner and acceptance criteria. |
| [ ] | CRM-003 | Re-read `apps/crm/agent/skills.md` before code. | Confirmed implementation rules. | CRM agent rules are loaded. |
| [ ] | CRM-004 | Verify current CRM scaffold. | Baseline notes for API, web, provider, and health route. | The starting state is known before implementation. |

## 6. Phase 1: CRM Foundation Shell

Purpose: create a clean workspace for the full CRM flow.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-010 | Update CRM README files with the service workflow. | README updates under `apps/crm`. | The README explains campaign to close scope. |
| [ ] | CRM-011 | Register CRM foundation ownership. | Module registry update. | `crm.foundation` has a clear owner and scope. |
| [ ] | CRM-012 | Add Overview as the first CRM navigation item. | Web navigation item. | Overview appears above all CRM pages. |
| [ ] | CRM-013 | Add shell pages for Campaigns, Leads, Enquiries, Estimates, Quotations, Work, Collections, Verification, and Reports. | Empty workspace pages. | Each page has a clear empty state. |
| [ ] | CRM-014 | Add CRM readiness panel. | Overview status panel. | Users can see API, database, modules, and channel readiness. |
| [ ] | CRM-015 | Add first-load web coverage. | Focused browser test. | CRM shell loads and shows Overview. |

## 7. Phase 2: Campaign And Lead Management

Purpose: start the CRM flow with lead generation and qualification.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-020 | Add `crm.campaign` module provider. | Campaign module. | Campaign module owns contracts and data. |
| [ ] | CRM-021 | Add campaign tables. | Campaigns, members, costs, and status history. | Campaign data persists locally. |
| [ ] | CRM-022 | Add campaign workspace. | Campaign list, detail, cost, and members UI. | Users can track campaign spend and response. |
| [ ] | CRM-023 | Add `crm.lead` module provider. | Lead module. | Lead module owns contracts and data. |
| [ ] | CRM-024 | Add lead tables. | Leads, lead scores, status history, and conversion links. | Lead data persists locally. |
| [ ] | CRM-025 | Add lead capture workflow. | API, service, and form. | A lead can link to a campaign. |
| [ ] | CRM-026 | Add lead qualification workflow. | Rating, score, status, owner, and qualification notes. | Users can qualify or disqualify a lead. |
| [ ] | CRM-027 | Add lead duplicate checks. | Email, mobile, company, and location matching. | Users see possible duplicates before conversion. |
| [ ] | CRM-028 | Add lead conversion to enquiry. | Conversion service. | A qualified lead converts to one enquiry in one transaction. |

## 8. Phase 3: Enquiry And Customer Communication

Purpose: manage customer requests and communication from one record.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-030 | Add `crm.enquiry` module provider. | Enquiry module. | Enquiry module owns contracts and data. |
| [ ] | CRM-031 | Add enquiry tables. | Enquiries, statuses, groups, assignments, schedules, messages, activities, and attachments. | Enquiry data persists locally. |
| [ ] | CRM-032 | Add customer and contact references. | Accounts, contacts, addresses, and contact methods. | Enquiries can link to customer data. |
| [ ] | CRM-033 | Add mobile lookup. | Mobile search API and UI. | Users can find customer history by mobile number. |
| [ ] | CRM-034 | Add enquiry form. | Enquiry create and update UI. | Users can enter customer, location, request, priority, schedule, and status. |
| [ ] | CRM-035 | Add enquiry list views. | My Work, Created By Me, All Enquiries, Open Enquiries. | Views respect actor permissions. |
| [ ] | CRM-036 | Add enquiry detail view. | Summary, communication, estimates, quotations, work, collection, and verification tabs. | Users can review all work from one record. |
| [ ] | CRM-037 | Add communication channel records. | WhatsApp, chat app, email, SMS, and call log tables. | Each customer interaction links to an enquiry. |
| [ ] | CRM-038 | Add message templates. | Template table and send draft UI. | Users can prepare repeat messages. |
| [ ] | CRM-039 | Add voice call records. | Call time, direction, number, actor, notes, and outcome. | Calls become part of the customer timeline. |

## 9. Phase 4: Recording And Quality Foundation

Purpose: prepare call and visit recording for quality review.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-040 | Add recording consent fields. | Consent status and consent note. | Recording requires consent status. |
| [ ] | CRM-041 | Add recording metadata. | Channel, storage reference, duration, actor, customer, and enquiry link. | Recordings can attach to calls or visits. |
| [ ] | CRM-042 | Add recording retention policy fields. | Retain until, review status, and delete eligibility. | Retention is explicit. |
| [ ] | CRM-043 | Add quality review records. | Score, reviewer, review note, result, and coaching action. | Supervisors can review calls or field visits. |
| [ ] | CRM-044 | Add quality issue workflow. | Issue type, severity, owner, due date, and resolution. | Poor quality can create corrective tasks. |

## 10. Phase 5: Supplier Estimates

Purpose: get cost and availability from multiple suppliers before quotation.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-050 | Add `crm.supplier` references. | Supplier parties and contacts. | Estimates can link to suppliers. |
| [ ] | CRM-051 | Add estimate request tables. | Estimate requests and request lines. | Users can request supplier pricing from an enquiry. |
| [ ] | CRM-052 | Add multiple supplier estimates. | Supplier estimate header and lines. | One enquiry can hold estimates from many suppliers. |
| [ ] | CRM-053 | Add estimate comparison view. | Price, delivery time, warranty, margin, and remarks. | Users can compare suppliers before quote. |
| [ ] | CRM-054 | Add estimate approval. | Approval status and approver fields. | A selected estimate can drive quotation. |
| [ ] | CRM-055 | Add supplier commitment tracking. | Supplier delivery date and commitment note. | Supplier promises are visible in the enquiry. |

## 11. Phase 6: Quotation Preparing And Sending

Purpose: prepare, approve, send, and track customer quotations.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-060 | Add quotation tables. | Quotations, quotation lines, terms, taxes, discounts, versions, and status history. | Quotation data persists locally. |
| [ ] | CRM-061 | Add quotation builder. | Web form and line table. | Users can prepare a quotation from estimates or manual lines. |
| [ ] | CRM-062 | Add margin and approval checks. | Margin, discount, and approval rules. | Risky quotations require approval. |
| [ ] | CRM-063 | Add quotation preview. | Printable or shareable view. | Users can review before sending. |
| [ ] | CRM-064 | Add send quotation action. | Email, WhatsApp, SMS, or share-link send record. | Sending creates a communication timeline entry. |
| [ ] | CRM-065 | Add customer response tracking. | Accepted, rejected, revised, and follow-up statuses. | Customer response is visible. |
| [ ] | CRM-066 | Add quotation revision workflow. | New version from old quotation. | Revisions keep full history. |
| [ ] | CRM-067 | Add quotation to work conversion. | Work order or task set creation. | Accepted quotation can create assigned work. |

## 12. Phase 7: Assignment, Follow-Up, And Duty Planning

Purpose: scale assigner and assignee work control.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-070 | Add work assignment tables. | Assignments, assignment status history, and ownership fields. | Each work item has assigner and assignee. |
| [ ] | CRM-071 | Add assignee queue. | My Work and team work queues. | Assignees see assigned work by priority and due date. |
| [ ] | CRM-072 | Add assigner follow-up queue. | Follow-up list for assigned work. | Assigners can track pending work. |
| [ ] | CRM-073 | Add duty schedule tables. | Duty roster, shifts, availability, leave, and backup actor. | Work assignment respects duty schedule. |
| [ ] | CRM-074 | Add schedule calendar. | Day, week, and resource views. | Managers can schedule engineers and tasks. |
| [ ] | CRM-075 | Add reminder and escalation rules. | Reminder, overdue, and escalation records. | Late work alerts owners and managers. |
| [ ] | CRM-076 | Add workload balancing. | Current workload and skill match summary. | Managers can assign work to available staff. |
| [ ] | CRM-077 | Add commitment tracking. | Customer promise date, staff promise date, and supplier promise date. | Commitments are visible and reportable. |

## 13. Phase 8: Field Engineer Work

Purpose: support engineers at the customer workplace.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-080 | Add work order tables. | Work orders, tasks, checklists, parts, tools, and attachments. | Field work persists locally. |
| [ ] | CRM-081 | Add site visit schedule. | Visit date, time, engineer, customer location, and contact. | A visit can be planned from an enquiry. |
| [ ] | CRM-082 | Add engineer check-in. | Check-in time, GPS location, address, and device source. | Engineer arrival is recorded. |
| [ ] | CRM-083 | Add engineer check-out. | Check-out time, GPS location, work result, and customer note. | Engineer departure is recorded. |
| [ ] | CRM-084 | Add location history. | Location records for check-in, check-out, and optional route points. | Location proof exists for field work. |
| [ ] | CRM-085 | Add work proof capture. | Photos, files, notes, customer signature, and completion evidence. | Field work has proof. |
| [ ] | CRM-086 | Add parts used tracking. | Planned parts, used parts, returned parts, and part cost. | Service cost is measurable. |
| [ ] | CRM-087 | Add field issue workflow. | Cannot complete, customer unavailable, parts missing, and revisit required. | Failed visits create next actions. |

## 14. Phase 9: Collection And Commercial Follow-Up

Purpose: track payment, collection, and commercial commitments.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-090 | Add collection plan tables. | Expected amount, due date, mode, owner, and status. | Collection tasks link to enquiry or quotation. |
| [ ] | CRM-091 | Add payment commitment records. | Customer promise date, promised amount, and note. | Promises are visible and reportable. |
| [ ] | CRM-092 | Add collection attempts. | Call, message, visit, email, and outcome records. | Collection follow-up has history. |
| [ ] | CRM-093 | Add received payment record. | Amount, mode, reference, received by, received at, and proof. | Payment collection has proof. |
| [ ] | CRM-094 | Add outstanding balance view. | Quoted, collected, pending, and overdue amounts. | Users can see commercial status. |
| [ ] | CRM-095 | Add collection escalation. | Overdue owner and manager escalation. | Overdue collection does not stay hidden. |

## 15. Phase 10: Task Completion And Verification

Purpose: make completion clear and auditable.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-100 | Add task completion rules. | Completion validation service. | Required checklist items must be complete. |
| [ ] | CRM-101 | Add completion evidence fields. | Completion note, completed by, completed at, and evidence attachments. | Completed work includes proof. |
| [ ] | CRM-102 | Add status transitions. | Open, in progress, blocked, completed, verified, reopened, and closed. | Invalid transitions fail. |
| [ ] | CRM-103 | Add verification checklist. | Verification rows and UI. | Users can define required verification steps. |
| [ ] | CRM-104 | Add verifier assignment. | Verifier actor and due date fields. | A verifier can review completed work. |
| [ ] | CRM-105 | Add verification outcome. | Verified, failed, reopened, and waived outcomes. | Verification result is explicit. |
| [ ] | CRM-106 | Add reopen workflow. | Reopen reason and reassignment. | Failed verification can create follow-up work. |
| [ ] | CRM-107 | Add enquiry close workflow. | Close reason, closed by, closed at, and final status. | Only verified enquiries can close. |

## 16. Phase 11: AI Assistant For CRM

Purpose: help users work faster without giving the assistant data ownership.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-110 | Add CRM assistant scope rules. | Assistant policy and permission rules. | Assistant reads only authorized CRM data. |
| [ ] | CRM-111 | Add enquiry summary action. | AI summary from campaign, lead, enquiry, communication, work, and collection data. | Users can get a useful summary. |
| [ ] | CRM-112 | Add reply draft action. | Draft WhatsApp, email, SMS, and call script text. | Drafts require user approval before send. |
| [ ] | CRM-113 | Add quotation helper action. | Suggested quotation lines from estimate and enquiry data. | User must approve all quotation changes. |
| [ ] | CRM-114 | Add task planning helper. | Suggested checklist and assignment plan. | User controls task creation. |
| [ ] | CRM-115 | Add quality review helper. | Recording or note summary for reviewer. | Assistant output stays advisory. |
| [ ] | CRM-116 | Add follow-up recommendation. | Suggested next action and due date. | User must confirm follow-up creation. |

## 17. Phase 12: HR, Duty, And Performance

Purpose: include only HR data needed for CRM service delivery.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-120 | Add staff profile reference. | Actor skill, team, role, service area, and work status. | CRM can match work to capable staff. |
| [ ] | CRM-121 | Add duty roster. | Shift, availability, leave, and backup assignment records. | Scheduling respects staff availability. |
| [ ] | CRM-122 | Add attendance link. | Check-in, check-out, visit, and task relation. | Field attendance links to assigned work. |
| [ ] | CRM-123 | Add work performance metrics. | Assigned, accepted, started, completed, reopened, verified, late, and failed counts. | Managers can measure performance. |
| [ ] | CRM-124 | Add assigner performance metrics. | Assigned work, follow-up rate, overdue rate, and closure rate. | Managers can measure assignment quality. |
| [ ] | CRM-125 | Add engineer performance metrics. | Travel, check-in delay, first-time fix, revisit, collection, and quality score. | Service teams can improve field work. |
| [ ] | CRM-126 | Add duty exception workflow. | Missed duty, late check-in, early check-out, and emergency reassignment. | Exceptions create reviewable records. |

## 18. Phase 13: Overview, Reports, And Dashboards

Purpose: show progress across the full service CRM flow.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-130 | Add campaign overview metrics. | Campaign count, lead count, cost, and conversion rate. | Overview shows campaign performance. |
| [ ] | CRM-131 | Add lead funnel metrics. | New, qualified, converted, and lost counts. | Users can see lead movement. |
| [ ] | CRM-132 | Add enquiry workload metrics. | Open, assigned, overdue, completed, verified, and closed counts. | Users can see enquiry health. |
| [ ] | CRM-133 | Add quotation metrics. | Draft, sent, accepted, rejected, revised, and value totals. | Users can see quotation health. |
| [ ] | CRM-134 | Add field service metrics. | Scheduled, checked in, completed, revisit, and failed visit counts. | Managers can see service health. |
| [ ] | CRM-135 | Add collection metrics. | Expected, collected, pending, overdue, and promised amounts. | Managers can see collection status. |
| [ ] | CRM-136 | Add quality metrics. | Review count, average score, failed reviews, and coaching tasks. | Managers can see quality trends. |
| [ ] | CRM-137 | Add end-to-end report. | Campaign to lead to enquiry to quotation to work to collection to close report. | The full path is reportable. |

## 19. Phase 14: Security, Audit, And Compliance

Purpose: make the CRM safe for real customer and staff data.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-140 | Add CRM permission seeds. | Permissions for each shipped module. | API rejects unauthorized access. |
| [ ] | CRM-141 | Add CRM role presets. | Admin, manager, seller, assigner, engineer, verifier, and collection owner presets. | Common teams can start quickly. |
| [ ] | CRM-142 | Add route authorization checks. | Permission checks on all CRM routes. | Unauthenticated and unauthorized requests fail. |
| [ ] | CRM-143 | Add record ownership rules. | Owner, team, assigner, assignee, verifier, and manager access rules. | Users see only allowed records. |
| [ ] | CRM-144 | Add audit events. | Audit rows for conversion, quote send, assignment, check-in, check-out, collection, verification, and close. | Sensitive actions are traceable. |
| [ ] | CRM-145 | Add recording compliance rules. | Consent, retention, deletion, and quality review policy. | Recording data has clear controls. |
| [ ] | CRM-146 | Add location compliance rules. | Location purpose, retention, and access policy. | Location data has clear controls. |

## 20. Phase 15: Verification And Release Proof

Purpose: prove the real service CRM flow before release.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-150 | Add campaign and lead API tests. | Focused API tests. | Capture, qualify, convert, and validation paths pass. |
| [ ] | CRM-151 | Add enquiry and communication API tests. | Focused API tests. | Enquiry, message, schedule, call, and attachment paths pass. |
| [ ] | CRM-152 | Add estimate and quotation API tests. | Focused API tests. | Supplier estimate, comparison, quote, approval, and send paths pass. |
| [ ] | CRM-153 | Add assignment and field work API tests. | Focused API tests. | Assign, schedule, check-in, check-out, complete, and reopen paths pass. |
| [ ] | CRM-154 | Add collection API tests. | Focused API tests. | Commitment, attempt, received payment, and overdue paths pass. |
| [ ] | CRM-155 | Add verification and quality API tests. | Focused API tests. | Verify, fail, quality review, recording metadata, and close paths pass. |
| [ ] | CRM-156 | Add end-to-end browser test. | Browser flow. | Campaign to close passes in the web app. |
| [ ] | CRM-157 | Add migration repeatability check. | Data lifecycle check. | Migrations and seeders can run more than once safely. |
| [ ] | CRM-158 | Run root layout check. | `node tools/check-root-layout.mjs`. | Root layout remains clean. |
| [ ] | CRM-159 | Record final verification evidence. | Completion report. | Report separates static, focused, browser, mobile, and deployment proof. |

## 21. Work First

Start with Phase 0.

Do not write migrations before these approvals pass:

1. CRM-001
2. CRM-002
3. CRM-003
4. CRM-004

First implementation task after approval:

1. CRM-010: Update CRM README files with the service workflow.

Then continue:

1. CRM-011: Register CRM foundation ownership.
2. CRM-012: Add Overview as the first CRM navigation item.
3. CRM-013: Add shell pages for the full service CRM flow.
4. CRM-014: Add CRM readiness panel.
5. CRM-015: Add first-load web coverage.

## 22. Required Handoff

| Item | Required In Each Final Report |
| --- | --- |
| Scope | Name the phase and task IDs. |
| Files changed | List exact files. |
| Checks passed | Report only checks actually run. |
| Checks failed | Include command and failure summary. |
| Untested paths | Name paths not verified. |
| Next task | Name the next unchecked task. |

