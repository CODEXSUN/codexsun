# LogicX ERP tasks

## Responsibility

The tenant ERP overview and owned Scheme capability.

Keep Scheme validation, persistence, and UI in its leaf. The current source inventory is not evidence of a complete ERP suite or of unimplemented industry workflows.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected LogicX ERP source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node tools/check-module-boundaries.mjs logicx-erp`
- `npm run typecheck -w @codexsun/logicx-erp-api`
- `npm run lint -w @codexsun/logicx-erp-api`
- `npm run build -w @codexsun/logicx-erp-api`
- `npm run typecheck -w @codexsun/logicx-erp-web`
- `npm run lint -w @codexsun/logicx-erp-web`
- `npm run build -w @codexsun/logicx-erp-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
