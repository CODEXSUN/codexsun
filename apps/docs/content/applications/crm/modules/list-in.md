# CRM: List In

This page records the `list-in` module in the CRM owner. The application business context is: contact relationships, enquiries, assignment, work activity and estimates.

## Workflow role

Core owns shared contacts. CRM owns enquiry workflow and Contact 360 extensions; the selected source determines Local or Frappe writes.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/crm/api/src/modules/list-in/index.ts`
- `apps/crm/api/src/modules/list-in/list-in.migration.ts`
- `apps/crm/api/src/modules/list-in/list-in.module.ts`
- `apps/crm/api/src/modules/list-in/list-in.repository.ts`
- `apps/crm/api/src/modules/list-in/list-in.routes.ts`
- `apps/crm/api/src/modules/list-in/list-in.seed.ts`
- `apps/crm/api/src/modules/list-in/list-in.service.ts`
- `apps/crm/api/src/modules/list-in/list-in.types.ts`
- `apps/crm/web/src/modules/list-in/index.ts`
- `apps/crm/web/src/modules/list-in/list-in.form.tsx`
- `apps/crm/web/src/modules/list-in/list-in.hooks.ts`
- `apps/crm/web/src/modules/list-in/list-in.list.tsx`
- `apps/crm/web/src/modules/list-in/list-in.schema.ts`
- `apps/crm/web/src/modules/list-in/list-in.services.ts`
- `apps/crm/web/src/modules/list-in/list-in.show.tsx`
- `apps/crm/web/src/modules/list-in/list-in.types.ts`
- `apps/crm/web/src/modules/list-in/list-in.workspace.tsx`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

- `crm_enquiry_lists`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
