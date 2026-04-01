# Platform Startup

## Purpose

This document explains how to start the current Codexsun platform on a development machine or server.

## Current Runtime

The current working platform runs through these entry points:

1. `apps/core/api` for the suite API host
2. `apps/ecommerce/web` for the active ecommerce web app
3. `apps/core/desktop` for the current desktop shell
4. `apps/billing/api`, `apps/billing/web`, and `apps/billing/desktop` for the billing base
5. `apps/cli` for server-side control commands

This is the current runtime shape, not the final platform target. The long-term goal is to support standalone delivery for billing, commerce, CRM, ERP-style suites, and connector-focused deployments from the same repository.

## Install

```bash
npm install
```

## Environment

The suite currently depends on `.env`.

Minimum important keys:

1. `DB_ENABLED`
2. `DB_HOST`
3. `DB_PORT`
4. `DB_USER`
5. `DB_PASSWORD`
6. `DB_NAME`
7. `JWT_SECRET`
8. `WEB_DIST_ROOT`

## Development Startup

Start the current suite host API:

```bash
npm run dev:api
```

Start the ecommerce web app:

```bash
npm run dev:web
```

Start both together:

```bash
npm run dev:stack
```

Start billing web or API separately:

```bash
npm run dev:billing-api
npm run dev:billing-web
```

## Production Build

Build the current suite:

```bash
npm run build
```

Build billing separately when needed:

```bash
npm run build:billing-api
npm run build:billing-web
npm run build:billing-desktop
```

## Server Control CLI

Use the platform CLI for operational commands:

```bash
npm run cli -- help
npm run cli -- apps
npm run cli -- doctor
npm run cli -- build all
```

## Current Constraint

`apps/core/api` is still the shared host during extraction. That host may mount framework, core, and ecommerce functionality together, but business ownership must stay in the correct app folders and move toward standalone app composition over time.
