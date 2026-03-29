# Setup And Run

## Prerequisites

1. Node.js 22 or later
2. npm 10 or later
3. Git with remote access configured for push and tag operations
4. MariaDB for the current primary live database target
5. PostgreSQL is optional for future hosted deployments
6. SQLite is optional for future desktop offline workflows

## Install

```bash
npm install
```

## Main Runtime Entry Points

1. Framework web app: `apps/framework`
2. Shared UI and UX package: `apps/ui`
3. Browser entry point: `apps/framework/src/main.tsx`
4. Framework runtime config: `apps/framework/src/runtime/config`
5. Framework HTTP boundary contracts: `apps/framework/src/runtime/http`
6. Framework database runtime: `apps/framework/src/runtime/database`
7. Framework database schema contracts: `apps/framework/src/runtime/database/schema`
8. Framework plugin contracts: `apps/framework/src/connectors`
9. Repository CLI and githelper: `apps/cli`
10. Open-source and module docs: `apps/docs`
11. Unified docs and execution rules: `ASSIST`

## Environment

Runtime config is currently driven from `.env`.

Important keys include:

1. `VITE_APP_TITLE`
2. `DB_HOST`
3. `DB_PORT`
4. `DB_USER`
5. `DB_PASSWORD`
6. `DB_NAME`
7. `DB_CLIENT`
8. `DB_SSL`
9. `SQLITE_FILE`

## Development Commands

```bash
npm run dev
npm run dev:framework
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run db:migration:list
npm run db:test:migrations
npm run githelper -- check
```

## Build Commands

```bash
npm run typecheck
npm run build
npm run build:web
npm run build:ui
npm run build:framework
npm run build:cli
npm run db:migrate
npm run db:migrate:down
npm run db:migration:list
npm run db:test:migrations
npm run preview:framework
npm run version:bump -- --type patch
```

## Notes

1. The repository currently implements `apps/framework`, `apps/ui`, and `apps/cli`.
2. The framework web app is built with Vite, React, Tailwind CSS, Framer Motion, and a shared UI package at `@codexsun/ui`.
3. Shared styles, theme/provider wiring, reusable primitives, and reusable UX building blocks now belong to `apps/ui`.
4. `apps/ui` builds a redistribution-ready package artifact to `build/app/ui/package` for future open-source publishing.
5. Framework runtime code now exports a first platform-foundation schema contract and ordered layer plan from the database runtime.
6. Framework runtime code now exports API namespaces, request metadata helpers, route policies, and route assemblies from `apps/framework/src/runtime/http`.
7. Framework runtime code reads one shared database environment shape and resolves MariaDB, PostgreSQL, or SQLite settings explicitly.
8. Executable framework migrations are grouped by ordered section files under `apps/framework/src/runtime/database/migrations/modules/platform/sections`.
9. `npm run db:test:migrations` runs a SQLite smoke test for the current framework migration set.
10. `npm run db:migrate` and `npm run db:migrate:down` use the active environment, so use `DB_CLIENT=sqlite` for local smoke runs when MariaDB is not available.
11. MariaDB is the default database target in `.env.example`.
12. Standalone app builds now target `build/app/<app>/<target>`.
13. Plugin or module builds now target `build/module/<module>/<target>`.
14. `apps/cli` provides `githelper` commands for version bumping, changelog checks, commit creation, and release tagging.
15. Root code-quality and formatting authority now lives in `eslint.config.mjs` and `prettier.config.mjs`.
16. Root TypeScript authority now lives in `tsconfig.json` for shared browser and workspace defaults plus `tsconfig.node.json` for shared Node-oriented package defaults.
17. Each app package should keep one `tsconfig.json`, and build-specific emit overrides should stay in package scripts instead of extra `tsconfig.*.json` files.
18. Root shared Vite helpers now live in `vite.shared.ts`, while each app keeps a thin local `vite.config.ts` for app-specific build output and mode settings.
19. Backend composition roots, live route mounting, and Electron desktop shells are still future batches.
