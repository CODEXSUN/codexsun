# Project Manager

## Component documentation

Platform Registry records and Ideas workspaces with owned persistence and activity.

Keep project_manager data and business operations in this DevKit. Platform supplies authenticated actors and database context through public adapters.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `ideas`, `platform-registry`.
- `web/src/modules`: `ideas`, `platform-registry`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs project-manager`
- `npm run typecheck -w @codexsun/project-manager-api`
- `npm run lint -w @codexsun/project-manager-api`
- `npm run build -w @codexsun/project-manager-api`
- `npm run typecheck -w @codexsun/project-manager-web`
- `npm run lint -w @codexsun/project-manager-web`
- `npm run build -w @codexsun/project-manager-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/project-manager-api`.
- `web`: `@codexsun/project-manager-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/project-manager-api`: `.`, `./database`, `./modules/platform-registry`.
- `@codexsun/project-manager-web`: `.`, `./codexsun`, `./modules/*`.
