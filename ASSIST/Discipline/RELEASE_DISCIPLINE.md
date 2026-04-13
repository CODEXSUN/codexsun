# Release Discipline

## Quality Gates

1. Relevant validation passes or is explicitly documented as blocked
2. Documentation is current
3. Changelog is updated
4. No secrets or unsafe environment data are committed
5. Root and workspace package versions stay in lockstep when versioning is changed
6. The installed package version matches the latest logged task reference in `1.0.<reference>` form
7. The changelog version heading matches the active release tag format `v-1.0.<reference>` and entry labels use `v 1.0.<reference>`

## Release Caution

Changes touching these areas require extra rigor:

1. framework auth
2. shared core masters
3. billing, accounting, or inventory logic
4. ecommerce checkout or order state
5. migrations or storage behavior
6. versioning or release flow
7. plugin-module loading or connector contracts

## Required Notes

If a release changes contracts, data shape, or high-risk logic, document:

1. rollout impact
2. validation performed
3. remaining risks
4. the release reference number and version tag

## Release Flow

1. update the latest changelog entry for the batch
2. run `npm run version:sync` or rely on the git helper to align package, lockfile, runtime, and changelog version state
3. validate the workspace with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
4. create a reference-first commit using standard git commands
5. create the release tag manually with the `v-` prefix, for example `git tag -a v-1.0.172 -m "v-1.0.172"`
