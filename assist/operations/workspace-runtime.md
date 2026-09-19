# Workspace Runtime

## Root dependency installation

The repository has one dependency installation directory:

```text
node_modules/
```

Run package installation only from the repository root. Applications, packages, modules, and tools must not contain their own `node_modules/` directory.

## Root build output

The repository has one build-output directory:

```text
dist/
```

Every application, add-on, package, module, web host, desktop host, mobile host, and tool must use this single root output directory. No workspace may create a local `dist/` directory.

Use these output namespaces:

```text
dist/<app-name>/api/
dist/<app-name>/web/
dist/<app-name>/desktop/
dist/<app-name>/mobile/
dist/packages/<package>/
dist/.turbo/<scope>/
```

`dist/.turbo/` is the only Turborepo cache location. Each Turbo scope writes to `dist/.turbo/<scope>/`.

Use these scope names: `platform`, `docs`, `zetro`, `uiux`, `packages`, and `workspace`.

No app, add-on, package, module, or tool may write a local `dist/`, `.turbo/`, generated JavaScript, declarations, or build artifacts into source folders.

Use `npm.cmd run build:<scope>` or `npm.cmd run turbo:scope -- <scope> check` for focused application work. The runner includes each selected host and its package dependency closure.

Turbo can create temporary task-log folders below participating packages. The scoped runner always removes these folders before it returns. Do not run `turbo` directly for scoped work.

## TypeScript hosts

Each app host has one TypeScript configuration file.

```text
apps/<app>/api/tsconfig.json
apps/<app>/web/tsconfig.json
```

The API and web configurations may extend a root shared base configuration. Do not add extra host TypeScript configurations inside an app.

Desktop and mobile hosts use their target tooling configuration. They must write generated output only to the root `dist/` namespace.

The Platform desktop launcher sets `CARGO_TARGET_DIR=dist/platform/desktop/target`. Do not allow Tauri or Cargo to create `src-tauri/target/`.

## Required checks

1. Confirm only root `node_modules/` exists before final acceptance.
2. Confirm generated output exists only under root `dist/`.
3. Confirm Turborepo writes cache files under `dist/.turbo/<scope>/`.
4. Typecheck each affected API and web host with its owner configuration.
5. Run `node tools/check-root-layout.mjs` to reject nested workspace output, cache, and dependency folders.

## Startup preflight

Start Platform hosts through the root commands:

```text
npm.cmd run dev:api
npm.cmd run dev:web
```

Start every API host with `npm.cmd run dev:all-api`, or every web host with
`npm.cmd run dev:all-web`.

The preflight reads root `.env` first. It then reads the host `.app.env` file. The host file may override its port and URL values.

Before startup, preflight creates a short-lived reservation under `storage/runtime/ports/`. It checks the configured host and port before starting the workspace command.

Preflight never stops an unknown listener. If another process uses the port, stop its verified owner or change the configured port.
