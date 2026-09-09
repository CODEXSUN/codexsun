# UI Gallery Web Module

## Purpose

Gallery owns the website pages that document and preview the shared UI system.

## Identity and version

- Module ID: `gallery`
- Version: `1.3.0`
- Scope: `ui`
- Status: `active`

## Ownership

- `apps/ui/web` owns gallery catalogs, documentation pages, live specimens, example data, code
  samples, navigation, environment, and browser state.
- `packages/ui` owns the reusable primitives, blocks, layouts, generic templates, hooks,
  design-system contracts, tokens, and theme assets rendered by this module.
- Live specimens import shared UI only through documented `@codexsun/ui` public exports.
- The gallery is application code and is not exported by `@codexsun/ui`.
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

- `npm.cmd run typecheck --workspace @codexsun/ui-web`
- `npm.cmd run build --workspace @codexsun/ui-web`
- `npm.cmd run check:ui-system`
- Browser verification covers Overview and layout, page, block, and component selections.

## Development records

- [2026-09-09 Independent UI application](../../../../../assist/records/ui/2026-09-09-independent-ui-application.md)
