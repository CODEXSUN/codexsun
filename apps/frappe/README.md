# Frappe

## Component documentation

Verified external connections, user mappings, imports, exports, and approved CRM integration workers.

Use the public verified connection contract. Resolve tenant credentials server-side. Queue retryable transfers and preserve parent mapping, idempotency, and audit behavior.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `activity-import`, `call-log-sync`, `connection`, `contact-import`, `crm-duty-sync`, `enquiry-sync`, `export`, `live-sync`, `user-mapping`, `user-sync`.
- `web/src/modules`: `activity-import`, `call-log-import`, `connection`, `contact-import`, `data-source`, `enquiry-sync`, `export`, `live-sync`, `overview`, `user-mapping`, `user-sync`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs frappe`
- `npm run typecheck -w @codexsun/frappe-api`
- `npm run lint -w @codexsun/frappe-api`
- `npm run build -w @codexsun/frappe-api`
- `npm run typecheck -w @codexsun/frappe-web`
- `npm run lint -w @codexsun/frappe-web`
- `npm run build -w @codexsun/frappe-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/frappe-api`.
- `web`: `@codexsun/frappe-web`.

### Declared internal dependencies

- `@codexsun/crm-api`
- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/frappe-api`: `.`.
- `@codexsun/frappe-web`: `./modules/connection`, `./modules/data-source`, `./modules/overview`, `./modules/enquiry-sync`, `./modules/contact-import`, `./modules/activity-import`, `./modules/call-log-import`, `./modules/export`, `./modules/live-sync`, `./modules/user-sync`, `./modules/user-mapping`.
