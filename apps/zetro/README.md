# Zetro

## Component documentation

A permission-aware tenant business coworker with reviewed read skills and configurable model providers.

Backend skill grants and record scope remain authoritative. Prompts, files, review notes, model choice, and this documentation never grant capabilities. Keep business rules and audit behavior aligned.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `chat`, `provider`.
- `web/src/modules`: `admin`, `chat`, `provider`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs zetro`
- `npm run typecheck -w @codexsun/zetro-api`
- `npm run lint -w @codexsun/zetro-api`
- `npm run build -w @codexsun/zetro-api`
- `npm run typecheck -w @codexsun/zetro-web`
- `npm run lint -w @codexsun/zetro-web`
- `npm run build -w @codexsun/zetro-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/zetro-api`.
- `web`: `@codexsun/zetro-web`.

### Runtime rules

`agent/SKILLS.md` is the versioned business prompt loaded by the Zetro API.
Keep its business rules separate from developer instructions in `TASK.md` and `PLAN.md`.
The runtime fails closed when this file is missing or empty.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/zetro-api`: `.`.
- `@codexsun/zetro-web`: `.`, `./modules/chat`, `./modules/admin`, `./modules/provider`, `./logo`.
