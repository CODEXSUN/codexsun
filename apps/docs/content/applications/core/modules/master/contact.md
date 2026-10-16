# Core: Master / Contact

This page records the `master/contact` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/master/contact/contact.lookup.ts`
- `apps/core/api/src/modules/master/contact/contact.migration.ts`
- `apps/core/api/src/modules/master/contact/contact.module.ts`
- `apps/core/api/src/modules/master/contact/contact.repository.ts`
- `apps/core/api/src/modules/master/contact/contact.routes.ts`
- `apps/core/api/src/modules/master/contact/contact.seed.ts`
- `apps/core/api/src/modules/master/contact/contact.service.ts`
- `apps/core/api/src/modules/master/contact/contact.types.ts`
- `apps/core/api/src/modules/master/contact/index.ts`
- `apps/core/web/src/modules/master/contact/contact.form.tsx`
- `apps/core/web/src/modules/master/contact/contact.hooks.ts`
- `apps/core/web/src/modules/master/contact/contact.list.tsx`
- `apps/core/web/src/modules/master/contact/contact.quick-edit-dialog.tsx`
- `apps/core/web/src/modules/master/contact/contact.schema.ts`
- `apps/core/web/src/modules/master/contact/contact.services.ts`
- `apps/core/web/src/modules/master/contact/contact.spec.ts`
- `apps/core/web/src/modules/master/contact/contact.types.ts`
- `apps/core/web/src/modules/master/contact/contact.workspace.tsx`
- `apps/core/web/src/modules/master/contact/index.ts`

## Explicit route declarations

- `https://codexsun.com`
- `${CONTACT_COLLECTION_PATH}/:id`
- `${CONTACT_COLLECTION_PATH}/:id/${action}`
- `${CONTACT_COLLECTION_PATH}/:id/addresses`
- `${CONTACT_COLLECTION_PATH}/:id/addresses/:addressId`
- `${CONTACT_COLLECTION_PATH}/:id/force`
- `${CONTACT_COLLECTION_PATH}/next-code`

## Tables created by this leaf

- `core_contacts`
- `core_contacts_addresses`
- `core_contacts_bank_accounts`
- `core_contacts_emails`
- `core_contacts_phones`
- `core_contacts_social_links`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
