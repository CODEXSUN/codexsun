# Build, Plugin, And Release Workflow

## Purpose

This file defines the current repository workflow for:

1. shared build outputs
2. standalone app delivery
3. plugin or connector module delivery
4. semantic version bump flow
5. commit and release automation

## Shared Build Layout

All generated artifacts belong under the root `build/` folder.

Use this split:

1. `build/app/<app>/<target>`
2. `build/module/<module>/<target>`

Examples:

1. `build/app/framework/web`
2. `build/app/cli`
3. `build/module/frappe/server`

Rule:

1. standalone apps build under `build/app`
2. plugin or connector modules build under `build/module`
3. source trees should not become permanent homes for release artifacts

## Standalone App Rule

A standalone app is independently shippable.

Examples:

1. `framework`
2. `billing`
3. `task`

Rule:

1. standalone apps own routes, business delivery, and packaging
2. standalone apps may consume framework contracts
3. standalone apps must not hide plugin behavior inside undocumented imports

## Plugin Module Rule

A plugin module extends an app or platform through explicit contracts.

Examples:

1. `frappe`
2. future Zoho connector
3. future Tally connector

Rule:

1. plugin modules must expose a manifest
2. plugin modules must declare a runtime target
3. plugin modules must build under `build/module/<module>`
4. plugin modules must not bypass framework contracts to mutate unrelated app internals

## Version Rule

Use lockstep numeric semantic versioning across the root package and implemented workspace packages.

Current starting version:

1. package version: `0.0.1`
2. release tag: `v-0.0.1`

Rule:

1. package files use numeric semver
2. changelog version headings and git tags use the `v-` prefix
3. version changes happen through the CLI helper instead of ad hoc file edits

## Reference Rule

Every meaningful batch uses one reference number.

Apply it in:

1. `ASSIST/Execution/TASK.md`
2. `ASSIST/Execution/PLANNING.md`
3. `ASSIST/Documentation/CHANGELOG.md`
4. git commit subjects

Format:

1. `#3`
2. `### [#3] YYYY-MM-DD - Title`
3. `#3 feat(scope): summary`

## Githelper Flow

Use these commands:

```bash
npm run githelper -- check
npm run version:bump -- --type patch
npm run githelper -- commit --ref 3 --type chore --scope repo --summary "establish release governance"
npm run githelper -- release --ref 3
```

Rule:

1. `check` validates the current version, build roots, remote, branch, and working tree
2. `version:bump` updates lockstep package versions and changelog version state
3. `commit` stages all changes, syncs references, ensures a changelog entry exists, and creates the formatted commit
4. `release` creates the annotated `v-` tag from a clean working tree
