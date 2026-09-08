# Application Standard

## Purpose

This document defines the minimum foundation for every application under `apps`. Use it before adding business modules or a new platform target.

An application is a composition boundary. It owns its runtime, ports, configuration, operational behavior, and module catalog. Business behavior remains in versioned leaf modules.

Applications may compose reusable add-ons through the [extension standard](extension-standard.md). Add-ons cannot import application-private source or bypass module ownership.

## Required application files

Create these files with the application:

- `apps/<app>/README.md`, based on [the application README template](../templates/application-readme.md).
- `assist/modules/<app>.md`, based on the existing module catalog format.
- One `package.json` and one `tsconfig.json` in each runnable workspace.
- API and web module READMEs before their module code.

The application README must remain accurate for commands, addresses, environment keys, health behavior, shutdown behavior, and verification. `npm.cmd run check:app-docs` enforces its required sections and links.

## Runtime ownership

- `apps/<app>/api` owns Fastify startup, API composition, configuration, persistence adapters, workers, and shutdown.
- `apps/<app>/web` owns the React and Vite composition shell.
- `apps/<app>/desktop` owns Tauri-specific adapters when its plan is approved.
- `apps/<app>/mobile` owns Expo-specific adapters when its plan is approved.
- The application composition root registers modules. It contains no business CRUD behavior.

Read [the runtime foundation](runtime-foundation.md) before creating or changing a server. Reuse its logging, health, error-envelope, signal, and lifecycle contracts unless an approved decision documents a real application-specific difference.

## Ports and configuration

- Allocate one unique API port and one unique web port from `6000` through `6999`.
- Record the allocation in root `.env.example`, the root README, and the application README.
- Read all local settings from the root `.env`. Keep safe defaults in validated application configuration.
- Add every local service to `tools/preflight.mjs`. Add a named stack to `tools/dev-stack.mjs` when API and web must start together.
- Never stop an unrelated listener. A restart may stop only a listener verified as belonging to this workspace.

## API baseline

A new API must provide:

- A side-effect-free Fastify app builder for tests and composition.
- A separate server entry point for process startup and signals.
- Strict Zod validation for configuration and external input.
- Pino logs with secret and credential redaction.
- Stable success and error envelopes with request and correlation IDs.
- `GET /health` and `GET /health/live` for liveness.
- `GET /health/ready` for MariaDB, storage, and other required dependencies.
- Bounded graceful handling of `SIGINT`, `SIGTERM`, and supervisor IPC.

Liveness must not depend on MariaDB. Readiness must return HTTP 503 when a required dependency is unavailable.

## Web baseline

A new web workspace must:

- Use React, TypeScript, Vite, Tailwind, and shared primitives from `packages/ui`.
- Keep the root component as a thin composition shell.
- Read its API origin from a documented Vite environment key.
- Use a strict Vite port and write build output only below root `dist`.
- Split production chunks before they exceed 400 KB.

## Storage and persistence

- Store public files below `storage/app/public` and private files below `storage/app/private`.
- MariaDB is the primary database. Kysely and MySQL2 are the approved query and driver layers.
- A module owns its migrations, tables, repositories, and seeds.
- Do not enable BullMQ until Redis configuration, queue ownership, retries, idempotency, and shutdown are documented.

## Required verification

Before the first feature enters an application:

1. Run its focused type check and production build.
2. Start its API and web stack through preflight.
3. Call liveness and readiness and record expected dependency failures.
4. Start the stack a second time and confirm a controlled workspace-owned restart.
5. Send `SIGTERM` or supervisor IPC and confirm graceful exit and port release.
6. Add a production-artifact lifecycle E2E test for the API.
7. Run `npm.cmd run check:app-docs`, `npm.cmd run check`, and `git diff --check`.

Do not describe a database, browser, desktop, mobile, or E2E path as verified unless that path ran successfully.

## New application checklist

- [ ] Application boundary and owner are documented.
- [ ] API and web ports are unique and in the 6000 series.
- [ ] Root scripts start, build, type-check, and test the application.
- [ ] Preflight checks ownership and reserves each port.
- [ ] API logs, envelopes, health routes, and shutdown follow the runtime foundation.
- [ ] Root `dist`, root `node_modules`, and central storage rules are preserved.
- [ ] Every module has an internal README and app catalog entry.
- [ ] Every module or feature change has a current development record with references and bindings.
- [ ] Full validation finishes with no warning or error.
