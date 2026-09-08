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
```

Pass another profile after `--`, for example `npm.cmd run runtime:plan -- platform-only`.

## Development records

- [2026-09-08 Deployment assembly runtime](../../assist/records/platform/2026-09-08-deployment-assembly-runtime.md)
