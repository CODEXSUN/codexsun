# Web UI

This package is the centralized UI owner for every CODEXSUN web application.
It contains reusable primitives, application layouts, UI templates, hooks, design tokens, and the
Tailwind theme. It must not contain business forms, routes, or workflows.

## shadcn/ui

This is the shared shadcn/ui Base UI installation target for every CODEXSUN web app.
Primitives live in `src/components`, reusable application shells live in `src/layouts`,
composition examples live in `src/templates`, shared hooks live in `src/hooks`, and design tokens live in `src/tokens`. The
Tailwind v4 theme is exported as `@codexsun/ui/globals.css`.

All components exposed by the live `base-nova` registry are installed. The
Date Picker, Data Table, and Typography documentation entries are composition
recipes rather than standalone registry items; their required primitives are
included, and the dashboard template provides the requested data-table example.

Web applications must keep a matching `components.json` file that maps `ui`,
`utils`, and `hooks` to this package. Applications own only screen composition
and business-specific UI.

## Included templates

- `@codexsun/ui/templates/dashboard-01`
- `@codexsun/ui/templates/sidebar-07`
- `@codexsun/ui/templates/documentation-sidebar`
- `@codexsun/ui/templates/ui-gallery`

## Included features

- `@codexsun/ui/features/interface-topology` provides named parent banners,
  numbered child stickers, clipboard inspection, persistent label visibility,
  boundary highlighting, and registry validation.

## Included layouts

- `@codexsun/ui/layouts/mdi-main` exports the composed layout and its separate
  top-menu, app-switcher, profile, sidebar, status, empty-state, and feature
  settings components.
- `MdiMain` owns the shared shell topology. Each app adds page topology through
  the `topologySections` property and maps its regions with `useMdiTopology`.

## Interface topology rules

- Use one stable numeric ID for each parent and child item.
- Add every parent before its child items.
- Use exactly three segments for each technical name: `section.block.control`.
- Keep shared shell items in `packages/ui`.
- Keep page and business control items in the app that owns them.
