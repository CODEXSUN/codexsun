# UI Template Page Skill

Use this guide when you add or change a component or block page in the UI workspace.

## Standard owner

- Use `UiTemplatePage` from `@codexsun/ui/templates/ui-page`.
- Keep the template source in `packages/ui/src/templates/ui-page`.
- Do not recreate the page header, width, spacing, code panel, or navigation in a documentation page.
- Use `kind="Component"` for primitives and `kind="Block"` for composed shared UI.
- Keep Table and Form in the `Blocks` navigation group. Keep package primitives in
  the `Components` group.
- Build the component navigation from the package gallery catalog. Do not maintain
  a second handwritten component list.

## Required page slots

1. Show the kind badge and item name on the left side of the header.
2. Show the public import path and copy control on the right side of the header.
3. Render a live preview across the complete 90-percent content lane.
4. Explain only the documented component or block above its copyable code.
5. End with named previous and next links that point to real documentation routes.

## Page inputs

Supply the item name, kind, import path, live preview, code, usage text, navigation, and ITO region IDs.
Keep application data and callbacks in the owning application or documentation example.
Do not put business fields, workflows, or application routes in the template.

## Interaction rules

- Use Tailwind utilities and shared shadcn primitives.
- Keep the live preview responsive. Add horizontal scrolling inside wide components such as tables.
- Keep the code panel copyable and vertically scrollable.
- Use the standard navigation hover lift. Preserve reduced-motion behavior.
- Do not use screenshots when the shared item can render as a live component.
- Do not add a previous or next link when no real destination exists.
- Use `FormBlock` and `FormLookupField` for shared form documentation. Applications
  own field values, validation, lookup options, and persistence callbacks.
- Use icon-bearing standard actions. Apply the shared smooth hover lift and preserve
  reduced-motion behavior.

## Verification

Run the shared UI type check and the consuming application build.
Run focused lint and `git diff --check`.
Open the page in a browser and check the header, preview, code copy, and navigation.
