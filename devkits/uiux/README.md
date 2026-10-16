# UIUX Gallery

`@codexsun/uiux` shows live examples of the shared `@codexsun/ui` design system.
`packages/ui` owns reusable components; UIUX owns gallery navigation,
specimens, and usage examples.

The Super Admin desk opens the gallery at `/sa/uiux`. The standalone gallery
runs with local specimen data. It has no API, database, or authentication
surface; the embedded desk route uses the Super Admin desk's access gate.

## Main Layout

The Main Layout page (`/uiux/main-layouts`) renders the working gallery
`AppSidebar` and workspace with the shared `TopMenu`, `AppHeader`, and
`StatusBar`. Its shell follows the five-region contract in
[`packages/ui/src/layouts/main-layouts/README.md`](../../packages/ui/src/layouts/main-layouts/README.md).

The **Blocks → App Layout** group has live pages for App Layout, Top Menu, Side
Menu, App Header, and Status Bar. Open them under `/uiux/` as `app-layout`,
`top-menu`, `side-menu`, `app-header`, and `status-bar`.
The Side Menu page uses the gallery's original `AppSidebar`.

## Components

The **Components** sidebar group has a dedicated page for each module in
`packages/ui/src/components`. For example, open Accordion at
`/uiux/components/accordion`. Each page renders the real component variants,
shows the shared component source, and links to the previous and next page.

The UIUX specimens live in `src/gallery/component-catalog.tsx`. They are a copy
of the existing catalog examples, so the original `/sa/design-system` catalog
keeps its current behavior. The Toaster, Use Mobile, and Use Toast pages cover
the support modules in the same component folder.

**Design library → Interface topology** (`/uiux/interface-topology`) inspects
the live Main Layout. It shows these regions in screen order:

| Region           | Technical name   |
| ---------------- | ---------------- |
| Top Menu         | `main.topMenu`   |
| Side Menu        | `main.sideBar`   |
| App Header       | `main.AppHeader` |
| Workspace Canvas | `main.workspace` |
| Status Bar       | `main.StatusBar` |

The gallery reads these case-sensitive values from `mainLayoutTechnicalNames`
in `@codexsun/ui/layouts/main-layouts`.

## Run

From the repository root, run `npm run dev -w @codexsun/uiux` to open the
standalone gallery at `http://127.0.0.1:7040/uiux/main-layouts`. The embedded
Super Admin desk keeps `/sa/uiux?uiux=main-layouts`. Run
`npm run typecheck -w @codexsun/uiux` and `npm run build -w @codexsun/uiux` to check
it. The existing component catalog remains at `/sa/design-system`.

## Component documentation

The design-system gallery, component examples, and live interface-topology inspection.

Render the real shared components. Keep gallery examples separate from app business behavior. Preserve the five case-sensitive Main Layout region names.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `src/`: `gallery`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `npm run typecheck -w @codexsun/uiux`
- `npm run lint -w @codexsun/uiux`
- `npm run build -w @codexsun/uiux`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `.`: `@codexsun/uiux`.

### Declared internal dependencies

- `@codexsun/ui`

### Public package entry points

- `@codexsun/uiux`: `.`.
