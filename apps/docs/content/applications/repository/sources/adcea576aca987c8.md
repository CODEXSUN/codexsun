# Hostinger Deploy tasks

Repository source: `tools/hostinger-deploy/agent/TASK.md`

Source SHA-256 (LF line endings): `cf9f80ea36630ccb5dd14a31e1e1cdb81107229699950f1b69cf12be9f23f95f`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# Hostinger Deploy tasks

## Responsibility

The pinned-host SSH status, demo checkout bootstrap, and reviewed commit synchronization tooling.

Keep private credentials outside source. Verify the configured host and separate demo checkout. A source sync does not deploy containers. Do not contact or change a host merely to update documentation.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Hostinger Deploy source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

- `node --check tools/hostinger-deploy/src/cli.mjs`
- `npm run check:versions`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
```
