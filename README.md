# CODEXSUN

CODEXSUN is a TypeScript application platform. The Platform host has a web
application and an API service. Product applications will follow the same
structure.

## Start here

Every contributor and coding agent must read [AGENTS.md](AGENTS.md) before
starting work. It defines the required onboarding sequence and repository
rules. Project documentation and local implementation skills are in
[assist/](assist/README.md).

All product code follows strict modular-monolith and DDD ownership rules. Read
[the golden rules](assist/governance/golden-rules.md) before creating a module.
Use [the application standard](assist/architecture/application-standard.md)
and its linked template before creating a new application runtime.
Read [the extension standard](assist/architecture/extension-standard.md) before
adding a reusable add-on, adapter, or extension point.

## Current applications

| Workspace                | Purpose                                              | Local command               | Default URL             |
| ------------------------ | ---------------------------------------------------- | --------------------------- | ----------------------- |
| `@codexsun/platform-web` | React, Vite, Tailwind, and shadcn/ui web application | `npm.cmd run dev:web`       | `http://127.0.0.1:6021` |
| `@codexsun/platform-api` | Fastify HTTP API                                     | `npm.cmd run dev:api`       | `http://127.0.0.1:6010` |
| `@codexsun/docs-web`     | Connected MDX documentation workspace                | `npm.cmd run dev:docs`      | `http://127.0.0.1:6040` |
| `@codexsun/docs-api`     | Docs vault API and HTML renderer                     | `npm.cmd run dev:docs-api`  | `http://127.0.0.1:6030` |
| `@codexsun/zetro-web`    | Agentic AI chat and task workspace                   | `npm.cmd run dev:zetro`     | `http://127.0.0.1:6060` |
| `@codexsun/zetro-api`    | Zetro Codex wrapper and task API                     | `npm.cmd run dev:zetro-api` | `http://127.0.0.1:6050` |

The API liveness check is available at `GET /health`. The dependency readiness check is available at `GET /health/ready`.

## Local development

Use Node.js 20.19 or later and npm workspaces.
Install dependencies from the repository root only. The root `.npmrc` uses
the hoisted npm strategy, and `check:workspace-layout` rejects nested
`node_modules` directories and workspace lockfiles.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run dev:api
npm.cmd run dev:web
npm.cmd run dev:zetro
npm.cmd run dev:zetro-api
```

Run checks before handing over a change:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build:api
npm.cmd run lint
npm.cmd run format:check
npm.cmd run check:workspace-layout
npm.cmd run check:app-docs
npm.cmd run check:module-docs
npm.cmd run test:framework
npm.cmd run test:platform-web
npm.cmd run test:e2e:server
npm.cmd run check
git diff --check
```

## Technology baseline

- Web: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack tools,
  Zod, Framer Motion, DnD Kit, Recharts, and Sonner.
- API: Fastify, TypeScript, Zod, Kysely, MySQL2, BullMQ, and MariaDB.
- Planned clients: Tauri desktop and Expo mobile.

## Runtime configuration and storage

Copy `.env.example` to `.env` and set the MariaDB values for your environment.
The API loads the root `.env` file. MariaDB is the primary database.

All build output goes to root `dist/`. All application files go to one central
storage root:

```text
storage/app/private  # private files. Never serve these files directly.
storage/app/public   # public files. The API serves these at /storage/.
```

The API creates these directories at startup. BullMQ is installed but needs a
documented Redis and worker plan before use.
