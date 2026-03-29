# Release Discipline

## Quality Gates

1. Relevant validation passes or is explicitly documented as blocked.
2. Documentation is current.
3. Changelog is updated.
4. No secrets or unsafe environment data are committed.
5. Root and workspace package versions stay in lockstep.
6. The changelog version heading matches the active release tag format `v-<semver>`.

## Release Caution

Changes touching these areas require extra rigor:

1. framework auth
2. shared `Core` masters
3. billing/accounting/inventory logic
4. ecommerce checkout/order state
5. migrations or storage behavior
6. versioning or git automation
7. plugin-module loading or connector contracts

## Required Notes

If a release changes contracts, data shape, or high-risk logic, document:

1. rollout impact
2. validation performed
3. remaining risks
4. the release reference number and version tag

## Release Flow

1. Bump the numeric package version with `npm run version:bump -- --type patch|minor|major` or `npm run version:bump -- --version x.y.z`.
2. Validate the workspace with `npm run typecheck`, `npm run build`, and `npm run githelper -- check`.
3. Commit with a reference-first subject using `npm run githelper -- commit --ref <n> --type <type> --scope <scope> --summary "<text>"`.
4. Tag the release with `npm run githelper -- release --ref <n>` and use `--push` only when the branch is ready to publish.
