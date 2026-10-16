# CRM: Contact People

This page records the `contact-people` module in the CRM owner. The application business context is: contact relationships, enquiries, assignment, work activity and estimates.

## Workflow role

Core owns shared contacts. CRM owns enquiry workflow and Contact 360 extensions; the selected source determines Local or Frappe writes.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/crm/api/src/modules/contact-people/contact-people.migration.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.module.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.repository.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.routes.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.seed.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.service.ts`
- `apps/crm/api/src/modules/contact-people/contact-people.types.ts`
- `apps/crm/api/src/modules/contact-people/index.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

- `contact_people`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
