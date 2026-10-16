# Chat: Chat

Tenant channels, direct messages, group conversations, membership, messages, and attachments. Realtime delivery and Telegram integration remain subject to signed tenant context and backend permissions.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/chat/api/src/modules/chat/chat.migration.ts`
- `apps/chat/api/src/modules/chat/chat.module.ts`
- `apps/chat/api/src/modules/chat/chat.realtime.spec.ts`
- `apps/chat/api/src/modules/chat/chat.realtime.ts`
- `apps/chat/api/src/modules/chat/chat.repository.ts`
- `apps/chat/api/src/modules/chat/chat.routes.ts`
- `apps/chat/api/src/modules/chat/chat.seed.ts`
- `apps/chat/api/src/modules/chat/chat.service.ts`
- `apps/chat/api/src/modules/chat/chat.spec.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.account-migration.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.api.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.crypto.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.migration.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.repository.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.routes.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.service.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.spec.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.sync.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.types.ts`
- `apps/chat/api/src/modules/chat/chat.telegram.worker.ts`
- `apps/chat/api/src/modules/chat/chat.types.ts`
- `apps/chat/api/src/modules/chat/index.ts`
- `apps/chat/web/src/modules/chat/chat.form.tsx`
- `apps/chat/web/src/modules/chat/chat.hooks.ts`
- `apps/chat/web/src/modules/chat/chat.list.tsx`
- `apps/chat/web/src/modules/chat/chat.schema.ts`
- `apps/chat/web/src/modules/chat/chat.services.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.hooks.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.launcher.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.schema.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.services.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.settings-workspace.tsx`
- `apps/chat/web/src/modules/chat/chat.telegram.settings.tsx`
- `apps/chat/web/src/modules/chat/chat.telegram.types.ts`
- `apps/chat/web/src/modules/chat/chat.telegram.workspace.tsx`
- `apps/chat/web/src/modules/chat/chat.types.ts`
- `apps/chat/web/src/modules/chat/chat.user-picker.tsx`
- `apps/chat/web/src/modules/chat/chat.workspace.tsx`
- `apps/chat/web/src/modules/chat/index.ts`

## Declared routes

- `/app/chat/telegram`
- `/chat/channels`
- `/chat/channels/:id`
- `/chat/channels/:id/members`
- `/chat/channels/:id/members/:memberUuid`
- `/chat/channels/:id/read`
- `/chat/channels/:id/restore`
- `/chat/channels/:id/suspend`
- `/chat/messages`
- `/chat/messages/:id`
- `/chat/messages/:id/reactions`
- `/chat/messages/:id/restore`
- `/chat/messages/:id/suspend`
- `/chat/telegram/account`
- `/chat/telegram/account/disconnect`
- `/chat/telegram/account/send-code`
- `/chat/telegram/account/verify-code`
- `/chat/telegram/account/verify-password`
- `/chat/telegram/conversations`
- `/chat/telegram/dialogs`
- `/chat/telegram/dialogs/:id/link`
- `/chat/telegram/dialogs/refresh`
- `/chat/users`

## Explicit permission checks

- `chat.manage`

## Behavior and verification

The Chat service validates channel membership before message access.
The module registers HTTP routes, realtime connections, and the optional Telegram worker.
Telegram credentials and synchronization belong to the Chat integration files.
Run the module tests for membership, messages, realtime delivery, and Telegram behavior.
Migration changes belong to Chat and must be applied through the host migration composition.
