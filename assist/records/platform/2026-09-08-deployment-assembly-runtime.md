# Deployment Assembly Runtime

## Outcome

CODEXSUN now has one shared runtime holder for local development and customer-specific deployment assembly.

The holder treats applications and add-ons as selectable units. It resolves their framework and Platform bindings before build or startup.

## References

- Runtime owner: [CODEXSUN Runtime Holder](../../../packages/runtime/README.md).
- Deployment source: [Container assemblies](../../../.container/README.md).
- Architecture: [Deployment assembly standard](../../architecture/deployment-assembly-standard.md).
- Application rules: [Application standard](../../architecture/application-standard.md).
- Extension rules: [Extension standard](../../architecture/extension-standard.md).

## Binding properties

- `.container/catalog.json` registers Platform, Docs, Zetro, DevKit, and Orship with ten process or static-server components.
- Each application declares compatible framework, Platform Core, contract, UI, and runtime-holder versions.
- `.container/profiles/development.json` selects all registered applications for local work.
- `.container/profiles/platform-only.json` proves that a deployment can omit Docs, Zetro, and DevKit.
- `DeploymentPlanner` resolves required applications, add-ons, runtime packages, components, ports, and build workspaces into an immutable plan.
- The root runtime tool validates profiles, starts local components through preflight, builds selected workspaces, stages selected artifacts, and generates Docker Compose.
- Node component staging creates a production-only package manifest and lock. Static component staging copies only its web build.
- Generated output stays below `dist/deployments/<profile>`.

## Deployment decisions

One customer deployment uses one Compose project. Each API, worker, or static web server uses one container.

This keeps independent health, shutdown, resources, scaling, and fault isolation. The design does not place several unrelated Node servers under one container supervisor.

A deployment profile selects source owners. It does not fork or copy their business code. An add-on still needs an approved application extension point and module lifecycle binding.

## Parallel work

The repository contained active Platform, Docs, DevKit, Zetro, and shared UI changes. This work added the holder, deployment source, tests, and documentation without replacing those implementations.

## Verification

- `npm.cmd run runtime:prepare`
- `node --test tools/runtime-holder.test.mjs`
- `npm.cmd run runtime:validate`
- `npm.cmd run runtime:plan -- platform-only`
- `npm.cmd run runtime:compose -- platform-only`
- `npm.cmd run runtime:build -- platform-only`
- `npm.cmd run runtime:start -- development`
- `docker compose -f dist/deployments/platform-only/compose.yaml config --quiet`
- Production-only `npm.cmd ci --omit=dev --ignore-scripts` inside the staged Platform API root
- Staged compiled Platform API dependency-graph import
- `npm.cmd run check`
- `npm.cmd run check:versions`

The tests cover all-application development composition, Platform-only omission, required application resolution, invalid selections, port conflicts, incompatible runtime versions, add-on targeting, and Docker Compose service selection.

The Platform-only build staged only its API and web components. Docs, DevKit, and Zetro component artifacts were absent. The staged API production install reported zero vulnerabilities and loaded its compiled dependency graph. The temporary staged `node_modules` was removed after this check to preserve the one-root-`node_modules` rule.

The shared holder started all eight development components and reached its ready state. A terminal interrupt stopped the combined runtime, and ports `6010` through `6080` were released. Platform liveness passed while MariaDB-backed module preparation reported the existing `auth_gssapi_client` mismatch; database readiness is therefore not verified.

Windows preflight now force-stops only a verified repository-owned listener. This avoids the interactive `Terminate batch job` prompt during automatic port replacement. The Windows lifecycle test creates an owned listener and confirms that preflight replaces it without user input. A live development-profile restart reached ready state for all ten current components after the process fix.

## Not yet verified

- Docker Compose configuration passed. The Docker client is installed, but the Docker Desktop Linux engine was unavailable, so image build and Compose startup did not run.
- MariaDB module preparation remains unavailable until the local account uses an authentication plugin supported by MySQL2.
- Customer DNS, TLS, reverse proxy, secret manager, MariaDB, Redis, backup, restore, and observability remain deployment-environment work.
- Current applications still need target-specific production lifecycle checks before a live customer release.

## Next work

Add the first real add-on to `packages/addons` after its public contract is stable. Then prove its install, migration, activation, omission, and upgrade paths in two deployment profiles.
