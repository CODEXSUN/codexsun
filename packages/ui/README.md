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
