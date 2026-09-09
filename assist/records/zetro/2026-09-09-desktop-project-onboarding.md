# Zetro Desktop Project Onboarding

## Outcome

Zetro no longer treats its generated desktop application data folder as a
project. A new desktop installation shows a project connection state. A user
can select any folder inside a Git repository.

## Authoritative references

- Owner API README: `apps/zetro/api/src/modules/projects/README.md`
- Owner web README: `apps/zetro/web/src/modules/projects/README.md`
- Application catalog: `assist/modules/zetro.md`
- Architecture contract: `assist/architecture/application-standard.md`
- Local skill: `assist/skills/server-runtime.md`

## Ownership and boundaries

The Projects API validates folders and stores the resolved Git repository root.
The Projects web module owns the empty-project state and the Add project dialog.
The Tauri host supplies the native folder picker. Both hosts render the same web
module and call the same API contract.

## Binding properties

| Producer     | Consumer     | Binding                         | Version or key             |
| ------------ | ------------ | ------------------------------- | -------------------------- |
| Projects API | Projects web | Project list and create routes  | `zetro.projects.api@0.4.1` |
| Projects web | Tauri host   | Native repository folder picker | `pick_repository_folder`   |
| Tauri host   | Projects API | Generated startup marker        | `ZETRO_PROJECT_ROOT`       |

## Parallel work

The worktree contained unrelated changes. This change edited only the Zetro
project owner, composition, documentation, and focused tests.

## Decisions

- Decision: Store the Git root when a user selects a nested folder.
- Reason: A module folder identifies useful scope but Git worktrees require the repository root.
- Rejected alternative: Require the user to select the exact Git root.
- Decision: Remove only an unchanged generated desktop placeholder during startup.
- Reason: This preserves every project that a user edited or added.
- Rejected alternative: Clear the complete project registry.

## Verification

- Command: `npm.cmd run test:zetro`
- Result: All 23 Zetro API tests passed.
- Command: `npm.cmd run build:zetro`
- Result: The Zetro web and API production builds passed.
- Command: Zetro API, web, and desktop lint and type checks.
- Result: All focused lint and type checks passed.
- Command: Desktop Rust tests and `npm.cmd run desktop:zetro:msi`.
- Result: The Rust test passed and WiX produced the version 0.1.5 x64 MSI.
- Command: Documentation, dependency, line, formatting, and diff checks.
- Result: All listed repository gates passed.
- Not run: The installer was not installed over the current desktop application.

## Follow-up work

No known follow-up work remains in this change.
