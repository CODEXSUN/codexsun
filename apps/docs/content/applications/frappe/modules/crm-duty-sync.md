# Frappe: Crm Duty Sync

Transfers CRM SOP items, assignments, and duty reports from the tenant outbox to Frappe. Platform validates the tenant and resolves verified connection credentials before dispatch. The worker claims pending events, limits retries, and requires parent remote identities before child export.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/crm-duty-sync/crm-duty-sync.module.ts`
- `apps/frappe/api/src/modules/crm-duty-sync/crm-duty-sync.types.ts`
- `apps/frappe/api/src/modules/crm-duty-sync/crm-duty-sync.worker.ts`
- `apps/frappe/api/src/modules/crm-duty-sync/index.ts`

## Declared routes

- `/api/resource/SOP Assigned`
- `/api/resource/SOP Item`
- `/api/resource/SOP Reporting`
