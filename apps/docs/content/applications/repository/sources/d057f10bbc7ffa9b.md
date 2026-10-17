# Blog add-on plan

Repository source: `addons/blog/agent/PLAN.md`

Source SHA-256 (LF line endings): `65ae5a16f11fd154d24494f5c3631b55a0e68e56441a112a0d493dfad8d0da7c`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# Blog add-on plan

## Scope

The host integration for the external @codexsun/blog npm package.

## Ownership contract

Vendor source remains in the published package. This folder contains integration documentation only. Keep exact version pins, integrity locks, manifest contracts, permissions, migrations, and public API/web composition aligned.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- Host dependencies: `apps/platform/api/package.json` and `apps/platform/web/package.json`.
- Public vendor exports: `@codexsun/blog/contracts`, `@codexsun/blog/api`, and `@codexsun/blog/web`.
- Registry and manifest verification: `tools/check-addon-packages.mjs`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current Blog add-on implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `npm run addons:check`
- `npm run test:addon-contract`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.
```
