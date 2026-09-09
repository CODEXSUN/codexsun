# UI Workspace Web Module

## Purpose

The UI workspace module provides an Overview and documentation pages for shared layouts,
blocks, and components.

## Identity and version

- Module ID: `ui-gallery`
- Version: `1.0.0`
- Scope: `platform`
- Status: `active`

## Ownership

- The module owns the `/ui` route and its Overview navigation contribution.
- `packages/ui` owns the Overview showcase, layout registry, previews, code examples, and reusable components.
- The module owns no entities, tables, settings, or browser storage.

## Public contracts

- UI template: `@codexsun/ui/templates/ui-gallery`.
- Route: `/ui`.
- Application launcher entry: `UI`.
- Primary sidebar action: `Overview`.
- Browser title and MDI command-bar identity: `UI` on every `/ui` route.
- Layout selection: `/ui?layout=<layout-id>`.
- Component selection: `/ui?component=<component-id>`.
- Block selection: `/ui?block=<block-id>`.
- Layout ID: `mdi-main`.
- Block IDs: `table` and `form`.
- Component IDs come from the complete shared component catalog. Table is represented
  by its composed block page instead of a duplicate primitive page.
- Every component route passes one catalog record to the package-owned
  `UiComponentDisplayPage`. It renders each owned variant as a numbered card in one
  vertical gallery. A single composition renders as `01. Default` with a green badge.
- Block pages render their composed default controls only. They do not inherit the
  component-page variant selector.
- UI navigation preserves expanded groups and its scroll position across page selection
  and browser refreshes. A new Overview session still starts with all groups collapsed.
- The MDI preview renders the package-owned `MdiMain` shell with the real top menu,
  navigation sidebar, plain workspace canvas, and status bar. It does not use an image,
  section sampler, or scaffold.
- The MDI Main page uses the shared template-page header, 90-percent live preview,
  usage and code section, and named documentation navigation.
- The Table page renders ten live sample rows through `@codexsun/ui/blocks/table`.
- The Form page renders live animated tabs, lookup fields, active state, and actions
  through `@codexsun/ui/blocks/form`.
- The Accordion page renders fixed-width Borderless and Boxed FAQ variants. A user can
  persist either variant as the default. Each card can copy or open its own code.
- The Alert page renders success, information, warning, and error callouts through one
  fixed-width live default specimen.
- The Button page renders one `Default Version` card. Its borderless three-row specimen
  contains all Button compositions without a scrollbar. Every specimen is 40px high.
- The Button Group page uses the same card pattern for nine live compositions across three
  borderless rows. Its groups wrap responsively without horizontal scrolling.
- Events published or consumed: None.

## Verification

- The Platform composition tests cover the route and module contribution.
- Browser checks cover Overview cards, layout, block, and component navigation, live
  previews, interactive sections, page links, and code copy feedback.

## Development records

- [2026-09-08 Shared UI Gallery and Interface Topology](../../../../../../assist/records/platform/2026-09-08-ui-gallery.md)
- [2026-09-08 Shared design system and workspace blocks](../../../../../../assist/records/platform/2026-09-08-shared-design-system.md)
- [2026-09-08 UI workspace reset](../../../../../../assist/records/platform/2026-09-08-ui-workspace-reset.md)
- [2026-09-08 UI layout documentation workspace](../../../../../../assist/records/platform/2026-09-08-ui-layout-documentation.md)
