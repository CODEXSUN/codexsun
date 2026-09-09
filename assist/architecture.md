# Architecture Baseline

## Purpose

CODEXSUN is a web, desktop, and mobile application platform. Platform provides
the shared foundation. Docs, DevKit, Zetro, and Orship are source-owned
applications that use that foundation.

## Current boundaries

| Boundary                            | Owner            | Purpose                                                                         |
| ----------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `apps/platform`                     | Platform         | Technical browser and HTTP composition host                                     |
| `apps/docs`                         | Docs             | Repository documentation indexing, reading, and editing                         |
| `apps/devkit`                       | DevKit           | Project planning registry and development confirmation                          |
| `apps/zetro`                        | Zetro            | Agent chat, tasks, projects, and desktop host                                   |
| `apps/orship`                       | Orship           | Local service observation and guarded controls                                  |
| `packages/framework`                | Framework        | Module lifecycle and dependency registry                                        |
| `packages/platform-core`            | Platform Core    | Reusable API, web, desktop, and shared contracts                                |
| `packages/ui`                       | UI               | Shared shadcn primitives, layouts, templates, hooks, tokens, and Tailwind theme |
| `packages/runtime` and `.container` | Runtime assembly | Deployment catalog, profile validation, and immutable plans                     |

The web app must use documented HTTP contracts to communicate with the API. It must not import API source files. The API owns input validation, persistence integration, and background-job registration.

## Future product boundaries

```text
apps/platform/{api,web}          -> current deployable Platform host
apps/crm/{api,web,desktop,mobile} -> future CRM product
apps/hr/{api,web,desktop,mobile}  -> future HR product
apps/billing/{api,web,desktop,mobile} -> future Billing product
apps/ecommerce/{api,web,desktop,mobile} -> future Ecommerce product
packages/framework               -> generic framework kernel
packages/platform-core/*         -> shared platform code
packages/ui                      -> shared web UI package for every application
```

Platform Core separates API, web, desktop, shared contracts, and mobile UI contracts. `packages/ui` owns reusable web UI primitives, application layouts, templates, design tokens, hooks, and theme assets. `@codexsun/ui/layouts/mdi-main` is the shared base frame for web applications; product workspaces remain app-owned children. Product applications can use public package contracts, but must not import another product's private source.

## Infrastructure status

MariaDB is the primary database. The root `.env` file provides its connection values. Kysely and MySQL2 provide the database layer. BullMQ is available for future Redis-backed background jobs. No schema, migrations, Redis configuration, queue names, or secrets are defined yet.

The Platform API uses Fastify with Pino logging, security headers, CORS, rate limits, pressure protection, and standard error responses. Root preflight tools reserve ports before development services start. See [runtime foundation](architecture/runtime-foundation.md).

## Build and storage

All application and package builds write below root `dist/`. Central application storage is `storage/app/private` and `storage/app/public`. The Platform API serves public files at `/storage/`. It never serves private files.
