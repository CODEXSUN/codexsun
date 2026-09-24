# ZVcode source integration

ZVcode is the Zetro2 editor, imported from `apps/temp/openvscode-server`
into `devkits/zetro2/zvcode`. The original source remains unchanged.

The imported source manifest identifies version 1.110.0 and distro
bd187e4508a244500eb533c56e5cccb6801a699c. No upstream Git HEAD was available
in the supplied source folder; the distro value is metadata, not a verified HEAD.

## Source changes

- `product.json`: ZVcode display name, application/server command, data directory,
  URL protocol, and platform product identifiers.
- `package.json` and `package-lock.json`: consistent ZVcode root package identity.
- `README.md`: local product entry point with an explicit build status.

The server packaging code reads `applicationName` and `serverApplicationName`
from product.json to generate the ZVcode executable names.
Internal VS Code namespaces, extension APIs, and third-party identifiers remain compatible.
Upstream licenses and notices remain unchanged. The imported editor retains its upstream license.

## Build boundary

This is a source import and branding change, not a running editor deployment.
Build the source in an isolated Docker build environment. Do not install upstream
dependencies or run its output-producing scripts in the host source tree.
Export host artifacts only under root `dist/zetro2/`.
The imported vendor tree retains upstream large files and build configuration;
the exception is limited to this imported tree, not new Zetro2 modules.

The inherited Node requirement is recorded in `zvcode/.nvmrc`.
Root product branding does not rename upstream assets, configure Zetro2 identity,
or replace the inherited Copilot integration with the planned agent backend.
Those changes remain tracked in the task register.

## Verification

Run from the repository root:

```powershell
node devkits/zetro2/editor/verify-zvcode.mjs
```

This verifies branding, package identity, server packaging hooks, and unchanged license files.
It does not compile the editor or verify a browser session.
