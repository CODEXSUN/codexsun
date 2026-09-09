# UI Template Page Skill

## Use this when

Use this guide when you add or change a component, block, form, table, layout,
or UI Gallery documentation page in `packages/ui`.

Also read [Web UI](web-ui.md) when the change affects an application workspace.

## Standard owner

- Use `UiTemplatePage` from `@codexsun/ui/templates/ui-page`.
- Keep the template source in `packages/ui/src/templates/ui-page`.
- Do not recreate the page header, width, spacing, code panel, or navigation in a documentation page.
- Use `kind="Component"` for primitives, `kind="Block"` for composed shared UI, and
  `kind="Layout"` for application shells.
- Keep Table and Form in the `Blocks` navigation group. Keep package primitives in
  the `Components` group.
- Keep MDI Main as the single documented item in the `Layouts` navigation group.
- Build the component navigation from the package gallery catalog. Do not maintain
  a second handwritten component list.
- Give each component route its own live specimen. Do not reuse one category preview
  as the body of several component pages.
- Register only variants that the component actually implements through the shared
  component-variant resolver. Do not create generic display-density variants.
- Mark one variant as Default and fall back to it for missing or invalid selections.
  When a component has one variant, render it as `01. Default` with a green badge.
- Use the package-owned `UiComponentDisplayPage` for every component route. Pass only
  the selected `UiComponentDoc` catalog record. Do not rebuild its page composition.
- Show all component variants as numbered cards in one vertical gallery. Give each card
  a live specimen, a copy action, a code dialog, and a Set default action when needed.
- Keep component variant browsing on component pages. Blocks must compose only the
  resolved defaults unless a future block contract explicitly supports variants.

## Required page slots

1. Show the kind badge and item name on the left side of the header.
2. Show the public import path and copy control on the right side of the header.
3. Render a live preview across the complete 90-percent content lane.
4. Keep a 48px vertical gap between the page tool strip and the live preview.
5. Explain only the documented component or block above its copyable code.
6. End with named previous and next links that point to real documentation routes.

## Page inputs

Supply the item name, kind, import path, live preview, code, usage text, navigation, and ITO region IDs.
Use `usageTitle` when a page needs a specific structural heading instead of the default usage heading.
Keep application data and callbacks in the owning application or documentation example.
Do not put business fields, workflows, or application routes in the template.

## Interaction rules

- Use Tailwind utilities and shared shadcn primitives.
- Keep the live preview responsive. Add horizontal scrolling inside wide components such as tables.
- Keep the code panel copyable and vertically scrollable.
- Use the standard navigation hover lift. Preserve reduced-motion behavior.
- Do not use screenshots when the shared item can render as a live component.
- Render the MDI Main layout page with the package-owned `MdiMain` composition. Its
  preview must include the real top menu, sidebar, workspace canvas, and status bar.
- Keep the MDI Main documentation canvas plain. Do not place Overview content or
  sample application cards inside the layout preview.
- Title the MDI Main explanation `MDI Main structure`. Use a numbered list for the
  shell, top header, sidebar, workspace canvas, and status bar.
- Add an ITO inspection icon to each MDI structure row. Bind each region icon to the
  package-owned MDI topology section so its numbered child items open in the inspector.
- Use `embedded` for an MDI Main documentation frame. Disable viewport-level
  appearance and topology tools inside that frame.
- Keep variant-card controls and code dialogs keyboard accessible. Use icon tooltips.
- Present Accordion as Borderless and Boxed single-selection FAQs at `max-w-lg`.
  Let the user set either variant as the persistent default. Show both variants together.
  Give each variant its own copy action and code dialog.
  Use the shared panel-height, opacity, and chevron transition with reduced-motion support.
- Present Alert as one `max-w-lg` stack with success, information, warning, and error
  callouts. Pair every semantic tone with an icon and a short action-focused title.
- Present Button variants as numbered cards. Include the semantic text variants and the
  icon, icon-and-text, loading, and split compositions. Use Primary as the initial default.
- Keep standard Button specimens 40px high. Use content width, `px-5` text padding, and
  a 40px square icon size. Use compact named sizes only in dense tool strips.
- Give a long documentation sidebar a stable `sidebarStateKey`. Preserve expanded groups
  and the scroll position across navigation and refreshes within the browser tab.
- Do not add a previous or next link when no real destination exists.
- Use `FormBlock` and `FormLookupField` for shared form documentation. Applications
  own field values, validation, lookup options, and persistence callbacks.
- Keep the Form block title, Back action, Cancel action, and Save action in one compact
  top toolbar. Render the toolbar and form body as separate surfaces with a small gap.
- Use icon-bearing standard actions. Apply the shared smooth hover lift and preserve
  reduced-motion behavior.

## Verification

Run the shared UI type check and the consuming application build.
Run focused lint and `git diff --check`.
Open the page in a browser and check the header, preview, code copy, and navigation.
