# Versioning And Releases

## Version Policy

1. Package versions must stay in numeric semantic version form such as `0.0.1`
2. Git tags and changelog version headings must use the `v-` prefix such as `v-0.0.1`
3. The repository uses lockstep versioning across the root package and every implemented workspace package

## Reference Policy

1. Every meaningful batch uses a reference number such as `#10`
2. When execution tracking is active, the batch reference in `TASK.md` must match the current batch reference in `PLANNING.md`
3. Changelog entries must use the same reference number in the form `### [#10] YYYY-MM-DD - Title`
4. Commit subjects must start with the same reference number

## Changelog Policy

1. `CHANGELOG.md` must contain a `Version State` block
2. `Version State` must record the current numeric package version and current `v-` release tag
3. The changelog must contain a matching version section such as `## v-0.0.1`
4. New entries belong under the active version section until the next version bump is approved

## Release Operation Policy

1. version updates are manual until the repo grows real release automation
2. version, changelog, and tag naming must stay aligned in the same batch
3. release tags must be created with the `v-` prefix
4. clean validation should exist before tagging a release

## Build Output Policy

1. standalone app builds belong under `build/app/<app>/<target>`
2. plugin or module builds belong under `build/module/<module>/<target>`
3. local tooling should respect the shared root build layout instead of scattering build outputs across app-local folders
