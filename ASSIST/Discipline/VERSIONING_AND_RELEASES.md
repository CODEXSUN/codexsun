# Versioning And Releases

## Version Policy

1. Package versions must stay in numeric semantic version form such as `0.0.1`.
2. Git tags and changelog version headings must use the `v-` prefix such as `v-0.0.1`.
3. The repository uses lockstep versioning across the root package and every implemented workspace package.
4. The root `package.json` release config is the source of truth for tag prefix, changelog path, task path, planning path, and build roots.

## Reference Policy

1. Every meaningful batch uses a reference number such as `#3`.
2. The active batch reference in `TASK.md` must match the current batch reference in `PLANNING.md`.
3. Changelog entries must use the same reference number in the form `### [#3] YYYY-MM-DD - Title`.
4. Commit subjects must start with the same reference number.

## Changelog Policy

1. `CHANGELOG.md` must contain a `Version State` block.
2. `Version State` must record the current numeric package version and current `v-` release tag.
3. The changelog must contain a matching version section such as `## v-0.0.1`.
4. New entries belong under the active version section until the next version bump is approved.

## Githelper Policy

1. Use `npm run githelper -- check` to validate version, changelog, branch, remote, and working tree state.
2. Use `npm run version:bump -- --type patch|minor|major` or `--version x.y.z` to change the lockstep version.
3. Use `npm run githelper -- commit --ref <n> --type <type> --scope <scope> --summary "<text>"` to stage changes, sync references, update changelog entry stubs, and create the commit.
4. Use `npm run githelper -- release --ref <n>` to create the annotated `v-` release tag from a clean working tree.
5. Use `--push` only when the branch or tag is ready for publication.

## Build Output Policy

1. Standalone app builds belong under `build/app/<app>/<target>`.
2. Plugin or module builds belong under `build/module/<module>/<target>`.
3. Local tooling should respect the shared root build layout instead of scattering build outputs across app-local folders.
