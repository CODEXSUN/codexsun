# CODEXSUN

Software makes simple.

## Working Repository

This CODEXSUN CODEXSUN project is owned and developed from:

```text
D:\workspace\codexsun
```

Treat this checkout and its `https://github.com/CODEXSUN/codexsun.git` Git remote as
the current project.
Do not use files, configuration, or assumptions from older CODEXSUN/CODEXSUN
workspaces outside `D:\workspace\codexsun`.

CODEXSUN is a monorepo foundation for a multi-tenant business application
platform. The current workspace includes the Platform API, Platform web shell,
shared Framework and UI packages, composed Core and Billing business modules,
tenant-owned Mail modules, master database bootstrap, and version/changelog
tooling.

## Start

Set `CODEXSUN_TENANCY_MODE=multi` in the root `.env` for shared multi-tenant use, or
set `CODEXSUN_TENANCY_MODE=single` with `CODEXSUN_SINGLE_TENANT_CORPORATE_ID` for one
registered client. Single mode still uses a tenant database and tenant-scoped
sessions. The configured tenant must be the only tenant in the master registry.
For containers, set these values in `.container/deploy.env` instead of root `.env`.
Create a separate `.container/deploy.env` for this application. Do not reuse a
deployment file or persistent volumes from the previous application.

```bash
npm install
npm run dev
```

The single root command starts the Platform API, Platform web shell, and separate Ecommerce frontend together.
It supervises each process separately. An API restart does not stop the web process,
and a web restart does not stop the API process.

The API watcher restarts after backend source or `.env` changes. Vite updates frontend
source through hot reload and restarts its server when its configuration changes. The
supervisor also restarts only the unhealthy process after sustained health-check failures.
Development startup replaces a known CODEXSUN listener on its configured API or web port.
It stops the previous CODEXSUN watcher or supervisor process tree before starting fresh.
Set `CODEXSUN_DEV_PORT_POLICY=abort` to refuse a port takeover, or `force` to replace
an unrelated listener on the configured port. Normal API restarts and shutdowns
run HTTP and application close hooks before the process exits.

Use `npm run dev:api`, `npm run dev:web`, `npm run dev:ecommerce`, or `npm run dev:storefront` when you need only one development process.
The separate web command waits for a healthy API before it starts.
Use one runner for each service; an IDE that relaunches a stopped process can race another runner.

Core, Billing, and Mail attach as packages; they have no standalone development
entrypoints.

Install dependencies only from this repository root. All apps, packages, and
tools resolve dependencies from the root `node_modules`; workspace-local
`node_modules` folders are removed automatically and rejected by
`npm run dependencies:check`.

Platform API: <http://127.0.0.1:7010>

Platform web: <http://127.0.0.1:7020>

Ecommerce web: <http://127.0.0.1:7030> (`CODEXSUN_ECOMMERCE_WEB_PORT`)

Ecommerce public shop: <http://127.0.0.1:7030/shop>

UIUX gallery: <http://127.0.0.1:7040/uiux/main-layouts> (`CODEXSUN_UIUX_WEB_PORT`)

Project Manager: <http://127.0.0.1:7050/registry> (`CODEXSUN_PROJECT_MANAGER_WEB_PORT`)

## Docker Deployment

Docker deployment files live in `.container/`. Shared MariaDB, Redis, and
Media services are installed once alongside the composed Platform API and web
runtime.

```bash
bash prepare-env.sh
bash setup.sh
```

`prepare-env.sh` creates or updates the private `.container/deploy.env` from
`.container/deploy.env.sample`. It never reads or copies the development
`.env`. `setup.sh` only validates the prepared deployment file before applying
the container installation.

A Linux deployment host needs Docker and Compose, but does not need Node.js or
npm installed: environment preparation runs through the declared Docker Node
image when host Node.js is unavailable. Press Enter at a credential prompt to
preserve its existing deployment value.

For a non-interactive host where administrator credentials already exist in
`.container/deploy.env`, run:

```bash
bash prepare-env.sh --non-interactive
bash setup.sh --yes
```

For repeated local deployments, open the cleanup menu before reinstalling:

```bash
bash setup.sh --clean
```

The menu offers application-only cleanup, complete runtime cleanup while
preserving all data, or full local data cleanup including MariaDB, Redis, File
Browser, application storage, named volumes, and the CODEXSUN network. Docker
build-cache pruning is a separate optional choice.

On Windows, use Git Bash explicitly when `bash` resolves to WSL but no Linux
distribution is installed:

```powershell
& "C:\Program Files\Git\bin\bash.exe" setup.sh
```

After pulling or copying an updated checkout, validate the existing deployment
without changing it:

```bash
bash update.sh --check
```

Apply a guarded source update interactively, or use `--yes` on an automated
deployment host:

```bash
bash update.sh
bash update.sh --yes
```

MariaDB is exposed at the host binding and port declared in
`.container/deploy.env`. Root `.env` is development-only; container setup,
updates, migrations, and smoke checks read only `.container/deploy.env`. Normal
updates preserve configuration, credentials, databases, uploads, and named
volumes. The updater verifies Compose ownership before any build, creates a
validated MariaDB backup before migration, replaces only `codexsun-api` and
`codexsun-web`, runs the complete deployment smoke test, and restores the previous
application images if replacement fails. See `.container/README.md` for the
full port map, registry flow, persistence contract, and verification commands.

## Workspace

```text
apps/platform/api
apps/platform/web
apps/ecommerce/api
apps/ecommerce/web
apps/ecommerce/storefront
apps/core/api
apps/core/web
apps/billing/api
apps/billing/web
apps/mail/api
apps/mail/web
devkits/uiux
packages/framework
packages/ui
tools/version
assist
```

## Strict UI/Form Guardrails

Before changing tenant/common/master forms, relation lookups, switch cards, placeholders, or shared form controls, read:

```text
assist/devops/ui-form-regression-guardrails.md
```

Required commands:

```bash
npm run check
npm run build
```

Use the root checks before finishing shared UI, lookup, common module, or master
module work.

## Strict App Module Shape

Zetro's runtime business rules are in `apps/zetro/agent/skills.md`. Read
`apps/zetro/agent/README.md` before changing its skills, prompts, or review log.
The root `AGENTS.md` points repository agents to these rules.

Business apps keep backend and frontend modules paired:

```text
apps/billing/api/src/modules/sales
apps/billing/web/src/modules/sales
apps/billing/web/src/shared
```

Backend modules must use the complete behavior-bearing file contract in `assist/architecture/module-boundaries.md`.

Frontend full modules use `index.ts`, `sales.workspace.tsx`, `sales.list.tsx`, `sales.form.tsx`, `sales.services.ts`, `sales.hooks.ts`, `sales.types.ts`, `sales.schema.ts`, and `sales.spec.ts`, with settings/print files when those capabilities exist. Alias-only wrappers and empty role files are forbidden.

Use `web/src/shared` only for cross-module web code; module-specific screens stay under `web/src/modules/{module}`.

### New tenant desks

[HRMS](apps/hrms/README.md), [Docs](apps/docs/README.md), and [Himsx](apps/himsx/README.md) are separate tenant apps composed into Platform Web/API. Enable their app keys through Plan Access and tenant Entitlements, seed their permissions, then open them from the launcher. Each owns an Overview and Getting Started side menu. These are app foundations; workforce CRUD, document editing and clinical workflows are planned modules.

Developer reference: open **Docs → Developer Library** or see [Docs authoring and hybrid storage](apps/docs/README.md). Reviewed Markdown/MDX covers 19 application groups; `npm run docs:check` verifies source hashes and module coverage. Zetro `/docs` and Super Admin Zuno developer tools consume bounded, cited read contracts.

The root production build runs Turbo with `--force`: current workspace outputs share the root `dist` tree, so restoring broad cached snapshots can overwrite another app's compiled output. A fresh root build keeps compiled Docs code, copied content hashes and frontend MDX chunks aligned. TypeScript/lint caching remains available.

## Local repository and generated files

Use `D:\workspace\codexsun` and `https://github.com/CODEXSUN/codexsun.git`.
The repository uses `@codexsun/*` packages and `CODEXSUN_*` environment variables.
Configure deployment variables and GitHub signing secrets with these names before release.
Renamed cookies and storage keys require a new login. Existing database names and native application IDs also change.

Run npm commands from the repository root. Keep only the root `node_modules` installation.
Build output and local npm, Vite, Turbo, Flutter, Gradle, and temporary files use root `dist`.
Desktop output uses `dist/apps/platform/windows`, `dist/.cargo/windows`, and `dist/releases/windows`.
Mobile output uses `dist/apps/<app>/mobile`. Use the root mobile scripts to create the required Flutter directory links.
Stop running builds and development servers, then run `npm run clean:dist` to clear generated output. The next command recreates the required directories.
Installed SDKs, operating-system caches, and application data are outside this cleanup.

Build-task caching is disabled because workspaces share the root output tree.
Nested task processes use absolute cache and temporary paths under `dist`.
