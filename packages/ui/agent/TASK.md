# UI tasks

## Responsibility

Shared controls, workspace primitives, layouts, styles, blocks, and interface-topology contracts.

Keep app fields, persistence, permissions, and business rules out of shared UI. Preserve accessibility, required-field feedback, action propagation, and Main Layout technical names.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected UI source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### Global loader aurora backdrop, 16-10-2026

- The fullscreen loader uses a translucent theme background with soft mint, lavender, blue, and pink aurora gradients.
- The logo and spinner retain their original colors and styling. Only the backdrop uses a mild aurora.
- Reduced motion stops the aurora and ring rotation.
- UI formatting, typecheck, lint, and build passed. Live browser appearance remains unverified.

- `npm run typecheck -w @codexsun/ui`
- `npm run lint -w @codexsun/ui`
- `npm run build -w @codexsun/ui`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
