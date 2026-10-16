# Core tasks

## Responsibility

Shared tenant masters, contact and product identity, organization records, and geographic relationships.

A concrete leaf owns its schema, repository, validation, routes, seeds, and UI. Other apps use public lookup contracts rather than private Core implementations.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Core source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs core`
- `npm run typecheck -w @codexsun/core-api`
- `npm run lint -w @codexsun/core-api`
- `npm run build -w @codexsun/core-api`
- `npm run typecheck -w @codexsun/core-web`
- `npm run lint -w @codexsun/core-web`
- `npm run build -w @codexsun/core-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
