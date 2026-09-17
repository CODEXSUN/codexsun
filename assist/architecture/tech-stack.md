# Tech Stack Plan

## Status

This is the initial stack plan. It defines the first implementation direction for the repository.

## Core stack

| Area | Technology | Use |
| --- | --- | --- |
| Runtime | Node.js | Application and tool runtime. |
| Language | TypeScript | Type-safe application and shared code. |
| Workspace builds | Turborepo | Task orchestration and build caching. |
| Configuration | dotenv | Local environment configuration. |
| Validation | Zod | Runtime validation for inputs, configuration, and contracts. |
| Formatting | Prettier | Consistent source formatting. |
| Linting | ESLint | Static code quality checks. |
| Browser tests | Playwright | End-to-end and browser integration tests. |

## Web stack

| Area | Technology | Use |
| --- | --- | --- |
| UI | React | Browser user interfaces. |
| Styling | Tailwind CSS | Shared utility-based styling. |
| Components | shadcn/ui | Application components built on accessible primitives. |
| API server | Fastify | HTTP APIs and server integration. |

## Data and background work

| Area | Technology | Use |
| --- | --- | --- |
| SQL access | Kysely | Typed database queries and migrations. |
| Primary service database | MariaDB | Shared application data in deployed environments. |
| Local or embedded database | SQLite | Local-first, test, desktop, or isolated application data. |
| Background jobs | BullMQ | Queued and retryable jobs. |

BullMQ requires Redis. Select and document the Redis runtime before the first queued job is implemented.

## Client targets

The repository supports three client targets in parallel.

| Target | Initial technology | Boundary |
| --- | --- | --- |
| Web | React, Tailwind CSS, shadcn/ui | Runs in a browser and uses public API contracts. |
| Desktop | Tauri, Rust, Node.js, React | Tauri and Rust own native capabilities. React owns desktop user interfaces. Node.js supports tooling and optional local services. |
| Mobile | Ionic, Capacitor | Runs as a mobile application and uses public API contracts. The mobile stack may expand later through a reviewed decision. |

## Architecture boundaries

- `apps/` owns deployable products and their API, web, desktop, or mobile hosts.
- `packages/` owns reusable contracts, framework code, UI components, and shared utilities.
- `packages/ui` owns reusable web UI. Applications must not import another application's UI files.
- API contracts use TypeScript types and Zod schemas. Clients consume published contracts instead of server internals.
- Fastify routes call application services. Application services do not depend on Fastify, React, database drivers, or native clients.
- Kysely access remains behind application-owned repositories or ports.
- MariaDB and SQLite implementations must use the same application-level contract when both support the same feature.
- Rust code owns Tauri commands and native operating-system access. Web code must not access native APIs directly.
- Mobile code must not depend on desktop-only packages or Tauri APIs.

Read the [workspace runtime](../operations/workspace-runtime.md) for root dependency, output, and TypeScript rules.

Read the [configuration rules](../governance/configuration-rules.md) for environment-variable rules.

## First implementation order

1. Create the root Node.js workspace, TypeScript configuration, Turborepo tasks, Prettier, and ESLint.
2. Create shared configuration, Zod contract, and testing packages.
3. Create a Fastify API application with health checks and one versioned contract.
4. Create a React web application with Tailwind CSS and shadcn/ui.
5. Add Kysely with SQLite for local development and tests.
6. Add MariaDB support and migrations for deployed services.
7. Add Playwright coverage for the web and API flow.
8. Add BullMQ only after Redis configuration and job ownership are documented.
9. Add the Tauri desktop host with a narrow native command boundary.
10. Add the Ionic and Capacitor mobile host using the same public API contracts.

## Open decisions

- Select a Node.js version and package manager.
- Select the Redis runtime for BullMQ.
- Define authentication, authorization, observability, deployment, and backup standards.
- Define which shared packages are safe for mobile use.

Read the [module architecture](module-architecture.md) for the required ownership and composition model.
