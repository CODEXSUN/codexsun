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

`version:bump` updates every npm-required version mirror and adds a changelog entry. It does not commit or push.

`github:now` requires the exact subject from the latest changelog entry: `#<reference> - <title>`. It asks for confirmation before Git changes.

Do not bump, commit, tag, or push unless the task explicitly requires it.

## Startup Preflight

Use `npm.cmd run dev:api` or `npm.cmd run dev:web` to start a Platform host.

The preflight reads root `.env`, then the host `.app.env`. It reserves the configured `PLATFORM_HOST` and port through `storage/runtime/ports/` before it starts the workspace command.

Use `npm.cmd run preflight:api` or `npm.cmd run preflight:web` to check and release a port without starting a host.

If another listener or active CODEXSUN reservation uses the port, preflight stops. It never ends an unknown process.

## Workspace Layout

Use `npm.cmd run check:root-layout` to verify the single root `node_modules/`, `dist/`, and `dist/.turbo/` locations.

Use `npm.cmd run clean:root-layout` to remove generated nested copies before a build or check completes.
