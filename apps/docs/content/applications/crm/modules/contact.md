# Crm: Contact

Crm owns the Contact capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/contact/contact.module.ts`
- `apps/crm/api/src/modules/contact/contact.routes.test.ts`
- `apps/crm/api/src/modules/contact/contact.routes.ts`
- `apps/crm/api/src/modules/contact/contact.seed.ts`
- `apps/crm/api/src/modules/contact/contact.service.ts`
- `apps/crm/api/src/modules/contact/contact.types.ts`
- `apps/crm/api/src/modules/contact/index.ts`
- `apps/crm/web/src/modules/contact/contact.form.tsx`
- `apps/crm/web/src/modules/contact/contact.hooks.ts`
- `apps/crm/web/src/modules/contact/contact.list.tsx`
- `apps/crm/web/src/modules/contact/contact.related.tsx`
- `apps/crm/web/src/modules/contact/contact.schema.ts`
- `apps/crm/web/src/modules/contact/contact.services.ts`
- `apps/crm/web/src/modules/contact/contact.show.tsx`
- `apps/crm/web/src/modules/contact/contact.types.ts`
- `apps/crm/web/src/modules/contact/contact.workspace.tsx`
- `apps/crm/web/src/modules/contact/index.ts`

## Declared routes

- `/crm/contacts`
- `/crm/contacts/lookups`
- `/crm/contacts/lookups/contact-types`
- `/crm/contacts?search=Acme`
