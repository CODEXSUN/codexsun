# Core: Common / Contacts / Contact Groups

This page records the `common/contacts/contact-groups` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.migration.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.module.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.repository.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.routes.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.seed.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.service.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/contact-groups.types.ts`
- `apps/core/api/src/modules/common/contacts/contact-groups/index.ts`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.form.tsx`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.hooks.ts`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.list.tsx`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.schema.ts`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.services.ts`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.types.ts`
- `apps/core/web/src/modules/common/contacts/contact-groups/contact-groups.workspace.tsx`
- `apps/core/web/src/modules/common/contacts/contact-groups/index.ts`

## Explicit route declarations

- `${CONTACT_GROUPS_COLLECTION_PATH}/:id`
- `${CONTACT_GROUPS_COLLECTION_PATH}/:id/activate`
- `${CONTACT_GROUPS_COLLECTION_PATH}/:id/deactivate`
- `${CONTACT_GROUPS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_contact_groups`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
