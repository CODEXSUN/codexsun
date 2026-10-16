# Frappe: Contact Import

Frappe owns the Contact Import capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/contact-import/contact-import.module.ts`
- `apps/frappe/api/src/modules/contact-import/contact-import.routes.ts`
- `apps/frappe/api/src/modules/contact-import/contact-import.service.ts`
- `apps/frappe/api/src/modules/contact-import/contact-import.types.ts`
- `apps/frappe/api/src/modules/contact-import/index.ts`
- `apps/frappe/web/src/modules/contact-import/contact-import.services.ts`
- `apps/frappe/web/src/modules/contact-import/contact-import.types.ts`
- `apps/frappe/web/src/modules/contact-import/contact-import.workspace.tsx`
- `apps/frappe/web/src/modules/contact-import/index.ts`

## Declared routes

- `/frappe/contacts/pull`
- `/frappe/contacts/remote`
