# CODEXSUN tasks

## Responsibility

Personal requirement portals, approvals, registered devices, actor-scoped draft replay, and realtime record notifications.

Preserve revision checks and actor-scoped idempotency. Device presence and chat modes do not authorize worker execution. Keep approval decisions online.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected CODEXSUN source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs codexsun`
- `npm run typecheck -w @codexsun/codexsun-api`
- `npm run lint -w @codexsun/codexsun-api`
- `npm run build -w @codexsun/codexsun-api`
- `npm run typecheck -w @codexsun/codexsun-web`
- `npm run lint -w @codexsun/codexsun-web`
- `npm run build -w @codexsun/codexsun-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
