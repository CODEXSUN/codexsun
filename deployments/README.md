# Deployment Assemblies

## Purpose

This folder defines which CODEXSUN applications, add-ons, and runtime packages form one deployment.

Each application remains an independent source owner. A deployment profile combines selected components without copying business code into the framework or Platform Core.

## Structure

```text
deployments/
  catalog.json                 # every available application, component, add-on, and runtime binding
  profiles/
    development.json           # Platform, Docs, Zetro, DevKit, and Orship
    platform-only.json         # minimal production example
  docker/
    Dockerfile.node            # API and worker image
    Dockerfile.static          # static web image
    nginx.conf                 # single-page application fallback
```

Generated files go to `dist/deployments/<profile>/`. The source tree never receives generated Compose files or staged application artifacts.

## Selection model

- An application contains one or more deployable components.
- A component owns one process boundary, port, health path, build list, and output path.
- An add-on targets named components in one application.
- A runtime binding selects compatible framework, Platform Core, contract, UI, and runtime-holder versions.
- A profile selects applications and add-ons for one customer or environment.
- Required applications resolve before consumers.
- Unselected applications do not enter the generated component stage or final image.

Docker Compose is the combined deployment unit. Each selected API, web server, or worker runs in its own container.

## Commands

```powershell
npm.cmd run runtime:validate
npm.cmd run runtime:plan -- platform-only
npm.cmd run runtime:compose -- platform-only
npm.cmd run runtime:build -- platform-only
npm.cmd run runtime:start -- development
```

`npm.cmd run dev` starts the complete `development` profile through the same holder.

## Customer profile

Copy an existing profile. Give it a stable ID, customer label, version, selected applications, selected add-ons, public build environment, and optional port overrides.

Do not store secrets in a profile. After composition, copy `environment.example` to `environment.env` inside the generated profile folder. Set database passwords, provider tokens, and other secrets there.

Run validation before build. The holder rejects unknown selections, incompatible runtime versions, missing workspaces, unsafe output paths, component cycles, and port conflicts.

## Docker build

`runtime:build` builds only the workspace lists required by each selected component. It stages each component below root `dist`.

The Node image contains the selected API artifact, its compiled internal packages, and its production dependency lock. The static image contains only the selected web output and Nginx configuration.

The Docker build stage can read the repository source. The final image does not copy unselected application artifacts.

Start a generated stack from its output folder:

```powershell
Copy-Item environment.example environment.env
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml up --build
```

## Add-on activation

The holder stages a selected add-on only into its declared target components. It also sets `CODEXSUN_ADDONS` for those containers.

The target application must expose and document the named extension point. It must load only approved add-ons from its composition root. A profile cannot make an unsupported add-on executable by itself.

## Development records

- [2026-09-08 Deployment assembly runtime](../assist/records/platform/2026-09-08-deployment-assembly-runtime.md)
