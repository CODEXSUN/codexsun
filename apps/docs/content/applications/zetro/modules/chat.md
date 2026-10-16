# Zetro: Chat

This page records the `chat` module in the Zetro owner. The application business context is: permission-aware tenant ai coworker and reviewed read skills.

## Workflow role

Zetro can read only backend-authorised evidence. Draft patterns and model output cannot grant permissions or run SQL/shell actions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/zetro/api/src/modules/chat/chat.admin.routes.ts`
- `apps/zetro/api/src/modules/chat/chat.agent.ts`
- `apps/zetro/api/src/modules/chat/chat.attachment.ts`
- `apps/zetro/api/src/modules/chat/chat.completion-stream.ts`
- `apps/zetro/api/src/modules/chat/chat.file-analysis.ts`
- `apps/zetro/api/src/modules/chat/chat.migration.ts`
- `apps/zetro/api/src/modules/chat/chat.module.ts`
- `apps/zetro/api/src/modules/chat/chat.pattern.repository.ts`
- `apps/zetro/api/src/modules/chat/chat.patterns.ts`
- `apps/zetro/api/src/modules/chat/chat.policy.ts`
- `apps/zetro/api/src/modules/chat/chat.replies.ts`
- `apps/zetro/api/src/modules/chat/chat.repository.ts`
- `apps/zetro/api/src/modules/chat/chat.routes.ts`
- `apps/zetro/api/src/modules/chat/chat.seed.ts`
- `apps/zetro/api/src/modules/chat/chat.service.ts`
- `apps/zetro/api/src/modules/chat/chat.types.ts`
- `apps/zetro/api/src/modules/chat/index.ts`
- `apps/zetro/web/src/modules/chat/chat.attachment.ts`
- `apps/zetro/web/src/modules/chat/chat.drawer.tsx`
- `apps/zetro/web/src/modules/chat/chat.form.tsx`
- `apps/zetro/web/src/modules/chat/chat.hooks.ts`
- `apps/zetro/web/src/modules/chat/chat.list.tsx`
- `apps/zetro/web/src/modules/chat/chat.schema.ts`
- `apps/zetro/web/src/modules/chat/chat.services.ts`
- `apps/zetro/web/src/modules/chat/chat.types.ts`
- `apps/zetro/web/src/modules/chat/chat.workspace.tsx`
- `apps/zetro/web/src/modules/chat/index.ts`

## Explicit route declarations

- `/zetro/admin/tenants/:tenantId/approvals`
- `/zetro/admin/tenants/:tenantId/approvals/:id/decision`
- `/zetro/admin/tenants/:tenantId/conversations`
- `/zetro/admin/tenants/:tenantId/conversations/:id`
- `/zetro/admin/tenants/:tenantId/conversations/:id/notes`
- `/zetro/admin/tenants/:tenantId/grants`
- `/zetro/admin/tenants/:tenantId/grants/events`
- `/zetro/admin/tenants/:tenantId/interactions`
- `/zetro/admin/tenants/:tenantId/patterns`
- `/zetro/admin/tenants/:tenantId/roles`
- `/zetro/conversations`
- `/zetro/conversations/:id`
- `/zetro/messages`
- `/zetro/messages/stream`

## Tables created by this leaf

- `zetro_approval_requests`
- `zetro_capability_grants`
- `zetro_conversations`
- `zetro_interaction_logs`
- `zetro_messages`
- `zetro_policy_events`
- `zetro_query_patterns`
- `zetro_review_notes`
- `zetro_tool_events`

## Permission declarations

- `billing.aged-sales.read`
- `billing.aged-suppliers.read`
- `billing.application.records.view`
- `billing.customer-outstanding.read`
- `billing.customer-statement.read`
- `billing.daily-summary.read`
- `billing.export-sales-invoice.read`
- `billing.gst-statement.read`
- `billing.monthly-summary.read`
- `billing.opening-balance.read`
- `billing.payment.read`
- `billing.period-comparison.read`
- `billing.purchase.read`
- `billing.quotation.read`
- `billing.receipt.read`
- `billing.sales-invoice.read`
- `billing.stock-statement.read`
- `billing.supplier-outstanding.read`
- `billing.supplier-statement.read`
- `billing.top-customers.read`
- `billing.top-suppliers.read`
- `crm.assigned-enquiries.read`
- `crm.assignee-enquiries.read`
- `crm.contact-360.read`
- `crm.contact-person.read`
- `crm.conversion-summary.read`
- `crm.customer-enquiries.read`
- `crm.enquiry-activity.read`
- `crm.enquiry-by-number.read`
- `crm.enquiry-priority-summary.read`
- `crm.enquiry-status-summary.read`
- `crm.enquiry-work.read`
- `crm.enquiry.view`
- `crm.list-enquiries.read`
- `crm.overdue-enquiries.read`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
