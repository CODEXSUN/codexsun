# Mail: Mail

This page records the `mail` module in the Mail owner. The application business context is: tenant/company mailboxes, compose, smtp delivery and imap synchronisation.

## Workflow role

Mail owns settings, messages, attachments and events. Sending mail is a real external action and follows tenant policy.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/mail/api/src/modules/mail/index.ts`
- `apps/mail/api/src/modules/mail/mail.events.ts`
- `apps/mail/api/src/modules/mail/mail.migration.ts`
- `apps/mail/api/src/modules/mail/mail.module.ts`
- `apps/mail/api/src/modules/mail/mail.repository.ts`
- `apps/mail/api/src/modules/mail/mail.routes.ts`
- `apps/mail/api/src/modules/mail/mail.secrets.ts`
- `apps/mail/api/src/modules/mail/mail.seed.ts`
- `apps/mail/api/src/modules/mail/mail.service.ts`
- `apps/mail/api/src/modules/mail/mail.spec.ts`
- `apps/mail/api/src/modules/mail/mail.sync.ts`
- `apps/mail/api/src/modules/mail/mail.system-payload.ts`
- `apps/mail/api/src/modules/mail/mail.types.ts`
- `apps/mail/api/src/modules/mail/mail.worker.ts`
- `apps/mail/web/src/modules/mail/index.ts`
- `apps/mail/web/src/modules/mail/mail.form.tsx`
- `apps/mail/web/src/modules/mail/mail.hooks.ts`
- `apps/mail/web/src/modules/mail/mail.list.tsx`
- `apps/mail/web/src/modules/mail/mail.schema.ts`
- `apps/mail/web/src/modules/mail/mail.services.ts`
- `apps/mail/web/src/modules/mail/mail.settings.tsx`
- `apps/mail/web/src/modules/mail/mail.types.ts`
- `apps/mail/web/src/modules/mail/mail.workspace.tsx`

## Explicit route declarations

- `/mail/messages`
- `/mail/messages/:id`
- `/mail/messages/:id/restore`
- `/mail/messages/:id/trash`
- `/mail/settings`
- `/mail/summary`
- `/mail/sync`
- `/mail/test`

## Tables created by this leaf

- `mail_attachments`
- `mail_events`
- `mail_messages`
- `mail_settings`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
