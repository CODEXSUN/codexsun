# CRM

## Frappe reference and comparison

Use [CODEXSUN/logicx-biz](https://github.com/CODEXSUN/logicx-biz.git) for custom Frappe schemas and functions.
Read the [CRM comparison](agent/FRAPPE-COMPARISON.md) and
[complete DocType catalogue](../frappe/agent/LOGICX-CRM-REFERENCE.md) for the reviewed source snapshot.
CRM remains locally authoritative. Reference parity does not authorize additional outbound integration.
See the [implemented Duty bindings](../frappe/agent/CRM-DUTY-FIELD-MAPPING.md) for frequency, Department, Employee, and report fields.
Run `npm run test:crm-frappe` for CRM/Frappe unit tests and isolated Duty API/database E2E.

## Optional task contacts

Tasks can save without a contact. Below Task details, select a saved contact or enter a mobile number and customer name.
New customers resolve through Core during the task transaction. Select a customer when several share a mobile number.
Clear contact removes the task link without deleting the contact.
The task detail page links to the saved contact and shows its mobile number.
The additive `crm.task.optional-contact-v4` migration adds a nullable contact ID and a restrictive foreign key.
Existing tasks remain unlinked. Older clients that omit contact fields preserve saved links on update.
Run `npm run test:e2e:crm-task-contact` for optional, selected, inline-created, cleared, invalid, and unauthorized cases.

## Enquiry contacts and closure approvals

Enquiries use the same Core contact IDs as the CRM contact form.
Contact changes refresh the enquiry customer lookup. The enquiry Customer tab links to its saved contact.
The Closure approvals tab shows the closure request and its review actions.
Only users with server-provided review permission see Verify and close and Reject.
Approval closes the enquiry. Rejection leaves it open. Both refresh enquiry details, comments, and activity.
Closure Approvals is removed from the sidebar. Review closures inside each enquiry.
Pending closure requests show an orange badge in the enquiry list, details, and approval card.
Web enquiries refresh pending status every 15 seconds while open, including requests sent from mobile.
Run `npm run test:e2e:crm-closure` for isolated database approval, rejection, contact binding, and permission checks.

## Component documentation

### Mobile customer form

The first tab shows mobile number and customer name on the left, with code and contact type on the right.
Active status appears below.
New numbers default to Mobile and primary. Only Details is currently visible. Additional details, Tax Details, Communication, Addresses, Finance, and More are hidden.
Hidden fields remain in the save payload so edits preserve their data.
New contacts default to the saved Customer type. Users can add numbers and select one primary phone.
Create and edit require a 10-digit Mobile or WhatsApp number.
The form and CRM API reject duplicate numbers within one customer and invalid primary selections.
Different customer names or groups can share a mobile number.
Core rejects the same name and phone combination within one group, including simultaneous saves.
Core saves identity and phone rows. Existing email, tax, address, and finance fields remain available.
Imported customer codes are read-only to preserve the Frappe customer link.
These saves change local data. They do not write to Frappe.

Run `npm run test:e2e:crm-contact-upsert` for the isolated create, reload, edit, validation, and authorization checks.
The test uses the form schemas, CRM routes, Core routes, and a disposable database.
It does not certify browser interaction or deployment.

Local enquiries, contact activity, follow-up tasks, SOPs, duty assignments, and duty reporting across web and mobile.

Core owns contact identity. Local CRM records remain authoritative. Only the approved SOP and Duty outbox transfers those records to Frappe. Preserve assignment scope and activity history.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `activities`, `call-log`, `closure`, `contact`, `contact-classifications`, `contact-communication`, `contact-documents`, `contact-employments`, `contact-lifecycle`, `contact-notes`, `contact-people`, `contact-person-tags`, `contact-preferences`, `contact-profiles`, `contact-relationships`, `contact-roles`, `contact-tags`, `duty-assignment`, `duty-report`, `enquiry`, `enquiry-location`, `list-in`, `priority`, `sop`, `sop-item`, `status`, `task`.
- `web/src/modules`: `activities`, `call-log`, `closure`, `contact`, `contact-360`, `duties`, `enquiry`, `list-in`, `overview`, `priority`, `reports`, `sop`, `status`, `task`.
- `mobile/`: `android`, `assets`, `ios`, `lib`, `linux`, `macos`, `test`, `tool`, `web`, `windows`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs crm`
- `npm run typecheck -w @codexsun/crm-api`
- `npm run lint -w @codexsun/crm-api`
- `npm run build -w @codexsun/crm-api`
- `npm run typecheck -w @codexsun/crm-web`
- `npm run lint -w @codexsun/crm-web`
- `npm run build -w @codexsun/crm-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/crm-api`.
- `web`: `@codexsun/crm-web`.

### Declared internal dependencies

- `@codexsun/core-web`
- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/crm-api`: `.`, `./enquiry-sync`.
- `@codexsun/crm-web`: `.`, `./modules/overview`, `./modules/reports`, `./modules/enquiry`, `./modules/enquiry/services`, `./modules/activities`, `./modules/closure`, `./modules/call-log`, `./modules/enquiry/hooks`, `./modules/list-in`, `./modules/status`, `./modules/priority`, `./modules/contact-360`, `./modules/contact`, `./modules/task`, `./modules/sop`, `./modules/duties`.

## Existing record panels

New enquiries show up to five matches for a valid mobile number and selected contact.
Changing or clearing the mobile hides the previous matches immediately.
See more opens the same mobile and contact filter across all statuses, including closed enquiries.
New tasks show the five newest accessible tasks, independent of the main list search and page.
See all tasks opens the unfiltered task list. Record rows open their exact saved records.
Both panels refresh every 15 seconds while visible and provide a Refresh button and loading/error states.
Closure requests show an orange Closure pending badge.

## SOP workspace

SOPs use the shared enquiry-style list toolbar, search, status filters, column search,
column visibility, pagination, and row actions. Active and published badges are green;
drafts are amber, and inactive or superseded records use neutral badges.
New SOP and Edit SOP show only name, code, and purpose. Cancel protects unsaved input.
Open an SOP to manage its own items, revision history, publication, and duty assignments.
Item creation and duty assignment forms stay collapsed until needed. Instructions and
evidence guidance use multiline fields. The existing API, revision rules, and Frappe mapping remain unchanged.
