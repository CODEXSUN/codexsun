# Notes

## Component documentation

Tenant note records and their editing and lifecycle workspace.

Enforce record ownership and tenant context in the backend. Preserve content validation, lifecycle behavior, and the public Notes API surface.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `notes`.
- `web/src/modules`: `notes`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs notes`
- `npm run typecheck -w @codexsun/notes-api`
- `npm run lint -w @codexsun/notes-api`
- `npm run build -w @codexsun/notes-api`
- `npm run typecheck -w @codexsun/notes-web`
- `npm run lint -w @codexsun/notes-web`
- `npm run build -w @codexsun/notes-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/notes-api`.
- `web`: `@codexsun/notes-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/notes-api`: `.`, `./modules/notes`.
- `@codexsun/notes-web`: `.`, `./modules/notes`.
