# LogicX ERP

## Component documentation

The tenant ERP overview and owned Scheme capability.

Keep Scheme validation, persistence, and UI in its leaf. The current source inventory is not evidence of a complete ERP suite or of unimplemented industry workflows.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `overview`, `scheme`.
- `web/src/modules`: `overview`, `scheme`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs logicx-erp`
- `npm run typecheck -w @codexsun/logicx-erp-api`
- `npm run lint -w @codexsun/logicx-erp-api`
- `npm run build -w @codexsun/logicx-erp-api`
- `npm run typecheck -w @codexsun/logicx-erp-web`
- `npm run lint -w @codexsun/logicx-erp-web`
- `npm run build -w @codexsun/logicx-erp-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/logicx-erp-api`.
- `web`: `@codexsun/logicx-erp-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/logicx-erp-api`: `.`.
- `@codexsun/logicx-erp-web`: `.`, `./modules/overview`, `./modules/overview/gateway`, `./modules/scheme`, `./modules/scheme/gateway`.
