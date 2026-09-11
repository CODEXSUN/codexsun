# CODEXSUN

CODEXSUN is a TypeScript application platform. The Platform host has a web
application and an API service. Product applications will follow the same
structure.

One shared runtime holder composes these source-owned applications for local development and customer deployment. The complete development profile runs all registered applications. A customer profile selects only the applications and add-ons that enter its generated Docker stack.

## Start here

Every contributor and coding agent must read [AGENTS.md](AGENTS.md) before
starting work. It defines the required onboarding sequence and repository
rules. Use the [Assist index](assist/README.md) and its [skill router](assist/skills/README.md)
to identify the standards, owners, and records for a change.

All product code follows strict modular-monolith and DDD ownership rules. Read
[the golden rules](assist/governance/golden-rules.md) before creating a module.
Use [the application standard](assist/architecture/application-standard.md)
and its linked template before creating a new application runtime.
Read [the extension standard](assist/architecture/extension-standard.md) before
adding a reusable add-on, adapter, or extension point.

## Shared web UI ownership

`packages/ui` is the only source owner for reusable web UI. It owns all primitives,
components, form frames, field controls, blocks, layouts, templates, and visual variants.

Every web application must import these items through public `@codexsun/ui` exports.
An application must not create or copy an app-local reusable UI implementation.
Applications own business fields, validation, data, routes, permissions, callbacks,
workflows, and screen composition. They pass these values to package-owned UI.

`apps/uiux` owns the UIUX Gallery website, gallery pages, examples, specimens, and routes.
The gallery consumes public `@codexsun/ui` exports, but it is not part of `packages/ui`.

## Current applications

| Workspace                | Purpose                                              | Local command                | Default URL                   |
| ------------------------ | ---------------------------------------------------- | ---------------------------- | ----------------------------- |
| `@codexsun/platform-web` | React, Vite, Tailwind, and shadcn/ui web application | `npm.cmd run dev:web`        | `http://127.0.0.1:6021`       |
| `@codexsun/platform-api` | Fastify HTTP API                                     | `npm.cmd run dev:api`        | `http://127.0.0.1:6010`       |
| `@codexsun/uiux-web`     | Independent UIUX gallery and design-system showcase  | `npm.cmd run dev:uiux`       | `http://127.0.0.1:6130`       |
| `@codexsun/docs-web`     | Connected MDX documentation workspace                | `npm.cmd run dev:docs`       | `http://127.0.0.1:6040`       |
| `@codexsun/docs-api`     | Docs vault API and HTML renderer                     | `npm.cmd run dev:docs-api`   | `http://127.0.0.1:6030`       |
| `@codexsun/devkit-web`   | Project planning registry workspace                  | `npm.cmd run dev:devkit`     | `http://127.0.0.1:6080`       |
| `@codexsun/devkit-api`   | Project registry JSON API                            | `npm.cmd run dev:devkit-api` | `http://127.0.0.1:6070`       |
| `@codexsun/zetro-api`    | Codex chat and SQLite history API                    | `npm.cmd run dev:zetro-api`  | `http://127.0.0.1:6050`       |
| `@codexsun/zetro-web`    | Focused Zetro 2.0 chat                               | `npm.cmd run dev:zetro`      | `http://127.0.0.1:6060/zetro` |
| `@codexsun/orship-web`   | Live orchestration and service controls              | `npm.cmd run dev:orship`     | `http://127.0.0.1:6091`       |
| `@codexsun/orship-api`   | Service health, metrics, logs, and local controls    | `npm.cmd run dev:orship-api` | `http://127.0.0.1:6090`       |

The API liveness check is available at `GET /health`. The dependency readiness check is available at `GET /health/ready`.

## Local development

Use Node.js 20.19 or later and npm workspaces.
Install dependencies from the repository root only. The root `.npmrc` uses
the hoisted npm strategy, and `check:workspace-layout` rejects nested
`node_modules` directories and workspace lockfiles.

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run dev:all
npm.cmd run dev:api
npm.cmd run dev:web
npm.cmd run dev:uiux
npm.cmd run dev:zetro
npm.cmd run dev:orship
```

`npm.cmd run dev` starts Platform, UI, Docs, Zetro, and DevKit from the `main-development` profile. Orship remains separate and starts with `npm.cmd run dev:orship`.

`npm.cmd run dev:all` starts the complete `development` profile, including Orship. The focused commands start one application or component for isolated work.

Preflight builds each service's declared local package dependencies before it changes a running listener. A dependency build failure therefore keeps the existing service intact and prevents stale root-dist package exports.

## Deployment assembly

The deployable catalog is [.container/catalog.json](.container/catalog.json). Versioned profiles in [.container/profiles](.container/profiles) select applications and add-ons without changing their source. The shared [runtime holder](packages/runtime/README.md) validates dependencies and framework bindings, builds only selected workspaces, and writes generated output below `dist/deployments/<profile>`.

```powershell
npm.cmd run runtime:validate
npm.cmd run runtime:plan -- platform-only
npm.cmd run runtime:compose -- platform-only
npm.cmd run runtime:build -- platform-only
```

One generated Compose project is the combined customer deployment. Each selected API, web server, or worker remains one independently managed container. Read the [container guide](.container/README.md) and [assembly standard](assist/architecture/deployment-assembly-standard.md) before adding an application, add-on, profile, or container.

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
npm.cmd run check:module-boundaries
npm.cmd run check:module-dependencies
npm.cmd run check:versions
npm.cmd run test:framework
npm.cmd run test:runtime-holder
npm.cmd run test:orship
npm.cmd run test:platform-runtime
npm.cmd run test:platform-web
npm.cmd run test:e2e:server
npm.cmd run test:mariadb:foundation
npm.cmd run runtime:smoke -- platform-only
npm.cmd run check
git diff --check
```

## Technology baseline

- Web: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack tools,
  Zod, Framer Motion, DnD Kit, Recharts, and Sonner.
- API: Fastify, TypeScript, Zod, Kysely, MySQL2, BullMQ, and MariaDB.
- Desktop: Tauri 2 with a Rust host and a WiX MSI installer.
- Planned client: Expo mobile.

## Build acceleration

Use the [stable release workflow](assist/operations/stable-release-workflow.md) for staged Zetro delivery.
Start with [F001 framework acceptance](assist/tasks/framework-first-release.md).
The `check:release:framework`, `check:release:platform`, and `check:release:adoption` scripts validate candidates without publication.

Turbo runs workspace builds, type checks, lint checks, and package-owned tests. It follows declared workspace dependencies and stores its cache under `node_modules/.cache/turbo`. The root wrapper removes Turbo replay-log folders from workspaces after each run.

Use `npm.cmd run ci:affected` in CI to check only workspaces affected by the current Git change. The command excludes the root pseudo-workspace to prevent its wrapper scripts from calling Turbo recursively. Remote caching is not configured. Enable it only after local cache keys and environment inputs remain stable.

## Runtime configuration and storage

Copy `.env.example` to `.env` and set the MariaDB values for your environment.
The shared environment loader publishes every root `.env` value to the process environment. An external process value wins over the file. An explicit alias wins over a safe default. Each application then validates its own schema.

MariaDB is the primary database. Use the existing local server with separate administrator and application accounts:

```powershell
npm.cmd run mariadb:setup
npm.cmd run mariadb:smoke
npm.cmd run test:mariadb:foundation
```

Application runtimes and setup tools use the same `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME` contract. The setup command can use `MARIADB_ADMIN_*` as an optional setup-only override when administrator credentials must differ from the application account.

All APIs use the Platform Core observability adapter. Local preflight prints compact component-prefixed lines. Production containers emit JSON logs. Logs include application, component, version, environment, request ID, correlation ID, trace ID, and span ID when available.

OpenTelemetry trace and metric export is opt-in. Set `OTEL_SDK_DISABLED=false` and configure `OTEL_EXPORTER_OTLP_ENDPOINT` for an OTLP HTTP collector. The runtime holder keeps process control and captures component output for Orship.

Each component has a readable `.log`, a complete structured `.jsonl`, and a failure-only `.jsonl` below `storage/app/private/runtime`. Run `npm.cmd run logs:failures` to review recent failures across applications. `RUNTIME_LOG_MAX_BYTES` controls file rotation and defaults to 5 MiB.

The MariaDB foundation test uses a PID-scoped `codexsun_foundation_test_*` database and removes it after the run. It uses the administrator only for database creation and grants. All lifecycle operations run through the application account.

The runtime smoke command refuses to start when a selected port is active. Stop the selected profile before this lifecycle check.

All build output goes to root `dist/`. All application files go to one central
storage root:

```text
storage/app/private  # private files. Never serve these files directly.
storage/app/public   # public files. The API serves these at /storage/.
```

The API creates these directories at startup. BullMQ is installed but needs a
documented Redis and worker plan before use.
