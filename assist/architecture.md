# Architecture Baseline

## Purpose

CODEXSUN will be a web, desktop, and mobile application platform. The current foundation contains a Platform host, a generic framework, and reusable Platform Core packages.

## Current boundaries

```text
apps/platform/web  -> Platform browser host
apps/platform/api  -> Platform HTTP host
packages/framework -> module lifecycle and dependency registry
packages/platform-core -> reusable API, web, desktop, and shared packages
packages/ui -> shared shadcn primitives, application layouts, templates, hooks, tokens, and Tailwind theme
```

The web app must use documented HTTP contracts to communicate with the API. It must not import API source files. The API owns input validation, persistence integration, and background-job registration.

## Planned boundaries

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
