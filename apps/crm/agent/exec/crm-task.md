# CRM Task Plan

## 1. Scope Rules

| Rule | Requirement |
| --- | --- |
| Repository boundary | Work only inside `E:/codexsun/codexsun`. |
| App boundary | Keep CRM product work inside `apps/crm`. |
| Main flow | Campaign to lead to enquiry to estimate to quotation to assignment to field work to collection to verification. |
| Service focus | Support sales and service teams that send engineers to customer workplaces. |
| Communication | Support WhatsApp, chat app, email, SMS, and voice call records as CRM communication channels. |
| Recording | Store recording metadata, consent, retention, and quality review records for calls and visits. |
| AI | Add an AI assistant only as a CRM helper. It must not own CRM data or change records without approval. |
| Supplier estimate | Support estimate requests from multiple suppliers before quotation. |
| Quotation | Support quotation preparation, approval, sending, customer response, and revision. |
| Field work | Support engineer assignment, schedule, check-in, check-out, location proof, work proof, and revisit. |
| Collection | Support collection plans, payment promises, attempts, received payments, proof, and overdue escalation. |
| HR link | Add duty, attendance links, staff skills, and performance only where CRM service delivery needs them. |
| Identity | Use Platform Identity for users, actors, roles, and permissions. |
| Database | CRM owns CRM tables, migrations, seeders, repositories, events, and tests under `apps/crm`. |

## 2. Planning Review Status

| Done | Task ID | Area | Finding |
| --- | --- | --- | --- |
| [x] | CRM-READ-001 | Current CRM table plan | The plan needed a CRM-only table map with no live external dependency. |
| [x] | CRM-READ-002 | Current CRM task plan | The plan needed phases that match the CRM table groups. |
| [x] | CRM-READ-003 | Existing CRM workflow ideas | The app needs enquiry, communication, estimate, quotation, assignment, job, overview, and report workflows. |
| [x] | CRM-READ-004 | Field service ideas | The app needs mobile call capture, engineer job feed, duty, check-in, and proof workflows. |
| [x] | CRM-READ-005 | CRM assistant ideas | The assistant must draft, summarize, recommend, and wait for user approval. |

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
| [x] | CRM-000 | Review and revise CRM table and task plans. | Updated planning files. | Plans match the CRM-only scope. |
| [ ] | CRM-001 | Approve the service CRM flow. | Approved campaign to close scope. | The scope includes communication, estimates, quotation, field work, collection, and verification. |
| [ ] | CRM-002 | Approve task IDs and phase order. | Locked task plan. | Each phase has clear output and acceptance criteria. |
| [ ] | CRM-003 | Approve `apps/crm/agent/exec/crm-table.md`. | Locked table plan. | Table groups match the task phases. |
| [ ] | CRM-004 | Re-read `apps/crm/agent/skills.md` before code. | Confirmed implementation rules. | CRM agent rules are loaded. |
| [ ] | CRM-005 | Verify current CRM scaffold. | Baseline notes for API, web, provider, and health route. | The starting state is known before implementation. |

## 6. Phase 1: CRM Foundation Shell

Purpose: create a clean workspace for the full CRM flow.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-010 | Update CRM README files with the service workflow. | README updates under `apps/crm`. | The README explains campaign to close scope. |
| [ ] | CRM-011 | Register CRM foundation ownership. | Module registry update. | `crm.foundation` has a clear owner and scope. |
| [ ] | CRM-012 | Add Overview as the first CRM navigation item. | Web navigation item. | Overview appears above all CRM pages. |
| [ ] | CRM-013 | Add shell pages for Campaigns, Leads, Customers, Enquiries, Estimates, Quotations, Work, Collections, Verification, Quality, AI Assistant, HR Duty, and Reports. | Empty workspace pages. | Each page has a clear empty state. |
| [ ] | CRM-014 | Add CRM readiness panel. | Overview status panel. | Users can see API, database, modules, channels, and table readiness. |
| [ ] | CRM-015 | Add first-load web coverage. | Focused browser test. | CRM shell loads and shows Overview. |

## 7. Phase 2: Foundation, Routing, And Customer 360

Purpose: create local CRM base data before business workflow starts.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-020 | Add CRM foundation tables. | Number sequences, sources, tags, picklists, saved views. | Shared setup persists locally. |
| [ ] | CRM-021 | Add routing tables. | Teams, team members, queues, queue members, territories, shares. | Work can route to people and teams. |
| [ ] | CRM-022 | Add customer account tables. | Accounts, contacts, account contacts, addresses. | Customer data persists locally. |
| [ ] | CRM-023 | Add contact method and preference tables. | Contact methods, customer preferences, consents. | Customer communication rules are explicit. |
| [ ] | CRM-024 | Add duplicate and merge tables. | Duplicate sets, duplicate items, merge requests. | Data cleanup is reviewable. |
| [ ] | CRM-025 | Add customer lookup workflow. | API, service, and basic UI lookup. | Users can search by name, mobile, email, and account. |

## 8. Phase 3: Campaign And Lead Management

Purpose: start the CRM flow with lead generation and qualification.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-030 | Add `crm.campaign` module provider. | Campaign module. | Campaign module owns contracts and data. |
| [ ] | CRM-031 | Add campaign tables. | Campaigns, members, costs, and status history. | Campaign data persists locally. |
| [ ] | CRM-032 | Add campaign workspace. | Campaign list, detail, cost, and members UI. | Users can track campaign spend and response. |
| [ ] | CRM-033 | Add `crm.lead` module provider. | Lead module. | Lead module owns contracts and data. |
| [ ] | CRM-034 | Add lead tables. | Leads, lead scores, status history, qualification, and conversion links. | Lead data persists locally. |
| [ ] | CRM-035 | Add lead capture workflow. | API, service, and form. | A lead can link to a campaign. |
| [ ] | CRM-036 | Add lead qualification workflow. | Rating, score, status, owner, and qualification notes. | Users can qualify or disqualify a lead. |
| [ ] | CRM-037 | Add lead duplicate checks. | Email, mobile, company, and location matching. | Users see possible duplicates before conversion. |
| [ ] | CRM-038 | Add lead conversion to enquiry. | Conversion service. | A qualified lead converts to one enquiry in one transaction. |

## 9. Phase 4: Enquiry And Customer Communication

Purpose: manage customer requests and communication from one record.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-040 | Add `crm.enquiry` module provider. | Enquiry module. | Enquiry module owns contracts and data. |
| [ ] | CRM-041 | Add enquiry tables. | Enquiries, statuses, messages, notes, schedules, activities, attachments, commitments, and SLA checkpoints. | Enquiry data persists locally. |
| [ ] | CRM-042 | Add mobile lookup. | Mobile search API and UI. | Users can find customer history by mobile number. |
| [ ] | CRM-043 | Add enquiry form. | Enquiry create and update UI. | Users can enter customer, location, request, priority, schedule, and status. |
| [ ] | CRM-044 | Add enquiry list views. | My Work, Created By Me, All Enquiries, Open Enquiries. | Views respect actor permissions. |
| [ ] | CRM-045 | Add enquiry detail view. | Summary, communication, estimates, quotations, work, collection, and verification tabs. | Users can review all work from one record. |
| [ ] | CRM-046 | Add communication channel records. | WhatsApp, chat app, email, SMS, and call log tables. | Each customer interaction links to an enquiry. |
| [ ] | CRM-047 | Add message templates and send attempts. | Template, send attempt, and delivery receipt records. | Users can prepare and track repeat messages. |
| [ ] | CRM-048 | Add voice call records. | Call time, direction, number, actor, notes, recording metadata link, and outcome. | Calls become part of the customer timeline. |

## 10. Phase 5: Recording And Quality Foundation

Purpose: prepare call and visit recording for quality review.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-050 | Add recording consent fields. | Consent status and consent note. | Recording requires consent status. |
| [ ] | CRM-051 | Add recording metadata. | Channel, storage reference, duration, actor, customer, and enquiry link. | Recordings can attach to calls or visits. |
| [ ] | CRM-052 | Add recording retention policy fields. | Retain until, review status, and delete eligibility. | Retention is explicit. |
| [ ] | CRM-053 | Add quality review records. | Score, reviewer, review note, result, and coaching action. | Supervisors can review calls or field visits. |
| [ ] | CRM-054 | Add quality issue workflow. | Issue type, severity, owner, due date, and resolution. | Poor quality can create corrective tasks. |

## 11. Phase 6: Supplier Estimates

Purpose: get cost and availability from multiple suppliers before quotation.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-060 | Add supplier tables. | Suppliers and supplier contacts. | Estimates can link to suppliers. |
| [ ] | CRM-061 | Add estimate request tables. | Estimate requests and request lines. | Users can request supplier pricing from an enquiry. |
| [ ] | CRM-062 | Add multiple supplier estimates. | Supplier estimate header and lines. | One enquiry can hold estimates from many suppliers. |
| [ ] | CRM-063 | Add estimate comparison view. | Price, delivery time, warranty, margin, and remarks. | Users can compare suppliers before quote. |
| [ ] | CRM-064 | Add estimate approval. | Approval status and approver fields. | A selected estimate can drive quotation. |
| [ ] | CRM-065 | Add supplier commitment tracking. | Supplier delivery date and commitment note. | Supplier promises are visible in the enquiry. |

## 12. Phase 7: Quotation Preparing And Sending

Purpose: prepare, approve, send, and track customer quotations.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-070 | Add quotation tables. | Quotations, lines, terms, versions, approvals, sends, and responses. | Quotation data persists locally. |
| [ ] | CRM-071 | Add quotation builder. | Web form and line table. | Users can prepare a quotation from estimates or manual lines. |
| [ ] | CRM-072 | Add margin and approval checks. | Margin, discount, and approval rules. | Risky quotations require approval. |
| [ ] | CRM-073 | Add quotation preview. | Printable or shareable view. | Users can review before sending. |
| [ ] | CRM-074 | Add send quotation action. | Email, WhatsApp, SMS, or share-link send record. | Sending creates a communication timeline entry. |
| [ ] | CRM-075 | Add customer response tracking. | Accepted, rejected, revised, and follow-up statuses. | Customer response is visible. |
| [ ] | CRM-076 | Add quotation revision workflow. | New version from old quotation. | Revisions keep full history. |
| [ ] | CRM-077 | Add quotation to work conversion. | Work order or task set creation. | Accepted quotation can create assigned work. |

## 13. Phase 8: Assignment, Follow-Up, And Duty Planning

Purpose: scale assigner and assignee work control.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-080 | Add work assignment tables. | Assignments, assignment status history, and ownership fields. | Each work item has assigner and assignee. |
| [ ] | CRM-081 | Add assignee queue. | My Work and team work queues. | Assignees see assigned work by priority and due date. |
| [ ] | CRM-082 | Add assigner follow-up queue. | Follow-up list for assigned work. | Assigners can track pending work. |
| [ ] | CRM-083 | Add duty schedule tables. | Duty roster, shifts, availability, leave, and backup actor. | Work assignment respects duty schedule. |
| [ ] | CRM-084 | Add schedule calendar. | Day, week, and resource views. | Managers can schedule engineers and tasks. |
| [ ] | CRM-085 | Add reminder and escalation rules. | Reminder, overdue, and escalation records. | Late work alerts owners and managers. |
| [ ] | CRM-086 | Add workload balancing. | Current workload and skill match summary. | Managers can assign work to available staff. |
| [ ] | CRM-087 | Add commitment tracking. | Customer promise date, staff promise date, and supplier promise date. | Commitments are visible and reportable. |

## 14. Phase 9: Field Engineer Work

Purpose: support engineers at the customer workplace.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-090 | Add work order tables. | Work orders, tasks, checklists, parts, tools, and attachments. | Field work persists locally. |
| [ ] | CRM-091 | Add site visit schedule. | Visit date, time, engineer, customer location, and contact. | A visit can be planned from an enquiry. |
| [ ] | CRM-092 | Add engineer check-in. | Check-in time, GPS location, address, and device source. | Engineer arrival is recorded. |
| [ ] | CRM-093 | Add engineer check-out. | Check-out time, GPS location, work result, and customer note. | Engineer departure is recorded. |
| [ ] | CRM-094 | Add location history. | Location records for check-in, check-out, and optional route points. | Location proof exists for field work. |
| [ ] | CRM-095 | Add work proof capture. | Photos, files, notes, customer signature, and completion evidence. | Field work has proof. |
| [ ] | CRM-096 | Add parts used tracking. | Planned parts, used parts, returned parts, and part cost. | Service cost is measurable. |
| [ ] | CRM-097 | Add field issue workflow. | Cannot complete, customer unavailable, parts missing, and revisit required. | Failed visits create next actions. |

## 15. Phase 10: Collection And Commercial Follow-Up

Purpose: track payment, collection, and commercial commitments.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-100 | Add collection plan tables. | Expected amount, due date, mode, owner, and status. | Collection tasks link to enquiry or quotation. |
| [ ] | CRM-101 | Add payment commitment records. | Customer promise date, promised amount, and note. | Promises are visible and reportable. |
| [ ] | CRM-102 | Add collection attempts. | Call, message, visit, email, and outcome records. | Collection follow-up has history. |
| [ ] | CRM-103 | Add received payment record. | Amount, mode, reference, received by, received at, and proof. | Payment collection has proof. |
| [ ] | CRM-104 | Add outstanding balance view. | Quoted, collected, pending, and overdue amounts. | Users can see commercial status. |
| [ ] | CRM-105 | Add collection escalation. | Overdue owner and manager escalation. | Overdue collection does not stay hidden. |

## 16. Phase 11: Task Completion And Verification

Purpose: make completion clear and auditable.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-110 | Add task completion rules. | Completion validation service. | Required checklist items must be complete. |
| [ ] | CRM-111 | Add completion evidence fields. | Completion note, completed by, completed at, and evidence attachments. | Completed work includes proof. |
| [ ] | CRM-112 | Add status transitions. | Open, in progress, blocked, completed, verified, reopened, and closed. | Invalid transitions fail. |
| [ ] | CRM-113 | Add verification checklist. | Verification rows and UI. | Users can define required verification steps. |
| [ ] | CRM-114 | Add verifier assignment. | Verifier actor and due date fields. | A verifier can review completed work. |
| [ ] | CRM-115 | Add verification outcome. | Verified, failed, reopened, and waived outcomes. | Verification result is explicit. |
| [ ] | CRM-116 | Add reopen workflow. | Reopen reason and reassignment. | Failed verification can create follow-up work. |
| [ ] | CRM-117 | Add enquiry close workflow. | Close reason, closed by, closed at, and final status. | Only verified enquiries can close. |

## 17. Phase 12: AI Assistant For CRM

Purpose: help users work faster without giving the assistant data ownership.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-120 | Add CRM assistant scope rules. | Assistant policy and permission rules. | Assistant reads only authorized CRM data. |
| [ ] | CRM-121 | Add assistant session tables. | Sessions, requests, suggestions, and approvals. | AI help has an audit trail. |
| [ ] | CRM-122 | Add enquiry summary action. | AI summary from campaign, lead, enquiry, communication, work, and collection data. | Users can get a useful summary. |
| [ ] | CRM-123 | Add reply draft action. | Draft WhatsApp, email, SMS, and call script text. | Drafts require user approval before send. |
| [ ] | CRM-124 | Add quotation helper action. | Suggested quotation lines from estimate and enquiry data. | User must approve all quotation changes. |
| [ ] | CRM-125 | Add task planning helper. | Suggested checklist and assignment plan. | User controls task creation. |
| [ ] | CRM-126 | Add quality review helper. | Recording or note summary for reviewer. | Assistant output stays advisory. |
| [ ] | CRM-127 | Add follow-up recommendation. | Suggested next action and due date. | User must confirm follow-up creation. |

## 18. Phase 13: HR, Duty, And Performance

Purpose: include only HR data needed for CRM service delivery.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-130 | Add staff profile reference. | Actor skill, team, role, service area, and work status. | CRM can match work to capable staff. |
| [ ] | CRM-131 | Add staff skill records. | Skill key, level, certificate date, and active flag. | Work assignment can use skill matching. |
| [ ] | CRM-132 | Add duty roster. | Shift, availability, leave, and backup assignment records. | Scheduling respects staff availability. |
| [ ] | CRM-133 | Add attendance link. | Check-in, check-out, visit, and task relation. | Field attendance links to assigned work. |
| [ ] | CRM-134 | Add work performance metrics. | Assigned, accepted, started, completed, reopened, verified, late, and failed counts. | Managers can measure performance. |
| [ ] | CRM-135 | Add assigner performance metrics. | Assigned work, follow-up rate, overdue rate, and closure rate. | Managers can measure assignment quality. |
| [ ] | CRM-136 | Add engineer performance metrics. | Travel, check-in delay, first-time fix, revisit, collection, and quality score. | Service teams can improve field work. |
| [ ] | CRM-137 | Add duty exception workflow. | Missed duty, late check-in, early check-out, and emergency reassignment. | Exceptions create reviewable records. |

## 19. Phase 14: Overview, Reports, And Dashboards

Purpose: show progress across the full service CRM flow.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-140 | Add campaign overview metrics. | Campaign count, lead count, cost, and conversion rate. | Overview shows campaign performance. |
| [ ] | CRM-141 | Add lead funnel metrics. | New, qualified, converted, and lost counts. | Users can see lead movement. |
| [ ] | CRM-142 | Add enquiry workload metrics. | Open, assigned, overdue, completed, verified, and closed counts. | Users can see enquiry health. |
| [ ] | CRM-143 | Add quotation metrics. | Draft, sent, accepted, rejected, revised, and value totals. | Users can see quotation health. |
| [ ] | CRM-144 | Add field service metrics. | Scheduled, checked in, completed, revisit, and failed visit counts. | Managers can see service health. |
| [ ] | CRM-145 | Add collection metrics. | Expected, collected, pending, overdue, and promised amounts. | Managers can see collection status. |
| [ ] | CRM-146 | Add quality metrics. | Review count, average score, failed reviews, and coaching tasks. | Managers can see quality trends. |
| [ ] | CRM-147 | Add performance metrics. | Assigner, assignee, engineer, and team performance views. | Managers can improve work allocation. |
| [ ] | CRM-148 | Add end-to-end report. | Campaign to lead to enquiry to quotation to work to collection to close report. | The full path is reportable. |

## 20. Phase 15: Security, Audit, And Compliance

Purpose: make the CRM safe for real customer and staff data.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-150 | Add CRM permission seeds. | Permissions for each shipped module. | API rejects unauthorized access. |
| [ ] | CRM-151 | Add CRM role presets. | Admin, manager, seller, assigner, engineer, verifier, and collection owner presets. | Common teams can start quickly. |
| [ ] | CRM-152 | Add route authorization checks. | Permission checks on all CRM routes. | Unauthenticated and unauthorized requests fail. |
| [ ] | CRM-153 | Add record ownership rules. | Owner, team, assigner, assignee, verifier, and manager access rules. | Users see only allowed records. |
| [ ] | CRM-154 | Add audit events. | Audit rows for conversion, quote send, assignment, check-in, check-out, collection, verification, and close. | Sensitive actions are traceable. |
| [ ] | CRM-155 | Add communication compliance rules. | Consent, delivery, retention, and opt-out policy. | Customer contact data has clear controls. |
| [ ] | CRM-156 | Add recording compliance rules. | Consent, retention, deletion, and quality review policy. | Recording data has clear controls. |
| [ ] | CRM-157 | Add location compliance rules. | Location purpose, retention, and access policy. | Location data has clear controls. |
| [ ] | CRM-158 | Add AI compliance rules. | Data access, prompt logging, output approval, and retention policy. | AI help stays reviewable and safe. |

## 21. Phase 16: Verification And Release Proof

Purpose: prove the real service CRM flow before release.

| Done | Task ID | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| [ ] | CRM-160 | Add foundation and customer API tests. | Focused API tests. | Setup, routing, account, contact, and consent paths pass. |
| [ ] | CRM-161 | Add campaign and lead API tests. | Focused API tests. | Capture, qualify, convert, and validation paths pass. |
| [ ] | CRM-162 | Add enquiry and communication API tests. | Focused API tests. | Enquiry, message, schedule, call, and attachment paths pass. |
| [ ] | CRM-163 | Add estimate and quotation API tests. | Focused API tests. | Supplier estimate, comparison, quote, approval, and send paths pass. |
| [ ] | CRM-164 | Add assignment and field work API tests. | Focused API tests. | Assign, schedule, check-in, check-out, complete, and reopen paths pass. |
| [ ] | CRM-165 | Add collection API tests. | Focused API tests. | Commitment, attempt, received payment, and overdue paths pass. |
| [ ] | CRM-166 | Add verification, quality, and recording API tests. | Focused API tests. | Verify, fail, quality review, recording metadata, and close paths pass. |
| [ ] | CRM-167 | Add AI assistant API tests. | Focused API tests. | Summary, draft, suggestion, approval, and permission paths pass. |
| [ ] | CRM-168 | Add HR duty and performance API tests. | Focused API tests. | Duty, attendance link, exception, and metric paths pass. |
| [ ] | CRM-169 | Add end-to-end browser test. | Browser flow. | Campaign to close passes in the web app. |
| [ ] | CRM-170 | Add migration repeatability check. | Data lifecycle check. | Migrations and seeders can run more than once safely. |
| [ ] | CRM-171 | Run root layout check. | `node tools/check-root-layout.mjs`. | Root layout remains clean. |
| [ ] | CRM-172 | Record final verification evidence. | Completion report. | Report separates static, focused, browser, mobile, and deployment proof. |

## 22. Work First

Start with Phase 0.

Do not write migrations before these approvals pass:

1. CRM-001
2. CRM-002
3. CRM-003
4. CRM-004
5. CRM-005

First implementation task after approval:

1. CRM-010: Update CRM README files with the service workflow.

Then continue:

1. CRM-011: Register CRM foundation ownership.
2. CRM-012: Add Overview as the first CRM navigation item.
3. CRM-013: Add shell pages for the full service CRM flow.
4. CRM-014: Add CRM readiness panel.
5. CRM-015: Add first-load web coverage.

## 23. Required Handoff

| Item | Required In Each Final Report |
| --- | --- |
| Scope | Name the phase and task IDs. |
| Files changed | List exact files. |
| Checks passed | Report only checks actually run. |
| Checks failed | Include command and failure summary. |
| Untested paths | Name paths not verified. |
| Next task | Name the next unchecked task. |
