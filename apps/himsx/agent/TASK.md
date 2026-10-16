# HIMSX tasks

## Responsibility

The tenant hospital-management app foundation and its authorized overview.

The current overview foundation is not a complete clinical system. Do not fabricate patient, treatment, payroll, or medical records to make a screen appear implemented.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected HIMSX source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs himsx`
- `npm run typecheck -w @codexsun/himsx-api`
- `npm run lint -w @codexsun/himsx-api`
- `npm run build -w @codexsun/himsx-api`
- `npm run typecheck -w @codexsun/himsx-web`
- `npm run lint -w @codexsun/himsx-web`
- `npm run build -w @codexsun/himsx-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
