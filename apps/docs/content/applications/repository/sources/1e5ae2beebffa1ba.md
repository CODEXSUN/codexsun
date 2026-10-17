# Chat plan

Repository source: `apps/chat/agent/PLAN.md`

Source SHA-256 (LF line endings): `52e2fee5f8df4d80d9c67ece2f2a69f29e11914050bf7af19c05363e9b19a170`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# Chat plan

## Scope

Tenant channels, direct and group messaging, attachments, realtime delivery, and the optional Telegram integration.

## Ownership contract

Check channel membership and live permissions before record access or delivery. Keep Telegram credentials server-side and preserve tenant-scoped audit and message ownership.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `api/src/modules`: `chat`.
- `web/src/modules`: `chat`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current Chat implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `node tools/check-module-boundaries.mjs chat`
- `npm run typecheck -w @codexsun/chat-api`
- `npm run lint -w @codexsun/chat-api`
- `npm run build -w @codexsun/chat-api`
- `npm run typecheck -w @codexsun/chat-web`
- `npm run lint -w @codexsun/chat-web`
- `npm run build -w @codexsun/chat-web`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.
```
