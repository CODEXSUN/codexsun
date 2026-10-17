# UIUX tasks

Repository source: `devkits/uiux/agent/TASK.md`

Source SHA-256 (LF line endings): `92aaca1b1318a5582a9f7b5836b77cd79459d62c2c8fcd6dae16117aa2368e45`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# UIUX tasks

## Responsibility

The design-system gallery, component examples, and live interface-topology inspection.

Render the real shared components. Keep gallery examples separate from app business behavior. Preserve the five case-sensitive Main Layout region names.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected UIUX source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `npm run typecheck -w @codexsun/uiux`
- `npm run lint -w @codexsun/uiux`
- `npm run build -w @codexsun/uiux`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
```
