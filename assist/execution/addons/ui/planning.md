# UI Package Planning

## Identity

Owner: `packages/ui`

Task prefix: `UI`

## Goal

Expand `@codexsun/ui` as the single reusable CODEXSUN design system. Applications consume published exports. Applications do not copy reusable components, blocks, pages, templates, theme tokens, or UI logic.

## Component Rules

- Add a component only after its use case, default, variants, states, accessibility, and public API are defined.
- Put one reusable control in `src/components`.
- Put reusable grouped composition in `src/blocks`, `src/pages`, or `src/templates`.
- Use semantic theme tokens, `cn`, `clsx`, and `tailwind-merge`.
- Register each published item with lifecycle metadata and example data.
- Keep application-specific composition outside `packages/ui`.

## Phases

### Phase UI-1300: Component Inventory And Contracts

- [ ] UI-1301 Inventory required components, consumer use cases, public API, and ownership.
- [ ] UI-1302 Define component request, review, registry, and deprecation policy.
- [ ] UI-1303 Define accessibility, keyboard, responsive, and visual-regression acceptance rules.

### Phase UI-1310: Base Component Expansion

- [ ] UI-1311 Add approved form and input components.
- [ ] UI-1312 Add approved navigation, feedback, and data-display components.
- [ ] UI-1313 Add approved overlay, empty, loading, error, and disabled states.

### Phase UI-1320: Composition Expansion

- [ ] UI-1321 Add approved reusable blocks.
- [ ] UI-1322 Add approved reusable pages and templates.
- [ ] UI-1323 Verify Platform, Docs, Zetro, and UIUX compatibility.

Exit: each published item has stable ownership, a default, variants, states, accessibility notes, registry metadata, tests, and consumer evidence.
