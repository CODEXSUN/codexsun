# CodeLoop

CodeLoop is a developer-kit application scaffold for code workflow tools. It provides an Anthropic project-styled workspace shell with project knowledge grounding and conversations, a typed Fastify API, local identity access, and an extensible foundation module.

## Ownership

CodeLoop owns `devkits/codeloop`. It uses the public `@codexsun/platform-core`, `@codexsun/framework`, and `@codexsun/ui` contracts. It does not import another application or create app-local dependency, build, or Turbo directories.

## Hosts

| Host | Default port | Local command | Health |
| --- | ---: | --- | --- |
| CodeLoop API | 6370 | `npm.cmd run dev:codeloop-api` | `http://127.0.0.1:6370/api/v1/codeloop/health` |
| CodeLoop web | 6371 | `npm.cmd run dev:codeloop-web` | `http://127.0.0.1:6371` |

## Local setup

1. From the repository root, copy `api/.app.env.example` to `api/.app.env`.
2. Copy `web/.app.env.example` to `web/.app.env`.
3. Keep the copied files local and change development credentials or secrets before sharing a machine.
4. Start both hosts with `npm.cmd run dev:codeloop` or start them separately with the host commands above.

Dependency installation runs only from the repository root. The API stores its local identity database at `storage/apps/codeloop/private/data/codeloop_db.sqlite` when it starts. `LocalIdentityStore.initialize()` applies `identity.001` through `identity.005`, records them in `identity_migration_state`, and seeds the `super-admin`, `admin`, and `user` roles plus the configured development users.

## Public API

- `GET /api/v1/codeloop/health` returns the application health state and enabled provider IDs.
- `GET /api/v1/codeloop/projects` returns the owner-scoped project registry with project instructions and knowledge selections used by the workspace switcher.
- `POST /api/v1/codeloop/auth/login` and the related identity routes provide local development access.
- `/api/internal/reference` serves the protected OpenAPI reference using `CODELOOP_API_REFERENCE_TOKEN`.
- `POST /api/v1/codeloop/terminal/exec` runs commands synchronously within workspace boundaries (`terminal.exec`).
- `POST /api/v1/codeloop/terminal/background` launches background processes (`terminal.background`).
- `POST /api/v1/codeloop/terminal/kill` terminates active processes by ID (`terminal.kill`).
- `GET /api/v1/codeloop/terminal/output/:processId` retrieves process stdout, stderr, and exit status (`terminal.output`).
- `POST /api/v1/codeloop/terminal/execute` unified tool execution route for terminal operations.

## Verification

```powershell
npm.cmd run check --workspace @codexsun/codeloop-api
npm.cmd run check --workspace @codexsun/codeloop-web
npm.cmd run lint --workspace @codexsun/codeloop-api
npm.cmd run lint --workspace @codexsun/codeloop-web
npm.cmd run test:codeloop
node tools/check-app-architecture.mjs
node tools/check-module-boundaries.mjs
node tools/check-root-layout.mjs
```

The MariaDB integration test is skipped unless `CODELOOP_MARIADB_INTEGRATION_URL` points to an explicit test database. Browser and production deployment checks are not part of this basic scaffold.
