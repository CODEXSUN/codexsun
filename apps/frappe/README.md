# Frappe

## Custom app reference

For Frappe schemas and functions, refer to [CODEXSUN/logicx-biz](https://github.com/CODEXSUN/logicx-biz.git).
The local reference is `D:/workspace/logicx-biz/logicx_biz/logicx_hr/doctype`.
Use the [DocType catalogue](agent/LOGICX-CRM-REFERENCE.md) and
[CRM comparison](../crm/agent/FRAPPE-COMPARISON.md) before changing adapters.
The [Duty field mapping](agent/CRM-DUTY-FIELD-MAPPING.md) defines implemented bindings and remaining remote schema limits.
Run `npm run test:crm-frappe` for the combined unit and isolated database E2E suite.
Run `npm run test:e2e:crm-duties-live` for explicit live verification using the tenant's saved verified connection.
See the field mapping's live verification section for test-record creation, cleanup, permissions, and current blockers.
Verify the target site's effective metadata before delivery. This reference does not authorize new transfer scope.

## Component documentation

### Customer import source

Customer import uses LogicX `Mobile Contact Customer`, not the person-level Frappe `Contact` DocType.
Each preview row is one mobile/customer association. Standalone `Mobile Contact` rows without a customer association are not business customers.
On import, validate the linked `Mobile Contact` and active `Customer`, then use the current Customer name and ten-digit mobile.

- One remote Customer maps to one local Core customer, even when it has several mobiles.
- Different remote Customers remain separate when they share a mobile or display name.
- Source identity includes the Frappe site origin and Customer document name. Core stores a stable `EXT-<hash>` code.
- Import links use a `mobile-customer:` namespace in `frappe_contact_imports`. Existing person Contact imports remain unchanged.
- Imported mobile numbers append to Core phone rows. Existing emails, addresses, phones, and other customer details are preserved.
- The selected-import endpoints remain `/frappe/contacts/remote` and `/frappe/contacts/pull`.
  Preview now identifies `source: mobile-contact-customer`, includes `customerId`, and returns `email: null` because the source has no email field.
- Tenant permission checks, verified connection access, and the import-complete lock remain in force. Import actions produce Platform audit events.

Core remains the local identity owner. This source change does not make CRM screens read customer data directly from Frappe.
No schema migration or automatic conversion of previously imported Contacts is required.
Do not edit generated external customer codes. Customer names and other details retain their normal local behavior.

Verification: `npm run test:e2e:frappe-mobile-customers` covers real database persistence, shared mobiles,
multiple mobiles, concurrent retries, inactive records, source-site isolation, old import links, permissions, and cutover.
On 17-10-2026, live preview read 50 associations from logicx.tmnext.in.
One live association was imported twice into a disposable Core database with the same local ID and correct mobile binding.
The disposable database was removed. No live Frappe records or existing tenant customers were changed during verification.

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
