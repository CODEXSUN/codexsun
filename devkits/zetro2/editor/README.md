# ZVcode source integration

ZVcode is the Zetro2 editor, imported from `apps/temp/openvscode-server`
into `devkits/zetro2/zvcode`. The original source remains unchanged.

The imported source manifest identifies version 1.110.0 and distro
bd187e4508a244500eb533c56e5cccb6801a699c. No upstream Git HEAD was available
in the supplied source folder; the distro value is metadata, not a verified HEAD.

## Content checksums

`zvcode-manifest.mjs` computes a deterministic aggregate SHA-256 over every
file path and content hash in the imported tree (raw working-tree bytes).
Recorded on 2026-09-24: 9,287 files, 146,202,173 bytes, aggregate
`54b13e275e628a301ae2ec40898c0085b3de5a708615bbcc9fe17e3300097c0f`.
Recompute from the repository root:

```powershell
node devkits/zetro2/editor/zvcode-manifest.mjs --write
```

`--write` stores the full per-file manifest under root `dist/zetro2/` (build
output, not source). `--diff` compares against `apps/temp/openvscode-server`
modulo line endings and writes `dist/zetro2/zvcode-upstream-diff.json`.

## Source changes

The maintained change map is [`source-change-map.md`](source-change-map.md)
with a machine-readable mirror in
[`source-change-map.json`](source-change-map.json). Local modifications versus
the reference source (EOL-normalized diff, ten files after task 2.7):

- `product.json`: ZVcode display name, application/server command, data directory,
  URL protocol, platform product identifiers, and telemetry off
  (`enableTelemetry`, `enabledTelemetryLevels`).
- `package.json` and `package-lock.json`: consistent ZVcode root package identity.
- `README.md`: local product entry point with an explicit build status.
- `build/vite/vite.config.ts`: adds `allowedHosts: [".tmnext.in"]` so the
  authenticated Zbrowser preview host can load the Vite dev server.
- `src/vs/platform/telemetry/common/telemetryService.ts` and
  `src/vs/workbench/electron-browser/desktop.contribution.ts`: telemetry and
  crash-reporter setting defaults off.
- `src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution.ts`:
  `workbench.startupEditor` default `none`.
- `src/vs/workbench/contrib/remote/browser/remoteIndicator.ts`: status-bar brand
  `Codexsun ZVcode` / tooltip `Zetro2`.
- `src/vs/platform/extensionManagement/common/extensionManagement.ts`:
  `extensions.allowed` default deny-by-default allowlist of built-in marketplace
  extensions.

Licenses and notices are unchanged: `LICENSE.txt` and `ThirdPartyNotices.txt`
match the reference source (verified by `verify-zvcode.mjs`). The imported
editor retains its upstream license.

The server packaging code reads `applicationName` and `serverApplicationName`
from product.json to generate the ZVcode executable names.
Internal VS Code namespaces, extension APIs, and third-party identifiers remain compatible.
Upstream licenses and notices remain unchanged.

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

`check-change-map.mjs` asserts the change map matches the live upstream diff
(see [`upstream-update-procedure.md`](upstream-update-procedure.md) for the
optional upstream source-update procedure):
