# Repository Architecture Rules

## Mandatory model

Use a modular monolith, domain-driven design, and event-driven business communication.

Each business capability must have one owner module. Do not create shared business compositions, catch-all grouping folders, or duplicated business logic.

## Mandatory reuse

- All applications reuse central packages when a package provides the needed capability.
- Applications must not build duplicate frontend templates or centralized UI logic.
- Applications must not import another application's private files.
- A reusable capability must expose a public package contract and provider.
- Add-ons must remain optional until an app or deployment selects them.

## Mandatory module ownership

- Keep each module's provider, routes, controllers, services, repositories, migrations, seeders, events, and test suites inside its module folder.
- Keep module domain code private unless a documented public contract exposes it.
- Keep cross-module dependencies explicit in the provider and module README.
- Publish domain events through documented contracts.
- Do not write directly to another module's tables or repositories.

## Mandatory file limit

Every authored file must contain 700 lines or fewer.

Split a file by a meaningful module concern before it exceeds the limit. Do not bypass this rule with generated code, copied files, or compressed formatting.

## Workspace and build rules

- Install dependencies only in the root `node_modules/` directory.
- Do not create nested `node_modules/` directories in applications, packages, modules, or tools.
- Write all build artifacts only to the root `dist/` directory.
- All applications, add-ons, packages, modules, client hosts, and tools must use the single root `dist/` directory.
- Local `dist/` directories are prohibited everywhere below the repository root.
- Write Turborepo cache files only to `dist/.turbo/<scope>/`.
- Use the approved scope names: `platform`, `docs`, `orship`, `zetro`, `uiux`, `packages`, and `workspace`.
- Do not write build artifacts, generated declarations, or cache files into source folders.
- Keep exactly one TypeScript configuration in each app API host and one in each app web host.
- Use `apps/<app>/api/tsconfig.json` for the API host and `apps/<app>/web/tsconfig.json` for the web host.

## Provider rules

Each module must have a provider. The provider is the module's presence declaration.

The provider must identify the module, version, dependencies, public contracts, registration hooks, and supported events. The provider must not contain business logic.

Every provider must explicitly declare its published and consumed events. An empty declaration means the module is synchronous-only.

## Platform rules

The platform is a generic application holder. It may compose selected applications and platform-owned modules.

Platform-owned modules include identity, database management, Git repository management, and CLI integration. Product business modules remain in their owning add-on or application.

## Runtime boundary rules

- Store application files only under the root `storage/` namespace.
- Scope every stored file by its private or public class, application, and module.
- Access storage through a provider or adapter. Do not use unscoped direct filesystem access.
- Keep Docker and local container runtime material under `.container/`.
- Keep environment deployment definitions under `deployment/`.
- Do not place secrets, live data, or generated build outputs in version control.

## Development and delivery rules

- Use separate tasks or worktrees for independent changes.
- Create one branch and one Git worktree for each approved app or package task.
- Keep each worktree's `.env` and owner host `.app.env` files local and ignored.
- Build and test an app from its own worktree with its named Turbo scope.
- Do not merge a worktree into `main` without explicit manual confirmation.
- Do not refactor a shared package from an app task without first reporting the required shared-package change.
- Split shared-package changes into a separate reviewed task and worktree.
- Keep each task within one reviewed module scope.
- Integrate changes through public contracts and reviewed composition points.
- Test the affected module during development.
- Run local live checks and Docker checks before final acceptance.
- Test web, desktop, and mobile targets that the change affects.
- Move to production only after the selected deployment composition passes its checks.

## Extension rules

New capabilities such as ecommerce, ERP, CRM, and HR enter as new owner modules or add-ons. They must follow the same provider and composition model.

Keep the repository as one coordinated codebase. Support multi-developer work through Git branches, forks, and worktrees without changing module ownership.
