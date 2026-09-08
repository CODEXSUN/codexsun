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

Use Tailwind utilities for layout, spacing, color, type, state, and responsive behavior.
Do not add component stylesheets when Tailwind provides the required utility.
Use custom values only for runtime data or behavior that Tailwind cannot express.

The standard shared Button is 40px high. Compact named sizes remain available for
dense toolbars and icon controls. Every enabled native button, pagination action,
select control, and dropdown action uses a pointer cursor through shared primitives
and the base theme.

## Included templates

- `@codexsun/ui/templates/dashboard-01`
- `@codexsun/ui/templates/sidebar-07`
- `@codexsun/ui/templates/documentation-sidebar`
- `@codexsun/ui/templates/ui-gallery` provides the Platform UI Overview, layout registry,
  documentation previews, usage guidance, and copyable code examples.
- `@codexsun/ui/templates/ui-page` exports `UiTemplatePage`, the required component
  and block documentation composition.
- `UiTemplatePage` owns the kind and title header, copyable import path, 90-percent
  live preview lane, code space, and named documentation navigation.
- The MDI documentation preview is a live section browser. It separates the
  command bar, navigation, workspace canvas, and status bar into interactive views.

## Included blocks

- `@codexsun/ui/blocks/form` provides the reusable form frame, animated shared tabs,
  active-state strip, icon actions, and searchable lookup field. Applications supply
  fields, validation, lookup options, values, and persistence callbacks.
- `@codexsun/ui/blocks/table` provides the reusable TanStack Table surface: page header,
  search and column controls, shadcn table rendering, status badges, three-dot row actions,
  horizontal totals, and compact numbered pagination. Applications supply their data,
  column definitions, filter state, totals, and action callbacks.
- `DataTableBlock` supports both full workspace tables and compact section tables.
  Section tables can omit the toolbar and pagination while retaining one shared
  table surface, action lane, empty state, and accessible table semantics.
- Tables show a page-aware fixed serial-number lane by default. Columns named
  `action` or `actions` use the shared narrow right-aligned action lane.
- Table surfaces scroll horizontally on narrow screens and use the shared thin
  scrollbar treatment. The live Table documentation uses a 90-percent canvas lane.
- `DataTableFilterMenu` provides app-driven filter options with a Clear action.
  The column menu provides Show all, and both menus align selection ticks on the right.
- Filter and column triggers are compact icon-only controls with accessible names,
  hover and focus tooltips, and a non-text active-filter indicator.
- `@codexsun/ui/blocks/workspace` provides reusable page headers, metric grids,
  metric cards, section cards, and application action cards.

The UI workspace lists Form and Table under Blocks. It derives the Components
documentation list from the complete package catalog and renders each entry through
the standard live template page rather than a screenshot.

## Theme system

- `@codexsun/ui/theme` exports the shared provider, selector, mode, and color contracts.
- Light, dark, and system modes use the shared `.dark` class contract.
- Neutral, blue, violet, emerald, and orange compositions update semantic OKLCH tokens.
- Theme preferences persist in every MDI application through shared storage keys.
- Components use semantic colors such as `primary`, `success`, `warning`, and `destructive`.

## Included features

- `@codexsun/ui/features/interface-topology` provides named parent banners,
  numbered child stickers, a technical-name copy action, persistent label
  visibility, boundary highlighting, desk selection, and registry validation.

## Included layouts

- `@codexsun/ui/layouts/mdi-main` exports the composed layout and its separate
  top-menu, app-switcher, profile, sidebar, status, empty-state, and feature
  settings components.
- `MdiMain` owns the MDI Overview topology desk. Each app adds a separate desk
  through the `topologySections` property and maps regions with `useMdiTopology`.
- `showMdiOverview` exposes the shared MDI desk on the Platform `/overview`
  route. A single application desk hides the ITO selector and its inactive
  markers.
- The MDI top menu provides matching notification, application launcher, and
  profile controls. Notifications accept optional app-owned records. Profiles
  accept an optional avatar URL and use the first name letter as the fallback.
- The profile panel includes one matching theme button. Its laptop, sun, or moon
  icon reflects System, Light, or Dark and cycles through those shared modes.
- The default application launcher exposes working Platform, UI, Docs, DevKit,
  and Zetro destinations. Local development links use each application's
  documented port; deployed applications can replace them through `apps`.
- The notification trigger uses an unframed ghost icon. Its unread indicator combines a softly
  pulsing center dot with a slower ripple that fades fully before restarting.
- The compact global search button opens with a pointer or `Ctrl+K`. The dialog
  filters shared application and navigation destinations. Application search
  callbacks still receive the query. `Escape` closes the dialog.
- The MDI controls use shared Tailwind utility strings. They do not use a component stylesheet.
- The command bar and desk use a one-pixel shared-shell gap with separate sharp
  border lines, preserving the canvas surface while giving the transition slim depth.
- Framer Motion owns the unread ripple because it needs a repeated value sequence.
- Inline CSS variables are limited to runtime sidebar width and topology marker colors.
- `MdiMain` binds the shared theme provider for Platform, Docs, DevKit, and Zetro.
- The appearance panel contains the shared mode and color selector.
- The MDI sidebar starts with application navigation. It does not repeat the
  application identity from the command bar.
- Applications can supply any React content through `sidebarContent`. An
  omitted `sidebarFooter` keeps Feature settings, `null` removes the footer,
  and a React node supplies an application-owned footer.
- `deskRegionId` maps an application desk group to the complete area that
  contains its sidebar, workspace, and status surface.

## Interface topology rules

- Use one stable numeric ID for each parent and child item.
- Add every parent before its child items.
- Use exactly three segments for each technical name: `section.block.control`.
- Keep shared shell items in `packages/ui`.
- Keep page and business control items in the app that owns them.
- Show direct child stickers when their parent region is under inspection.
- Use the selected technical-name button to copy an exact ITO identifier.
- Keep shared shell regions in MDI Overview and app regions in the app desk.
