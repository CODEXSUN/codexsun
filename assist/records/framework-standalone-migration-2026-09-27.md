# Framework Standalone Migration

This record tracks the first CODEXSUN repository migration from the monorepo.

## Scope

- Source: `packages/framework`
- Target: `https://github.com/CODEXSUN/framework`
- Package: `@codexsun/framework`
- Target commit: `a14b31e`

## Completed work

- Copied the framework source and focused tests into the target repository.
- Replaced the monorepo TypeScript configuration with a standalone build configuration.
- Added standalone package exports, build, check, lint, and test scripts.
- Added local development dependencies, Node type definitions, and package lockfile.
- Added a repository ignore file for dependencies and build output.
- Kept the package private until the package release policy is approved.

## Verification

- TypeScript check passed.
- Fifteen framework tests passed.
- ESLint passed.
- Standalone TypeScript build passed.
- Target repository `main` was pushed successfully.

## Next migration dependency

The next migration must define the owner for `packages/contracts` before platform consumers move out of the monorepo.
