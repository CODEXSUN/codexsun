# Build, Plugin, And Release Workflow

## Purpose

This file defines the current repository workflow for:

1. shared build outputs
2. standalone app delivery
3. future plugin or connector module delivery
4. semantic versioning
5. commit and release discipline

## Shared Build Layout

All generated artifacts belong under the root `build/` folder.

Use this split:

1. `build/app/<app>/<target>`
2. `build/module/<module>/<target>`

Examples:

1. `build/app/cxapp/web`
2. `build/app/cxapp/server`
3. `build/module/frappe/server`

Rule:

1. standalone apps build under `build/app`
2. plugin or connector modules build under `build/module`
3. source trees should not become permanent homes for release artifacts

## Current Reality

Implemented now:

1. the repo builds the active `cxapp` web and server outputs
2. versioning is still manual
3. changelog and reference discipline are active

Not implemented yet:

1. release helper scripts
2. automatic version bump tooling
3. actual module packaging under `build/module/*`

## Version Rule

Use lockstep numeric semantic versioning across the root package and implemented workspace packages.

Current starting version:

1. package version: `0.0.1`
2. release tag: `v-0.0.1`

Rule:

1. package files use numeric semver
2. changelog version headings and git tags use the `v-` prefix
3. version changes must be deliberate and documented in the same batch

## Reference Rule

Every meaningful batch uses one reference number.

Apply it in:

1. `ASSIST/Execution/TASK.md`
2. `ASSIST/Execution/PLANNING.md`
3. `ASSIST/Documentation/CHANGELOG.md`
4. git commit subjects

## Manual Release Flow

Use this sequence until release automation exists:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
git commit -m "#10 chore(repo): summary"
git tag -a v-0.0.1 -m "v-0.0.1"
```
