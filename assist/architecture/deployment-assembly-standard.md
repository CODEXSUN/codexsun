# Deployment Assembly Standard

## Purpose

This standard defines how one codebase produces different customer deployments.

Applications, modules, add-ons, and runtime packages stay independent. A deployment profile selects them and produces one validated deployment plan.

## Ownership

| Owner                      | Responsibility                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `packages/framework`       | Module metadata, compatibility, dependency order, and lifecycle contracts                  |
| `packages/platform-core`   | Reusable API, web, desktop, mobile, and shared runtime contracts                           |
| `packages/runtime`         | Deployment catalog parsing, profile validation, dependency resolution, and immutable plans |
| `apps/<app>`               | Business or technical application behavior and its deployable components                   |
| `packages/addons/<addon>`  | Stable reusable extension behavior and target bindings                                     |
| `deployments`              | Available component catalog, customer profiles, and Docker templates                       |
| `tools/runtime-holder.mjs` | Local start, selected builds, artifact staging, and Compose generation                     |

The runtime holder contains no business behavior. An application does not read another application's private source.

## Assembly levels

1. A module owns one domain capability inside an application.
2. An add-on extends a named public module point.
3. An application groups its API, web, worker, desktop, and mobile components.
4. A component defines one process or static-server boundary.
5. A deployment profile selects applications and add-ons.
6. Docker Compose combines selected component containers into one deployment unit.

Do not run several unrelated API processes under one container supervisor. Keep health, restart, resources, and scaling independent for each process boundary.

## Catalog rules

- Register every deployable application and component in `deployments/catalog.json`.
- Give every application, component, and add-on a stable identifier and semantic version.
- Declare required applications and component dependencies.
- Declare every framework and Platform runtime binding with a compatible version range.
- Declare build workspaces in dependency order.
- Keep ports in the 6000 series for local development.
- Keep all output below root `dist`.
- Keep add-on target components explicit.
- Reject duplicate identifiers, unsafe paths, cycles, missing workspaces, incompatible versions, and port conflicts.

## Profile rules

- Keep one profile per customer or deployment shape.
- Select only the applications and add-ons that the customer requires.
- Keep public web build values in `buildEnvironment`.
- Keep secrets outside the profile in `environment.env` or the deployment secret manager.
- Use a new profile version when selection or binding behavior changes.
- Validate the profile before any build or deployment.
- Do not edit application source to produce a customer variant.

## Add-on rules

- Package a reusable add-on only after its public contract is stable.
- Bind an add-on to named components of its target application.
- Stage the add-on only into those component images.
- Let the target application composition root approve and load it.
- Keep migrations and seeds in the add-on package.
- Run add-on lifecycle and data preparation through the module runtime.
- Do not treat `CODEXSUN_ADDONS` as authorization by itself.

## Local development

The `development` profile selects every registered application. `npm.cmd run dev` starts its components through root preflight.

Preflight keeps port ownership checks, health checks, signal handling, and controlled shutdown. Developers can still start one application with its focused root command.

## Docker deployment

- Use one final image per selected component.
- Use one generated Compose file as the customer deployment unit.
- Copy no unselected application artifact into a final image.
- Install only the selected Node component's production dependencies.
- Serve web artifacts through the common static image.
- Mount central application storage at `storage/app` only for components that need it.
- Inject runtime secrets during deployment.
- Run database migrations through module lifecycle before a business module becomes active.

## Acceptance gate

1. The catalog contains every deployable application.
2. The development profile resolves every application and component.
3. A minimal profile omits all unselected application workspaces and services.
4. Invalid applications, add-ons, bindings, paths, cycles, and ports fail before build.
5. Generated files stay below `dist/deployments/<profile>`.
6. Docker Compose has one service per selected process boundary.
7. The final image contains no unselected application artifact.
8. Root workspace, line, format, lint, type, build, chunk, and test gates pass.
9. Live Docker and production infrastructure checks are reported separately.
