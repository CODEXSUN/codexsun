# Repository Tools

## Version and Git Workflow

The root `package.json` version is the only version authority.

Use these commands:

```text
npm.cmd run check:versions
npm.cmd run version:bump -- --title "<title>" --database-update
npm.cmd run version:bump -- --title "<title>" --no-database-update
npm.cmd run github:now -- --dry-run
```

## Line Endings

The root `.gitattributes` file requires LF endings for repository text files.

Use these commands before Git staging:

```text
npm.cmd run fix:line-endings
npm.cmd run check:line-endings
```

`github:now` runs the fix before its file review and checks again before `git add -A`.
See `assist/operations/line-endings.md` for the full rule.

## Isolated App Workflow

Use the CODEXSUN CLI from the main checkout:

```text
npm.cmd run codexsun -- app create docs index-refresh
npm.cmd run codexsun -- app guide docs index-refresh
npm.cmd run codexsun -- app review docs index-refresh
npm.cmd run codexsun -- app approve docs index-refresh --approved-by "Reviewer Name"
npm.cmd run codexsun -- app merge docs index-refresh
```

The CLI creates a branch and worktree beside the repository. It records local lifecycle state under `storage/runtime/worktrees/`.

The review command blocks dirty worktrees and unapproved shared-package changes. The merge command requires recorded approval and uses fast-forward only. It does not push.

`version:bump` updates every npm-required version mirror and adds a changelog entry. It does not commit or push.

`github:now` requires the exact subject from the latest changelog entry: `#<reference> - <title>`. It asks for confirmation before Git changes.

Do not bump, commit, tag, or push unless the task explicitly requires it.

## Startup Preflight

Use `npm.cmd run dev:api` or `npm.cmd run dev:web` to start a Platform host.

The preflight reads root `.env`, then the host `.app.env`. It reserves the configured `PLATFORM_HOST` and port through `storage/runtime/ports/` before it starts the workspace command.

Use `npm.cmd run preflight:api` or `npm.cmd run preflight:web` to check and release a port without starting a host.

Use `npm.cmd run dev:desktop` or `npm.cmd run preflight:desktop` for the Platform Tauri host. The desktop launcher sets `CARGO_TARGET_DIR` to `dist/platform/desktop/target`.

If another listener or active CODEXSUN reservation uses the port, preflight stops. It never ends an unknown process.

## Workspace Layout

Use `npm.cmd run check:root-layout` to verify the single root `node_modules/`, `dist/`, and `dist/.turbo/` locations.

Use `npm.cmd run check:app-architecture` to verify app profiles, host configuration, provider ownership, event declarations, module tests, shared package use, and private import boundaries.

Use `npm.cmd run clean:root-layout` to remove generated nested copies before a build or check completes.
