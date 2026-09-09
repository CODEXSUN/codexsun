# Repository Boundary Audit

Repository version: `0.1.2`

## Outcome

All five applications follow the current workspace, documentation, build-output, and private-import boundaries.

The audit fixed incompatible Zetro module dependency ranges. It also added missing version and Zetro test checks to the root quality gate.

## Applications reviewed

| Application | Boundary result | Current production blocker          |
| ----------- | --------------- | ----------------------------------- |
| Platform    | Pass            | None in the automated gate          |
| Docs        | Pass            | No dedicated API lifecycle E2E test |
| DevKit      | Pass            | No dedicated API lifecycle E2E test |
| Zetro       | Pass after fix  | No dedicated API lifecycle E2E test |
| Orship      | Pass            | No dedicated API lifecycle E2E test |

## Urgent fixes

- Corrected six Zetro manifests so every declared dependency accepts the owner module version.
- Added `check:module-dependencies` for duplicate IDs, missing targets, and incompatible semantic versions.
- Added `check:versions` to the root `check` command.
- Added `test:zetro` to the root `check` command.

## Boundaries verified

- One root `node_modules` folder and one root `dist` folder.
- One TypeScript configuration per workspace.
- All deployable components exist in the development runtime profile.
- Private sibling-module imports do not cross module boundaries.
- Migrations remain inside their owning API modules.
- Every application and module has the required documentation.
- All production JavaScript chunks remain below 400 KB.

## Remaining work

Docs, DevKit, Zetro, and Orship need production-artifact API lifecycle tests. Their current health and shutdown code must not be treated as full production proof.

DevKit and Docs still compose Fastify inside `server.ts`. Move each app builder into `app.ts` when its lifecycle test is added.

## Verification

- `npm.cmd run check`
- `npm.cmd run runtime:validate`
- `npm.cmd run check:module-dependencies`
- `npm.cmd run check:versions`
- `git diff --check`

The live MariaDB, Docker, desktop, mobile, and remote deployment paths were not tested.
