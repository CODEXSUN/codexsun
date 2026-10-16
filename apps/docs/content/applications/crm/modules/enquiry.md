# CRM: Enquiry

This page records the `enquiry` module in the CRM owner. The application business context is: contact relationships, enquiries, assignment, work activity and estimates.

## Workflow role

Core owns shared contacts. CRM owns enquiry workflow and Contact 360 extensions; the selected source determines Local or Frappe writes.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/crm/api/src/modules/enquiry/enquiry.assistant-read.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.comment-html.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.migration.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.module.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.read-source.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.repository.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.routes.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.seed.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.service.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.types.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.view-model.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.work.repository.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.work.routes.ts`
- `apps/crm/api/src/modules/enquiry/enquiry.work.service.ts`
- `apps/crm/api/src/modules/enquiry/index.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.activity.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.attention.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.comments.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.customer-fields.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.estimates.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.filters.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.form.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.hooks.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.inline-filter.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.jobs.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.list.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.master-create.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.mobile-context.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.phone.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.properties.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.schema.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.services.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.show.tsx`
- `apps/crm/web/src/modules/enquiry/enquiry.table-text.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.types.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.view-utils.ts`
- `apps/crm/web/src/modules/enquiry/enquiry.workspace.tsx`
- `apps/crm/web/src/modules/enquiry/index.ts`

## Explicit route declarations

- `/crm/enquiries`
- `/crm/enquiries/:id`
- `/crm/enquiries/:id/activity`
- `/crm/enquiries/:id/comments`
- `/crm/enquiries/:id/estimates`
- `/crm/enquiries/:id/estimates/:childId`
- `/crm/enquiries/:id/jobs`
- `/crm/enquiries/:id/jobs/:childId`
- `/crm/enquiries/:id/jobs/:childId/stop`
- `/crm/enquiries/:id/jobs/start`
- `/crm/enquiries/:id/open-new-call`
- `/crm/enquiries/:id/properties`
- `/crm/enquiries/alerts/:alertId/read`
- `/crm/enquiries/attention`
- `/crm/enquiries/live`
- `/crm/enquiries/live/:name`
- `/crm/enquiries/live/:name/estimates`
- `/crm/enquiries/live/:name/estimates/:estimateName`
- `/crm/enquiries/live/:name/jobs`
- `/crm/enquiries/live/:name/jobs/:jobName`
- `/crm/enquiries/live/:name/jobs/:jobName/stop`
- `/crm/enquiries/live/:name/jobs/start`
- `/crm/enquiries/live/:name/messages`
- `/crm/enquiries/live/:name/messages/:messageName/suspend`
- `/crm/enquiries/live/:name/open-new-call`
- `/crm/enquiries/live/options`
- `/crm/enquiries/live/reports`
- `/crm/enquiries/live/summary`
- `/crm/enquiries/options`
- `/crm/enquiries/options/:kind`
- `/crm/enquiries/overview-activity`
- `/crm/enquiries/reports`
- `/crm/enquiries/source`
- `/crm/enquiries/summary`

## Tables created by this leaf

- `crm_enquiries`
- `crm_enquiry_activity`
- `crm_enquiry_alerts`
- `crm_enquiry_comments`
- `crm_enquiry_estimates`
- `crm_enquiry_jobs`
- `crm_enquiry_number_sequence`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
