# CODEXSUN Design System

## Purpose

`packages/ui` owns the shared design system for every CODEXSUN browser host.

Applications compose published UI exports. They do not create competing base templates, tokens, or control primitives.

The system uses React, Tailwind CSS, shadcn/ui-compatible primitives, `clsx`, and `tailwind-merge`.

## Design Orientation

CODEXSUN uses a focused productivity-workspace orientation.

- Default theme: neutral dark workspace.
- Alternate theme: neutral light workspace.
- Surface style: restrained layers with clear hierarchy.
- Primary action: one strong semantic action per page.
- Color use: semantic states, small indicators, and deliberate actions.
- Typography: readable body text and compact utility labels only where density requires them.
- Layout: flex and grid with spacing tokens. Repeated rows use fixed lanes for icons and actions.

Avoid decorative gradients, excessive cards, weak contrast, and application-specific base controls.

## Theme Inheritance

```text
system theme
  -> application theme selection
  -> template defaults
  -> page composition
  -> block variants
  -> component variants
```

An application may select a theme, density, and approved variant. It may not change shared semantic meanings or copy package internals.

Component defaults always apply when an application omits a variant.

## Tokens

| Token group | Default                         | Use                             |
| ----------- | ------------------------------- | ------------------------------- |
| Background  | `canvas`                        | Application background.         |
| Surface     | `surface`                       | Panels, menus, and dialogs.     |
| Text        | `foreground`                    | Default readable text.          |
| Muted       | `muted`                         | Supporting text and separators. |
| Primary     | `primary`                       | The single primary action.      |
| Success     | `success`                       | Healthy or completed state.     |
| Warning     | `warning`                       | Action needed.                  |
| Danger      | `danger`                        | Destructive or failed state.    |
| Radius      | `sm`, `md`, `lg`                | Shared component shape.         |
| Density     | `compact`, `default`, `relaxed` | Vertical rhythm.                |

Tokens must use semantic names. Components must not depend on product brand colors.

The shared CSS asset defines these token groups as CSS variables. `ThemeProvider` applies `data-theme` and `data-density` to the application root and document root. The current approved values are `dark` and `light` themes, plus `compact`, `default`, and `relaxed` density. The provider starts with `dark` and `default`.

## Component Defaults and Variants

| Component           | Default         | Required variants                                         |
| ------------------- | --------------- | --------------------------------------------------------- |
| Button              | `default`, `md` | secondary, outline, ghost, destructive, link, icon sizes. |
| Input               | `default`       | error, disabled, read-only, compact.                      |
| Select              | `default`       | error, disabled, compact.                                 |
| Checkbox and switch | `default`       | disabled, invalid.                                        |
| Badge               | `neutral`       | success, warning, danger, info.                           |
| Alert               | `info`          | success, warning, danger.                                 |
| Card                | `surface`       | flush, outlined, interactive.                             |
| Dialog              | `default`       | confirmation, destructive, full-screen.                   |
| Table               | `default`       | dense, selectable, empty, loading.                        |
| Empty state         | `default`       | error, no-results, no-access.                             |
| Skeleton            | `default`       | text, card, table, page.                                  |

The package exposes components from `components/` only. Blocks compose components. Pages compose blocks. Templates compose pages.

U-603 publishes the listed base components through `@codexsun/ui`. They use semantic tokens and documented variants. The Dialog presents an accessible modal role, title, and named close action. Focus trapping and restore remain required behavior for the later dialog interaction enhancement.

## Blocks, Pages, and Templates

| Layer    | Default               | Required variants                          |
| -------- | --------------------- | ------------------------------------------ |
| Block    | surface section       | flush, compact, split, empty, loading.     |
| Page     | standard content lane | dashboard, detail, list, form, settings.   |
| Template | MDI workspace         | simple, MDI, auth, documentation, gallery. |

The default Platform host uses the MDI template. It supplies top navigation, status, content lane, and optional application rail.

## Dynamic Registry and UIUX

Every shared component, block, page, and template must publish metadata:

- stable registry ID;
- layer and category;
- default variant and allowed variants;
- supported sizes and states;
- required props and accessibility notes;
- example data source;
- deprecation status.

`@codexsun/ui` exports this metadata as `uiRegistry`. Registry IDs use `ui.<layer>.<name>` and are immutable after publication. The registry is metadata only. It does not import an application or render a preview.

The future UIUX application reads this public registry to render a dynamic gallery. It must not import private package files or become a dependency for other applications.

The gallery includes a lower-right Tweak panel. It controls supported preview axes such as theme, density, surface style, and state. It never writes application production preferences.

U-604 adds the public `ContentSection`, `DashboardPage`, and `SettingsPage` composition exports. `MainWorkspace` is the default workspace template. U-605 wires the Platform web host through these public exports. U-606 adds the standalone `apps/devkits/uiux/web` gallery, with preview-only theme and density controls.

## Accessibility Rules

- All interactive controls require an accessible name.
- Keyboard focus is visible.
- Color never carries the only state meaning.
- Dialogs trap focus and restore it on close.
- Text and state contrast must remain readable in both themes.
- Loading, empty, error, and no-access states are required for data views.

## Implementation Sequence

1. Define semantic tokens and theme provider.
2. Define component registry and metadata contract.
3. Complete base shadcn-compatible components and their variants.
4. Complete blocks, pages, and templates.
5. Wire the default MDI template into Platform web.
6. Build UIUX as a dynamic registry gallery.
7. Verify themes, keyboard access, variants, and visible application composition with Playwright.

Do not build application-specific frontend screens before steps 1 through 4 are complete.
