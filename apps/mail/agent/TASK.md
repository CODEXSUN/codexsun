# Mail tasks

## Responsibility

Tenant mail API operations and app-owned mail workspaces.

Keep message records and delivery behavior in Mail. External sends require the applicable approval, permissions, tenant context, and delivery audit.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Mail source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs mail`
- `npm run typecheck -w @codexsun/mail-api`
- `npm run lint -w @codexsun/mail-api`
- `npm run build -w @codexsun/mail-api`
- `npm run typecheck -w @codexsun/mail-web`
- `npm run lint -w @codexsun/mail-web`
- `npm run build -w @codexsun/mail-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
