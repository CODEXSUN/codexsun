# Version Tools

## Component documentation

Repository version inspection, explicit version changes, and the single release-history workflow.

Bump versions only when requested. Preserve historical changelog entries and apply the repository versioning rules. Do not infer release or push authorization from a local version change.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- Inspect the public entry points in this component before changing its implementation.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `npm run version:show`
- `npm run check:versions`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `.`: `@codexsun/version-tools`.

### Declared internal dependencies

This owner declares no internal workspace dependency in its package manifests.

### Public package entry points

- CLI `codexsun-version`: `./version.mjs` in `@codexsun/version-tools`.
