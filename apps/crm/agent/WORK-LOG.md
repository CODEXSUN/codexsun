# CRM work log

## 2026-10-17 - v1.1.4

This log records the CRM work and its verification. Application changes remain local unless a live check is stated below.

### Contacts, enquiries, and tasks

- Bind contacts to the Frappe Mobile Contact customer model. Keep mobile number, customer name, code, contact type, and active status on the minimal form.
- Reject duplicate normalized phone and customer-name pairs within the same contact group on the server. Existing duplicates are retained.
- Link enquiries and optional task contacts to stored contacts, with contact creation from the forms.
- Put closure decisions inside enquiries. Show pending approval with an orange badge.
- Refresh Existing enquiries and Existing tasks without a page reload. Open the selected record and confirm before discarding an unsaved form.
- Default Tasks to Active, exclude won/lost/closed on the server, and match enquiry status filters, counts, and badge colors.
- Move List in directly after Tasks in the CRM menu.

### SOPs, duties, and reports

- Keep the SOP list and form limited to name, Department, Frequency, and Steps. Preserve identities, revisions, and hidden evidence guidance.
- Provide separate Duties and Duty Reporting lists and new/edit forms using the LogicX fields.
- Validate assignment duplicates, report ownership, report dates, and recurrence. Preserve the original assignment and instruction revision when editing a report.
- Record assignment and report edits in transaction history and queue outbound updates using the existing remote identity.
- Add Duty Reporting summaries by SOP, user, department, and frequency, plus All reports. Support date/search filters, completed/blocked totals, and matching-report drill-through.
- Require all-report permission for the web report options and summaries. Grant this permission to Admin, Manager, and Super Admin. Preserve mobile own-report access.

### Database changes

- Task contact migration: `crm.task.optional-contact-v4`.
- Assignment edit history: `crm.duty-assignment.edit-history-v2`.
- Report edit history: `crm.duty-report.edit-history-v2`.
- Applied and repeat-verified the edit-history migrations locally. Applied the local permission seed and verified the three administrative role grants.
- Production migrations and permission seeds remain pending rollout.

### Verification completed

- Local browser checks covered contact-linked forms, enquiry/task creation and refreshed recent panels, correct-record navigation, unsaved-change confirmation, SOP creation, duty creation/editing, report creation/editing, task filters/badges, and report summary drill-through.
- CRM API/web and affected Platform checks passed for types, lint, and module boundaries. Component-document checks passed.
- Focused CRM and Frappe mapping tests passed. Isolated task and duty tests covered persistence, filters, edits, summary totals, permissions, and tenant isolation.
- Live `logicx.tmnext.in` checks passed for Daily, Weekly, Monthly, and Yearly SOPs. The test created SOPs, assigned duties, submitted reports, edited assignment Index and report Date/Actions, and read back all mapped fields.
- Live edit/retry checks retained remote identities and found one report per tested SOP. The test removed all 12 remote documents; a cleanup audit found zero labelled test documents and zero disposable databases.
- The live test exercised module APIs, outbox, direct worker execution, and Frappe readback. It did not exercise the background relay scheduler.
- Earlier Android closure checks covered completion, web approval/rejection, and status updates. Native mobile checks were not repeated after the later duty/report changes.

### Remaining checks and rollout

- Deploy the application changes and apply the reviewed migrations and permission seeds to each target database.
- Verify the background relay scheduler and repeat native mobile acceptance for the final duty/report changes.
- Global web-login role restrictions were not changed; the administrative permission checks apply to the report page APIs.
- The latest scoped work did not repeat the full repository build. A separate dependency check encountered the existing `apps/tconnect/web/dist` directory.

Detailed evidence is retained in [CRM task notes](TASK.md) and [Frappe duty field mapping](../../frappe/agent/CRM-DUTY-FIELD-MAPPING.md).


## 2026-10-17: Shared mobile action drawer

- Enquiries, Tasks, and Duties use one drawer layout: Action dropdown, input form, Cancel, and Confirm & sync. Separate enquiry/task Actions navigation was removed.
- Failed submissions preserve input. Duty edits preserve the original report date and outcome. Record history refreshes after submission.
- Flutter analysis and 26 tests passed. Android emulator enquiry checkout through the new drawer appeared in the open web Actions tab without reload, with GPS and accuracy. The saved emulator session is an administrator; normal-user ownership is covered by API integration tests.
- Earlier local checks passed work-report, duty, task-contact, and closure integration flows. Production deployment and live Frappe verification were not repeated for this change.
