# UIUX Gallery Web Module

## Purpose

The application-owned gallery documents and previews the shared UI system.

## Identity and version

- Module ID: `gallery`
- Version: `1.3.1`
- Scope: `ui`
- Status: active

## Ownership

- `apps/uiux/web` owns gallery catalogs, pages, live specimens, example data, code samples,
  routes, navigation, environment, and browser state.
- `packages/ui` owns reusable primitives, components, forms, blocks, layouts, templates,
  variants, hooks, tokens, and themes.
- Live specimens import shared UI only through documented `@codexsun/ui` public exports.
- The gallery is application code and is not exported through `@codexsun/ui`.
- The gallery must not create or copy an alternate shared UI implementation.
- The module owns no database tables, business entities, API routes, or background jobs.

## Public contracts

- Root route: `/`.
- Layout selection: `/?layout=<layout-id>`.
- Page selection: `/?page=<page-id>`.
- Component selection: `/?component=<component-id>`.
- Block selection: `/?block=<block-id>`.
- Application launcher entry: `UI` on port `6130` during local development.
- Browser title and MDI identity: `UI`.
- Events published or consumed: None.

## Verification

- `npm.cmd run typecheck --workspace @codexsun/uiux-web`
- `npm.cmd run build --workspace @codexsun/uiux-web`
- `npm.cmd run check:ui-system`
- Browser verification covers Overview and layout, page, block, and component selections.

## Development records

- [2026-09-09 Independent UI application](../../../../../assist/records/ui/2026-09-09-independent-ui-application.md)
- [2026-09-10 UI Gallery application ownership](../../../../../assist/records/ui/2026-09-10-ui-gallery-application-ownership.md)
