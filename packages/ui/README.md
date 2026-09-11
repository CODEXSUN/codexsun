# Web UI

This package is the only source owner for reusable UI in every CODEXSUN web application.
It contains primitives, components, form frames, field controls, blocks, application layouts,
generic templates, visual variants, hooks, design-system contracts, tokens, and the Tailwind theme.

Applications must consume these items through public `@codexsun/ui` exports. They must not create
or copy an app-local reusable UI implementation. Applications own business field definitions,
validation, data, routes, permissions, callbacks, workflows, and screen composition. This package
must not contain those business contracts, application routes, persistence, or workflows.

The independent UI application owns gallery pages, catalogs, previews, specimens, examples,
code samples, routes, navigation, environment, and browser state.

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
`utils`, and `hooks` to this package. Applications own business data, fields,
validation, routes, permissions, callbacks, workflows, and screen composition.

Use Tailwind utilities for layout, spacing, color, type, state, and responsive behavior.
Do not add component stylesheets when Tailwind provides the required utility.
Use custom values only for runtime data or behavior that Tailwind cannot express.

## Design-system registry

`@codexsun/ui/design-system` is the public registry for component and block names,
package paths, supported variants, and pinned defaults. `createDesignSystemSelection`
validates programmatic app overrides and rejects unknown items or variants.

The registry also owns reusable page families. Login and Register each expose `v1` and `v2`;
Forgot Password and Notifications Page expose one default. Applications select these variants
through the same validated design-system selection instead of copying page markup.

Keep a small control as one physical primitive with typed properties. Use Button with
`variant` and `size`. Do not create separate PrimaryButton or SecondaryButton wrappers.
Move a larger reusable surface into an owned block folder with typed data, slots, and
callbacks. Applications keep business fields, routes, persistence, and workflows.

Use `resolveActionVariant` when business code starts with an action intent. For example,
`primary` resolves to the pinned Button default and `alternative` resolves to `secondary`.
This keeps intent names stable without adding wrapper components or conditional classes.

The standard shared Button is 40px high and uses content width with `px-5` text padding.
The standard icon button is 40px square. Primary, neutral, secondary, success, warning,
info, destructive, outline, ghost, and link variants use shared semantic tokens.
Icon, icon-and-text, loading, and split compositions use the same height contract.
Compact named sizes remain available for dense toolbars and icon controls. Every enabled
native button, pagination action, select control, and dropdown action uses a pointer cursor
through shared primitives and the base theme.
The Button documentation groups the complete set in one `Default Version` card. Its
borderless specimen uses three balanced rows and responsive wrapping without a scrollbar.
The Button Group documentation follows the same pattern with nine practical compositions
in three borderless rows. Its horizontal, vertical, split, icon, text, and semantic groups
use the shared 40px Button contract and wrap without a scrollbar.

## Included templates

- `@codexsun/ui/templates/dashboard-01`
- `@codexsun/ui/templates/sidebar-07`
- `@codexsun/ui/templates/documentation-sidebar`
- `@codexsun/ui/templates/ui-page` exports `UiTemplatePage`, the required component
  and block documentation composition.
- The Layout documentation includes a live Agent Workspace with two package-owned activity rails.
- `apps/uiux/web/src/modules/gallery` owns the UIUX Gallery pages, catalogs, previews, usage guidance,
  example data, and copyable examples. It consumes only public package exports.
- `UiTemplatePage` owns the kind and title header, copyable import path, 90-percent
  live preview lane, code space, and named documentation navigation.
- UI template pages keep 48px between the tool strip and live preview.
- The MDI documentation preview embeds the package-owned `MdiMain` shell. It renders
  the real top menu, navigation sidebar, plain workspace canvas, and status bar together.
- The MDI Main code section uses a numbered structure list for each shared shell region.
- Each MDI structure row opens the existing ITO inspector. Region rows select their
  matching topology section and expose its numbered child items.
- The UI gallery lists MDI Main as its only Layout page. The page uses the same
  shared documentation structure as the Table and Form block pages.

## Included blocks

- `@codexsun/ui/blocks/execution-status` provides an observed-state ring, indeterminate bar,
  elapsed label, and measured values. Applications own freshness and state mapping.
  See its [contract](src/blocks/execution-status/README.md). Spinner and Progress accept
  `animated={false}` and respect reduced motion. Progress accepts `value={null}` for unknown totals.

- `@codexsun/ui/blocks/auth` provides presentation-only client, administrator, and super-administrator login, recovery, registration, and portal blocks. Applications own routes, API calls, session state, and policy.
- `@codexsun/ui/blocks/notifications` provides a presentation-only notification inbox with typed
  records and application-owned actions.
- `@codexsun/ui/blocks/form` provides the reusable form frame, animated shared tabs,
  active-state strip, icon actions, and searchable lookup field. Applications supply
  fields, validation, lookup options, values, and persistence callbacks.
- The Form frame keeps Back, title, Cancel, and Save in one compact toolbar. Tabs start
  in a separate body surface below it. A small gap separates both surfaces.
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

Each component route resolves a dedicated live specimen instead of rendering a
category-wide gallery. `UiComponentDisplayPage` is the central component-documentation
composition. A route passes only its `UiComponentDoc` catalog record. The display page owns
the shared header, numbered cards, default state, code dialogs, usage, and navigation.
Component pages expose only variants owned by that component. Every variant, including a
single Default variant, uses the same numbered card. `resolveUiComponentVariant` is the
shared default-resolution contract. Block pages do not expose component variant galleries
and continue to compose the selected defaults.
The Accordion page provides Borderless and Boxed FAQ variants at a stable `max-w-lg`
width. It shows both variants as numbered cards in one vertical gallery. Each card can
copy its code or open that code in a dialog. The selected default persists locally.
Both variants use the shared content-height, opacity, and chevron motion contract.
The Alert page uses one default callout stack for success, information, warning, and
error messages. Each callout combines a semantic tone, icon, and short title.
The UI Overview reads the central registry and renders every component's real pinned
default. It links to the live default Table and Form block pages. It does not maintain
a separate sampler implementation.

## Theme system

- `@codexsun/ui/theme` exports the shared provider, selector, mode, and color contracts.
- Light, dark, and system modes use the shared `.dark` class contract.
- Neutral, blue, violet, emerald, and orange compositions update semantic OKLCH tokens.
- Theme preferences persist in every MDI application through shared storage keys.
- Components use semantic colors such as `primary`, `success`, `warning`, and `destructive`.

## Included features

`@codexsun/ui/hooks/use-scroll-follow` follows content updates inside a shared ScrollArea while the reader remains near its bottom.

`@codexsun/ui/components/markdown-content` renders trusted application Markdown syntax as safe structured content without interpreting embedded HTML. It owns consistent headings, lists, links, tables, quotes, inline code, and fenced-code presentation for reusable response and document surfaces.
Pass an update signal and conversation key. The hook resets on a new conversation and removes its scroll listener on unmount.
Scrolling upward pauses following. Returning within 80px of the bottom resumes it without forced smooth motion.

- `@codexsun/ui/features/interface-topology` provides named parent banners,
  numbered child stickers, a technical-name copy action, persistent label
  visibility, boundary highlighting, desk selection, and registry validation.

## Included layouts

`SidebarMenuButton` supports `variant="accented"` and `size="comfortable"` for 40px navigation rows.
Pass `isActive` and `aria-current="page"` for the selected destination. Wrap the label in a span for truncation.
Use the native `title` property for the complete stored label. The package owns contrast, spacing, focus, and the selected marker.
Agent Workspace rails also show a primary-color selection bar and outlined selected surface without moving on hover.
See the [sidebar record](../../assist/records/zetro/2026-09-10-sidebar-integration.md).

- `@codexsun/ui/layouts/agent-workspace` exports the shared Agent Workspace composition.
  It fixes a Primary Activity Rail and Secondary Utility Rail around one center canvas.
  Applications supply typed icon items, active state, badges, and selection callbacks.
- `MdiMain` accepts `agentWorkspace` to place this composition inside the MDI canvas.
  Its feature settings show independent switches for both rails when this option is present.
- MDI orders this layout as Primary Activity Rail, default sidebar, center canvas, then
  Secondary Utility Rail. The standard navigation toggle still controls the default sidebar.
- `@codexsun/ui/layouts/documentation-workspace` supplies shared Docs identity, search, sidebar
  persistence, status, and workspace defaults. Documentation applications retain navigation,
  content, editing, repository discovery, and persistence ownership.
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
- The MDI sidebar uses the primary action group inset directly below the command bar.
  It does not add a separate empty band above the primary action.
- The shared Overview action uses a neutral gray secondary surface and foreground text.
- Labeled navigation sections use compact headers. Their child links sit on an
  indented vertical rail.
- Navigation sections accept a related header icon. Their rail uses a smooth 300ms
  open and close transition with reduced-motion support.
- `sidebarStateKey` lets an application preserve expanded navigation groups and the
  sidebar scroll position for the current browser tab.
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
