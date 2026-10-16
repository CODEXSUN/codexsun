# CRM

## Component documentation

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
