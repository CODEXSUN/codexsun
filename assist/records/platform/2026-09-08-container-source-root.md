# Container Source Root

## Outcome

The deployment source owner moved from `deployments` to `.container`. Runtime output remains below root `dist/deployments`.

## Authoritative references

- Source owner: [Container assemblies](../../../.container/README.md)
- Architecture contract: [Deployment assembly standard](../../architecture/deployment-assembly-standard.md)
- Workflow: [Deployment assembly skill](../../skills/deployment-assembly.md)

## Ownership and boundaries

The `.container` folder owns the catalog, profiles, Dockerfiles, and Nginx template. The Runtime Holder still owns validation, planning, staging, and Compose generation.

Applications keep their source ownership. This change does not move application code or generated artifacts into `.container`.

## Binding properties

| Producer        | Consumer        | Binding             | Path                                 |
| --------------- | --------------- | ------------------- | ------------------------------------ |
| `.container`    | Runtime Holder  | Catalog             | `.container/catalog.json`            |
| `.container`    | Runtime Holder  | Profiles            | `.container/profiles/<profile>.json` |
| Runtime package | Docker Compose  | Container templates | `.container/docker/Dockerfile.*`     |
| Runtime Holder  | Generated files | Root build output   | `dist/deployments/<profile>`         |
| `.container`    | Orship API      | Service discovery   | `.container/catalog.json`            |

## Parallel work

The repository contained active Orship runtime and documentation changes. The rename preserved those changes and updated only their deployment-source bindings.

## Decisions

- Decision: use `.container` as the source folder name.
- Reason: the folder now states its container assembly role at the repository root.
- Decision: keep generated files in `dist/deployments`.
- Reason: all build output must remain below the single root `dist` folder.

## Verification

- Passed `npm.cmd run runtime:validate` for five applications and ten components.
- Passed `npm.cmd run runtime:plan -- platform-only`.
- Passed `npm.cmd run runtime:compose -- platform-only` and inspected `.container/docker` paths in the generated Compose file.
- Passed `npm.cmd run test:runtime-holder` and `npm.cmd run test:orship`.
- Passed the complete `npm.cmd run check` root gate and `git diff --check`.
- A later format repeat reported concurrent Zetro project-file warnings. This change preserved those unrelated files.
- Docker engine execution did not run.
