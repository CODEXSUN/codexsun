# CODEXSUN Runtime Holder

## Purpose

This package converts an application catalog and a customer profile into one immutable deployment plan.

It links the CODEXSUN framework and Platform Core packages. It does not import private application code or contain business behavior.

## Ownership

- The catalog defines available applications, components, add-ons, runtime packages, ports, build workspaces, and output paths.
- A profile selects the applications and add-ons for one development or production deployment.
- `DeploymentPlanner` resolves required applications and validates runtime package version ranges.
- The root runtime tool starts local components and writes deployment files under root `dist/deployments`.

## Rules

- Every application binds to the shared framework and the target-specific Platform Core runtime.
- A customer profile selects applications and add-ons. It never edits their source.
- Required applications are included before their consumers.
- Unknown applications, add-ons, runtime packages, version ranges, unsafe paths, and port conflicts fail before build.
- One container owns one API, web server, or worker process.
- Docker Compose is the customer deployment unit that combines selected containers.
- Unselected application artifacts are not copied into their component images.

## Commands

```powershell
npm.cmd run runtime:validate
npm.cmd run runtime:plan
npm.cmd run runtime:compose
npm.cmd run runtime:build
npm.cmd run dev
npm.cmd run dev:all
```

Pass another profile after `--`, for example `npm.cmd run runtime:plan -- platform-only`.

The default `dev` command uses `main-development` and excludes Orship. Use `dev:orship` for Orship or `dev:all` for the complete profile.

Root preflight is the single local log owner. It writes readable and structured component logs below `storage/app/private/runtime/logs` and failure-only JSONL below `storage/app/private/runtime/failures`. Run `npm.cmd run logs:failures` for a compact cross-application summary. `RUNTIME_LOG_MAX_BYTES` controls rotation and defaults to 5 MiB.

## Development records

- [2026-09-08 Deployment assembly runtime](../../assist/records/platform/2026-09-08-deployment-assembly-runtime.md)
- [2026-09-09 Runtime log organization](../../assist/records/platform/2026-09-09-runtime-log-organization.md)
