# Zuno workspace setup verification

Test date: 2026-09-21 (Asia/Calcutta).

## Scope

The live test used Zuno from the cloned CODEXSUN/codexsun repository inside CXForge.
It did not migrate other applications or change the separate Zuno containers.
CXForge remains a tools-only worker. No model is required for these API commands.

## Results

- Dependency installation completed: `npm ci --no-audit --no-fund`.
- The status step detected pending identity migrations on the first run.
- The migration step prepared identity, handoff, and portal SQLite stores.
- Verification checked identity migration order and checksums, required tables, and SQLite integrity.
- A repeat setup completed with the same configuration. The `../../../.env` SHA-256 did not change.
- The earlier baseline passed race tests and `go vet`. The final flat-workspace image passed all Go tests and TypeScript client checks.

The first install failed because npm filled the small `/tmp` filesystem.
Setup now defaults to `/var/lib/cxforge/cache/npm` for its npm cache.
The first browser check found missing shared app-catalog port variables.
The Zuno preview helper now reads those ports from the repository registry.

## Earlier deployment blocker

The final container update stalled while Docker copied the stopped workspace.
Docker log requests also stopped responding. The update was cancelled before
container replacement, so the existing container was not removed. The latest
backup archive is incomplete and must not be used for restoration.

## Flat-workspace verification

The fresh image `cxforge:flat-workspace` passed its Go tests and was installed by `cxforge-setup.sh`.
The previous container is preserved, stopped, as `cxforge-legacy-20260921`.
The active container is `cxforge`, with API port 6400 and first preview port 7300.

The single API request `flat-zuno-setup-20260921` completed these steps:

1. Clone CODEXSUN/codexsun into `/workspace`.
2. Install bundled Zuno helpers without manual copying.
3. Prepare `../../../.env`, install npm dependencies, and initialize SQLite.
4. Verify migration order, checksums, required tables, and database integrity.
5. Start the API and frontend preview.

The browser rendered the Zuno login page at `http://127.0.0.1:7300/login`.
The command API wrote and read `.cxforge/worker-smoke.txt` and confirmed there is no nested `repo` directory.
Both the frontend and `/api/v1/zuno/health` returned successful responses.
After a container restart, the same read/edit checks and preview health checks passed again.
The current checkout and worker state use separate paths: `/workspace` and `/var/lib/cxforge`.

Repeat these checks with `api/live-zuno-setup.ts` and `api/live-flat-check.ts`.
The scripts submit work through the API. The Go worker executes the project commands.

## Limits

Shared MariaDB configuration and connection checks are implemented, but a live shared
MariaDB test needs a supplied host, database, and credentials. Zuno's current stores
remain SQLite-specific; selecting MariaDB does not convert those stores.

The local preview uses generated credentials and localhost-only ports. This is not
an internet deployment sign-off. Database files live inside the container, so retain
an update backup before removing it.
