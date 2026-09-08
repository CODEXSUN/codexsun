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
- Layout selection: `/ui?layout=<layout-id>`.
- Component selection: `/ui?component=<component-id>`.
- Block selection: `/ui?block=<block-id>`.
- Layout IDs: `mdi-main`, `dashboard-01`, `sidebar-07`, and `documentation-sidebar`.
- Block IDs: `table` and `form`.
- Component IDs come from the complete shared component catalog. Table is represented
  by its composed block page instead of a duplicate primitive page.
- MDI preview sections: command bar, navigation, workspace canvas, and status bar.
- The Table page renders ten live sample rows through `@codexsun/ui/blocks/table`.
- The Form page renders live animated tabs, lookup fields, active state, and actions
  through `@codexsun/ui/blocks/form`.
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
