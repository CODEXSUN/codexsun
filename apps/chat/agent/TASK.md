# Chat tasks

## Responsibility

Tenant channels, direct and group messaging, attachments, realtime delivery, and the optional Telegram integration.

Check channel membership and live permissions before record access or delivery. Keep Telegram credentials server-side and preserve tenant-scoped audit and message ownership.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Chat source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs chat`
- `npm run typecheck -w @codexsun/chat-api`
- `npm run lint -w @codexsun/chat-api`
- `npm run build -w @codexsun/chat-api`
- `npm run typecheck -w @codexsun/chat-web`
- `npm run lint -w @codexsun/chat-web`
- `npm run build -w @codexsun/chat-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.

## CRM work conversation integration - 17-10-2026

- [x] Add a public transactional work-message contract and participant-specific conversations.
- [x] Enforce active membership on channel/message reads and administration on channel lifecycle and other-user message mutations.
- [x] Extend the standard Chat permission seed to administrative and user roles.
- [x] Verify participant and unrelated-user access, company isolation, and rollback through the CRM work-report database E2E.
- [x] Seven existing realtime tests passed. Chat API/web type checks, lint, boundaries, and builds passed locally.
- [ ] Production permission rollout and deployment.
