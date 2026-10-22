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


## Mobile Home counts: 2026-10-17

Home includes Enquiries, Tasks, Duty, Activities, Chat, and administrator-only device Call logs. Task totals come from the server; other cards count accessible records or conversations. Counts refresh every 20 seconds. Call logs read only after permission is already granted. Failed counts show Unavailable.
The top-right bell and Chat card show unread Chat message badges, including assignment/work conversations. The bell opens the unread conversation list. It does not claim a separate push notification inbox.
Fixed duty report requests to pass query parameters separately from the URL path, restoring duty loading and counts.


## 2026-10-17: Home card and badge acceptance

- Verified all six Home destinations on the Android emulator: Enquiries, Tasks, Duty, Activities, Chat, and administrator Call Logs.
- A labeled local assignment increased active Tasks from 1 to 2 and Chat conversations from 2 to 3. Reading its conversation cleared the bell, Chat, and Task badges. A subsequent message raised the badges again; reading cleared them. Closing the labeled task through request/approval returned the active count to 1.
- Fixed Future-returning refresh callbacks in Chat, Duty, Actions, and Call Logs. Open Chat threads mark newly polled messages read and immediately refresh Home badges. The bell opens the selected conversation directly.
- Activities now shares the page data source and three-day window with its Home count. Work badges derive from unread Enquiry, Task, and Duty conversations rather than the unavailable legacy notification endpoint.
- Added Home navigation/count-refresh, unread-snapshot, and visible-thread read tests. All 29 mobile tests pass. The work-report database E2E also checks assignment unread counts, same-second messages, read clearing, and stale cursor protection.
- Emulator testing uses the saved administrator session and labeled local fixtures. User assignment isolation is covered by the isolated API E2E. No production or live Frappe change is claimed.


## 2026-10-17: Live Techmedia and Rainbow acceptance

- Connected TECHMEDIA to `techmedia_db` and RAINBOW to `rainbow_db`. Verified backups and preserved existing users.
- Deployed the checked API and web. Both tenants passed the five CRM page checks without browser warnings or errors.
- Verified normal-user Android enquiry GPS reports and duty report creation/editing against the live VPS.
- Fixed repeatable role grants, authoritative mobile role display, request timeouts, and Task completion permission mapping.
- Reconciled workspace read permissions and verified both live Application overview pages.
- Evidence and verification limits: [LIVE-VERIFICATION-2026-10-17.md](LIVE-VERIFICATION-2026-10-17.md).


## 2026-10-17: Admin and Manager role acceptance and client APKs

- Verified exact Admin and Manager sessions in both live tenants. All 88 API reads and 60 browser page checks passed.
- Fixed missing Manager read grants in Contact, Call Log, SOP, Duty, and Contact 360 owners. Duty filter lookups accept all-duty read access.
- Deployed `codexsun/api:1.1.6-crm-roles-20261017`. Preserved database records and prior runtime artifacts.
- Regression checks preserve denied Contact/SOP/Duty/Core writes for Manager. The database E2E passed.
- Built separate Techmedia and Rainbow APKs, version 1.1.6, with distinct app IDs and tenant defaults.
- Evidence: [LIVE-VERIFICATION-2026-10-17.md](LIVE-VERIFICATION-2026-10-17.md).


## 2026-10-18: Combined Actions window

- Actions is the initial Enquiry and Task detail tab. Existing Comments, Jobs, Estimate, and other detail tabs remain available.
- Removed Send report from the web action form. Add comment submits through the owning comment operation. Enquiry replies can be composed from Actions.
- The work history API combines workflow reports and audit activity, including estimate changes and task creation. Matching mirrored events appear once.
- Older report-prefixed workflow events retain their true action on read. Existing report text remains available as comments in the web view.
- Job operations immediately refresh the combined history.
- CRM API build, API/web lint, web typecheck, boundaries, and the isolated work-report database E2E passed locally. No deployment or mobile rebuild was performed.
- Task comments support threaded replies. Tasks remain independent of Enquiries, so task creation appears in that task's own history.


## 2026-10-18: Persisted enquiry WhatsApp history

- Added the Enquiry WhatsApp leaf with tracked migration `crm.enquiry-whatsapp.messages-v1`. Applied and verified `crm_enquiry_whatsapp_messages` in local `codexsun_db`.
- Stores enquiry ID, server-resolved recipient, message, request ID, signed-in author, and UTC creation time. A unique author/request key prevents duplicate retries.
- GET and POST `/crm/enquiries/:id/whatsapp-messages` use existing Enquiry permissions and record visibility. Names resolve from tenant users.
- The WhatsApp tab saves the handoff before opening WhatsApp and refreshes its history table. History records message handoff, not confirmed transmission or delivery.
- A database E2E verifies repeated migration, persistence, names, encoded message, retry reuse/conflict, missing recipient, and denied reads/writes.
- CRM API build, API/web lint, web typecheck, and CRM boundary checks passed. Live databases and APKs were not changed.


## 2026-10-18: Actions and focused-tab refresh wiring

- Comments, job edits, estimates, properties, WhatsApp handoffs, and closure request/review now invalidate the combined Actions history immediately. Actions uses the same owning comment/job/checkpoint operations as focused tabs.
- Check in / out includes a top toggle and refresh control. Both views read the signed-in user's persisted checkpoint state and invalidate the same cache after writes.
- WhatsApp handoff creation emits a transactional `whatsapp-handoff` work event. Ignored duplicate inserts do not repeat the event. Event failure rolls back the handoff.
- WhatsApp database E2E passed for one matching action per retry and rollback on event failure. Work-report database E2E passed for saved checkpoint state and action permissions.
- CRM API build, API/web lint, web typecheck, and module boundaries passed locally. No live deployment or mobile rebuild is claimed.

## 2026-10-22: CRM release 1.1.44

- Bumped the workspace to 1.1.44 and the CRM Flutter app to 1.1.44+144.
- Root release checks passed. Flutter analysis passed and all 76 mobile tests passed.
- Built signed TechMedia and Rainbow APKs. Both report version name 1.1.44 and version code 144; APK signature verification passed.
- Deployed source commit `0f71e79455c981619660a15467fada7401f59e7b` to Hostinger API, Web, and Shop. All three containers are healthy; local health/ready and public API/Web/Shop routes returned HTTP 200.
- No database migrations or seeds ran. Shared services were not recreated. No authenticated browser UX check was run.
