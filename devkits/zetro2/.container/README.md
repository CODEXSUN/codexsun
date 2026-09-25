# Zetro2 Container Build

Purpose: reproducible, host-isolated compilation of the imported ZVcode source
(`devkits/zetro2/zvcode`) with pinned dependencies and root-only artifact
destinations. Host-side `npm ci`/`npm install` inside `zvcode/` stays prohibited
(see [vendor exception](../agent/baseline/0.7-vendor-exception-build-strategy.md)).

## Files

| File                             | Role                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| `Editor.Dockerfile`              | Multi-stage build: toolchain → source → deps → build → export |
| `Editor.Dockerfile.dockerignore` | Keeps the build context limited to imported source            |
| `build-editor.ps1`               | Host wrapper: `-Check` lints; default exports artifacts       |

## Pinned dependencies

| Input               | Pin                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Base image          | `node:22.22.0-bookworm@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c` |
| Node.js             | 22.22.0 (`zvcode/.nvmrc`, matches the base image)                                               |
| npm graph           | `zvcode/package-lock.json` (root) and every listed sub-directory lockfile via `npm ci`          |
| Electron headers    | target `39.6.0` from `zvcode/.npmrc` (fetched during `preinstall`)                              |
| Server Node headers | target `22.22.0` from `zvcode/remote/.npmrc`                                                    |
| Toolchain           | python3, make, g++, gcc, patch, git, pkg-config from the pinned base image                      |

The container run requires network access to the npm registry, `electronjs.org`,
and `nodejs.org` (header and runtime downloads during install and gulp packaging).

## Commands (repository root)

```powershell
# Lint the Dockerfile without compiling
powershell -File devkits/zetro2/.container/build-editor.ps1 -Check

# Full package build; exports to dist/zetro2/editor/
powershell -File devkits/zetro2/.container/build-editor.ps1
```

Equivalent raw build:

```powershell
docker build -f devkits/zetro2/.container/Editor.Dockerfile `
  --target export --output type=local,dest=dist/zetro2/editor `
  devkits/zetro2/zvcode
```

Optional private image tag (local development registry only):

```powershell
docker build -f devkits/zetro2/.container/Editor.Dockerfile `
  -t codexsun/zetro2-editor:local `
  devkits/zetro2/zvcode
```

## Artifact destinations

| Destination             | Contents                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `dist/zetro2/editor/`   | Packaged `vscode-reh-web-linux-x64` server root (`bin/`, `out/`, `product.json`, …) |
| `dist/zetro2/*` (other) | Manifests and verification outputs from editor tooling                              |

No build output is written under `devkits/zetro2/zvcode/` on the host.

## Stages

1. `toolchain` — pinned base image; verifies compiler tools.
2. `source` — copies imported source; prepares in-container git metadata and
   the two selfhost extension stubs that `postinstall` expects.
3. `deps` — `npm ci` against checked-in lockfiles (plus header downloads).
4. `build` — downloads builtin extensions; runs
   `gulp <VSCODE_TARGET>` (default `vscode-reh-web-linux-x64`).
5. `export` (default) — scratch stage that exposes only the package root so
   `--output` writes straight to `dist/zetro2/editor/`.

Build memory: the gulp script requests an 8 GiB Node heap; give the Docker
engine at least 10 GiB RAM.

## Limitations

- Task 2.5 adds and lints the build definition; the full compile runs under
  task 2.8 (editor version is read from the produced artifact there).
- Builtin extension downloads and Node/Electron headers are network-dependent
  and are not vendored into the repository.
- Rollback image retention and runtime wiring are later Phase 2 tasks (2.9c–2.10).
