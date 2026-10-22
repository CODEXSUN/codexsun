# UI

## Component documentation

Shared controls, workspace primitives, layouts, styles, blocks, and interface-topology contracts.

Keep app fields, persistence, permissions, and business rules out of shared UI. Preserve accessibility, required-field feedback, action propagation, and Main Layout technical names.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `src/`: `blocks`, `components`, `design-system`, `features`, `layouts`, `lib`, `providers`, `theme`, `tokens`, `workspace`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `npm run typecheck -w @codexsun/ui`
- `npm run lint -w @codexsun/ui`
- `npm run build -w @codexsun/ui`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `.`: `@codexsun/ui`.

### Declared internal dependencies

This owner declares no internal workspace dependency in its package manifests.

### Public package entry points

- `@codexsun/ui`: `.`, `./styles.css`, `./components/*`, `./design-system`, `./features/interface-topology`, `./layouts/main-layouts`, `./layouts/*`, `./blocks/*`, `./lib/*`, `./workspace`, `./workspace/*`, `./presets/*`.

### Host-composed list navigation

`workspace/navigation` exports `WorkspaceNavigationProvider`, `WorkspaceHeaderActions`, and `useWorkspaceQueryValue`. The host supplies its router search and header action target. The provider batches query changes made in one event.
`workspace/list-tools` supplies column search controls and visibility state. Owning modules supply their column labels and record projections. It contains no business CRUD or permission decisions.
The public `WorkspaceColumnMenu` reuses the accessible multi-select Columns menu for other read-only previews; callers own labels, selected state, and data projection.
With an application header target, `WorkspaceUpsertDialog` renders a form panel in the workspace. Other hosts retain the existing dialog behavior.

`WorkspaceTable` accepts an optional `mobileRow` renderer for owner-provided compact records on narrow screens. When supplied, the mobile rows and any inline filters appear below the medium breakpoint; the sortable table remains available at wider widths. Record fields and actions stay with the owning module.

### Startup loader

The global loader uses CSS ring animations and respects reduced-motion preferences.
It does not import an animation library during application startup.
