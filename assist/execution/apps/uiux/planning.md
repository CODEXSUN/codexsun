# UIUX Catalog Planning

## Identity

Application: UIUX

Task prefix: `U`

## Goal

Build UIUX as the visual catalog, verification host, and documentation surface for published `@codexsun/ui` items.

UIUX does not own reusable controls, theme tokens, blocks, pages, templates, or application business logic. `packages/ui` owns those public exports.

## Catalog Rules

- UIUX renders only published registry items and public package exports.
- Each catalog item shows its default, variants, states, accessibility notes, and lifecycle status.
- Preview controls select declared metadata only. They never invent props or states.
- A shared UI requirement becomes a separate approved package task.

## Phases

### Phase U-1200: Catalog Foundation

- [x] U-1201 Registry integrity and published metadata review.
- [x] U-1202 Layer filtering and accessible selected-item metadata.
- [ ] U-1203 Component preview controls for declared variants and states.
- [ ] U-1204 Block, page, and template preview composition.

### Phase U-1210: Visual Quality And Accessibility

- [ ] U-1211 Theme, density, responsive, keyboard, focus, and contrast evidence.
- [ ] U-1212 Empty, loading, error, disabled, and long-content state coverage.
- [ ] U-1213 Screenshot, Playwright, and visual-regression evidence policy.

### Phase U-1220: Design-System Handoff

- [ ] U-1221 Registry search, filters, category navigation, and copyable usage guidance.
- [ ] U-1222 Public API, deprecation, migration, and compatibility display.
- [ ] U-1223 Package-task escalation and affected-app verification workflow.

Exit: developers can select a published UI item with its supported states and know when a shared-package change is required.
