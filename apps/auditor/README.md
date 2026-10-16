# Auditor

## Component documentation

Auditor client management and the app review overview.

Keep client records in the Auditor owner. Review screens must use authorized persisted evidence and must not imply a completed audit from a dashboard count.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `client`.
- `web/src/modules`: `client`, `overview`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs auditor`
- `npm run typecheck -w @codexsun/auditor-api`
- `npm run lint -w @codexsun/auditor-api`
- `npm run build -w @codexsun/auditor-api`
- `npm run typecheck -w @codexsun/auditor-web`
- `npm run lint -w @codexsun/auditor-web`
- `npm run build -w @codexsun/auditor-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/auditor-api`.
- `web`: `@codexsun/auditor-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/auditor-api`: `.`.
- `@codexsun/auditor-web`: `.`, `./modules/overview`, `./modules/client`, `./modules/client/gateway`.
