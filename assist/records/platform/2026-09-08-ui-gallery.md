# Shared UI Gallery and Interface Topology

## Outcome

Platform provides a runnable UI Gallery at `/ui`.

The shared UI package owns the template and Interface Topology Inspection feature.

The Table documentation page renders the package-owned table system with ten
real rows instead of an image. Its search, app-supplied status filter, column
visibility, status marks, row actions, totals, and pagination are interactive.

## Ownership

- `packages/ui` owns the gallery, previews, component inventory, templates, and topology feature.
- The Platform UI Gallery module owns the route and navigation contribution.
- The module owns no API contract, database table, or business workflow.

## Public contracts

- Gallery template: `@codexsun/ui/templates/ui-gallery`.
- Topology feature: `@codexsun/ui/features/interface-topology`.
- Layout host: `@codexsun/ui/layouts/mdi-main`.
- Table system: `@codexsun/ui/blocks/table`.

## Table ownership

- Shared UI owns the table shell, toolbar, status, row-action menu, totals, and pagination.
- Applications supply typed rows, columns, filter state, totals, and action callbacks.
- The shared package does not own business fields, forms, routes, or workflows.
- The compact toolbar constrains search width while filters and column controls
  stay right aligned. The primary action sits at the right edge, centered against
  the title and description block.
- The shared table adds page-aware serial numbers and fixes `action` or `actions`
  columns into a narrow right-aligned lane.
- Shared filter and column menus use relaxed option rows, right-aligned selection
  ticks, and dedicated Clear and Show all controls.
- Their toolbar triggers use icons, accessible names, and hover or focus tooltips.
- Standard shared actions use the 40px default Button height. Compact table controls
  keep named icon sizes, and every enabled native button uses a pointer cursor.
- Filter and Columns now share the same shadcn menu shell and 40px option rhythm.
- Pagination buttons, rows-per-page selects, filter and column options, and row
  actions all follow the shared pointer-cursor interaction rule.
- Component documentation uses a compact canvas bar with breadcrumb context and
  a copyable package import path instead of a large repeated hero section.
- The Table code example has a separate content lane and explains the typed data,
  column, search, pagination, action, totals, and responsive scroll contracts.
- Component documentation can use named previous and next links with a small
  reduced-motion-safe hover lift. The Table page links to adjacent live docs routes.
- `UiTemplatePage` now owns the fixed component and block page structure. Pages
  supply only their kind, name, import path, live result, code, usage, navigation,
  and ITO identifiers.
- The repository skill at `assist/skills/ui-template-pages.md` defines this contract.

## Interface topology

- Every registry item uses a stable `section.block.control` technical name.
- The label switch stores its value in browser local storage.
- Selecting a label opens the inspector and selects the mapped region.
- The selected region gets a two-pixel purple inner ring.
- The floating inspector uses a white surface with purple labels and controls.
- The numbered stickers use contrasting green, blue, amber, teal, and related colors.

## Browser verification

- Opened `http://127.0.0.1:6021/ui` in the local browser.
- Confirmed all 62 component modules and four templates appear.
- Filtered the inventory to the Chart component.
- Opened the Forms preview and confirmed its live controls.
- Opened the topology inspector and enabled its numbered labels.
- Selected the Component Filter label and confirmed the selected detail and boundary ring.
- Opened the live Table page and confirmed all ten rows, filtering, totals,
  column controls, and three-dot action feedback.

## Database and API verification

- Database update: No.
- API update: No.
