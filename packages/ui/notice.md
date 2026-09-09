# UI Package Audit Notice

Date: 2026-09-09

## Scope

This notice records the reference audit for `packages/ui`.
The audit covered 191 source, data, and style files and 62 shared components.

Do not remove a public component only because an application does not use it today.
The `./components/*` package export makes each component part of the public package contract.

## Confirmed unreachable files

These application-owned legacy gallery compositions remain cleanup candidates when the active
gallery no longer references them:

- `apps/ui/web/src/modules/gallery/gallery-card.tsx`
- `apps/ui/web/src/modules/gallery/gallery-data.tsx`
- `apps/ui/web/src/modules/gallery/gallery-forms.tsx`
- `apps/ui/web/src/modules/gallery/gallery-foundations.tsx`
- `apps/ui/web/src/modules/gallery/gallery-overlays.tsx`
- `apps/ui/web/src/modules/gallery/gallery-workspace-blocks.tsx`

Review the final diff before removal because the working tree can contain concurrent changes.

## Gallery-only public components

These components have no application or shared runtime references.
The current UI gallery uses them as live documentation specimens:

- Accordion
- Aspect Ratio
- Attachment
- Bubble
- Button Group
- Calendar
- Carousel
- Context Menu
- Direction
- Empty
- Hover Card
- Input OTP
- Item
- Marker
- Menubar
- Message
- Message Scroller
- Native Select
- Navigation Menu
- Pagination
- Progress
- Questionnaire
- Radio Group
- Resizable
- Slider
- Sonner
- Toast

These components are not unreachable. Their public exports make removal a package contract change.
Deprecate a component before removal if applications or add-ons can consume the package externally.

## Internally required components

These components have no direct application import, but shared UI code requires them:

- Avatar
- Breadcrumb
- Chart
- Checkbox
- Combobox
- Command
- Drawer
- Field
- Input Group
- Kbd
- Popover
- Skeleton
- Spinner
- Table
- Toggle
- Toggle Group

Do not remove these components while their blocks, layouts, templates, or child components use them.

## Public modules without a direct application import

These package exports do not have a direct application consumer:

- `blocks/form`
- `blocks/workspace`
- `templates/dashboard-01`
- `templates/documentation-sidebar`
- `templates/sidebar-07`

The live UI documentation uses the Form block. Review the other exports before deprecation or removal.

## Audit result

- Directly used by applications: 19 components
- Used by shared UI code: 16 components
- Used only by the UI gallery: 27 components
- Completely unreferenced component files: 0
- Confirmed unreachable legacy files: 6
- Obvious temporary, backup, or copied files: 0

## Cleanup boundary

1. Remove only the six confirmed unreachable gallery files in the first cleanup.
2. Run the UI typecheck, lint, build, and package boundary checks.
3. Review public usage before removing a component or package export.
4. Add a deprecation record for every intentional public contract removal.
