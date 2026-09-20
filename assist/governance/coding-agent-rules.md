# Coding Agent Rules

## Before work

1. Read the relevant `assist` guides and the target module README.
2. Inspect the current working tree before you edit files.
3. State the module owner, scope, acceptance criteria, and verification checks.
4. Stop and request a decision when a change crosses an undocumented boundary.

Read the [module architecture](../architecture/module-architecture.md) and [repository architecture rules](repository-architecture-rules.md) before module work.

## Ownership rules

- Change code only inside the selected application or package unless a public contract requires a coordinated change.
- Add reusable code to a package with a documented owner and public API.
- Do not import internal files from another application or package.
- Do not copy shared components, schemas, or contracts into an application.
- Keep application domain behavior in its owning application.
- Keep native desktop behavior in Rust and Tauri boundaries.
- Keep mobile behavior independent from desktop-only packages.
- Keep every authored file at 700 lines or fewer.
- Keep the provider, routes, controllers, services, repositories, migrations, seeders, events, and tests in the owner module folder.
- Install packages from the repository root only.
- Write all build output only to the single root `dist/` and Turborepo cache only to `dist/.turbo/<scope>/`.
- Keep one `tsconfig.json` in each app API host and one in each app web host.

## Contract and data rules

- Validate external input and environment values with Zod.
- Change TypeScript types and Zod schemas together.
- Version public HTTP APIs and document breaking changes.
- Keep SQL queries behind an application-owned repository or port.
- Add a migration for every persistent schema change.
- Give every migration and seeder an explicit canonical definition and SHA-256 checksum.
- Never edit, reorder, rename, or remove a descriptor after its checksum is recorded. Append a new serial descriptor.
- Keep seeders repeat-safe and run them only after all declared migrations succeed.
- Do not place credentials in source code, fixtures, logs, or documentation.

## Quality rules

- Format changed files with Prettier.
- Run ESLint and TypeScript checks for changed workspaces.
- Add focused tests for behavior changes.
- Run `node tools/check-module-boundaries.mjs` after module boundary changes.
- Keep module tests in the owner module `test/` folder.
- Use Playwright for user-visible web flows.
- Run a build for each affected target.
- Run `git diff --check` before handoff.
- Report passed checks, failed checks, and untested paths.

## Change control

- Preserve unrelated working-tree changes.
- Do not change generated files unless the repository requires them.
- Do not add a dependency without documenting its purpose and owner.
- Read environment values from root `.env` or an application's `.app.env`. Do not hardcode configuration values.
- Document architecture, contract, database, security, or deployment decisions before implementation when they affect multiple modules.
- Keep a task single-scope. Split cross-module work into reviewed, ordered tasks.
- Start app work from an isolated Git worktree and its app-specific Turbo scope.
- Copy the root `.env.example` and owner `.app.env.example` files into ignored local files in that worktree.
- Do not change `packages/*` from an app task without first reporting the public contract, owner, affected apps, and required review.
- Merge only after a human confirms the worktree checks, diff, and integration scope.
- Update `assist/documentation/CHAGELOG.md` for every completed repository progress change.
