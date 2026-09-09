# Platform Web

## Purpose

This workspace starts the Platform browser shell with React, Vite, Tailwind CSS, and shadcn/ui.

## Ownership

The source root owns browser startup and shell composition. New Platform workflows must live in `src/modules/<module>/` and follow the module standard.

## Shared UI

Use `@codexsun/ui` for reusable primitives, layouts, templates, hooks, theme
assets, and design tokens. Keep application composition and business screens
in this app.

The Platform host is the reference shadcn monorepo consumer. It uses the package-owned `@codexsun/ui/layouts/mdi-main` layout.

The `/ui` workspace supplies `UI` as its MDI application name. This keeps its
browser title and command-bar identity distinct from the Platform system workspace.

TanStack Router mounts inside the MDI child area. TanStack Query owns server state. Platform Core validates module route and navigation contributions.

The System module is the first composed workspace. It validates `GET /api/system/runtime` through the shared Zod contract.

## Verification

Run `npm.cmd run typecheck`, `npm.cmd run build`, and `npm.cmd run dev`.

Keep router values in `app-router.ts` and route fallback components in `app-router.messages.tsx`. This preserves Vite Fast Refresh without invalidation warnings.

## Development records

- [2026-09-08 Platform and framework foundation](../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
