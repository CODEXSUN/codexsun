# ZVcode Source Change Map

This document is the maintained map of every intentional local modification to
the imported ZVcode source under `devkits/zetro2/zvcode`. It is the human
authoritative record; the machine-readable mirror is `source-change-map.json`.
Both are checked against the live upstream diff by `check-change-map.mjs`.

Purpose: make direct editor-source customization auditable, keep each change
tied to one of the four custom layers, and give the optional upstream
source-update procedure (`upstream-update-procedure.md`) an explicit inventory
to re-apply.

## Baseline

| Field                    | Value                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Upstream reference       | `apps/temp/openvscode-server`                                                       |
| Version                  | `1.110.0`                                                                           |
| Distro metadata          | `bd187e4508a244500eb533c56e5cccb6801a699c`                                          |
| Upstream Git HEAD        | unavailable (neither tree contains `.git`; distro is metadata, not a verified HEAD) |
| Import aggregate SHA-256 | `54b13e275e628a301ae2ec40898c0085b3de5a708615bbcc9fe17e3300097c0f` (9,287 files)    |
| Diff mode                | EOL-normalized (upstream reference is CRLF; git-managed import is LF)               |
| Last verified            | 2026-09-24 on `host-windows`                                                        |

Regenerate the live diff after any editor source change:

```powershell
node devkits/zetro2/editor/zvcode-manifest.mjs --diff
node devkits/zetro2/editor/check-change-map.mjs
```

## Change entries

Exactly these files differ from the upstream reference. Any path in
`dist/zetro2/zvcode-upstream-diff.json` that is missing here fails
`check-change-map.mjs`.

| Path                                                                                    | Layer               | Reason                                                                                                  | Risk   | Verify                                         |
| --------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| `product.json`                                                                          | 1 Product           | ZVcode display name, application/server command, data folder, URL protocol, platform IDs, telemetry off | high   | `verify-zvcode.mjs` branding asserts           |
| `package.json`                                                                          | 1 Product           | root package name `zvcode` (version stays `1.110.0`)                                                    | low    | `verify-zvcode.mjs` package identity           |
| `package-lock.json`                                                                     | 1 Product           | lockfile package identity to match `package.json`                                                       | low    | `verify-zvcode.mjs` lock identity              |
| `README.md`                                                                             | 1 Product           | local product entry point and build status                                                              | low    | present in diff                                |
| `build/vite/vite.config.ts`                                                             | n/a (build tooling) | adds `allowedHosts: [".tmnext.in"]` so the authenticated Zbrowser preview host can load Vite            | medium | present in diff; preview host load in Phase 3+ |
| `src/vs/platform/telemetry/common/telemetryService.ts`                                  | 1 Product           | telemetry defaults off (`telemetryLevel`, `enableTelemetry`, `feedback.enabled`)                        | medium | grep defaults `OFF`/`false` in evidence        |
| `src/vs/workbench/electron-browser/desktop.contribution.ts`                             | 1 Product           | `telemetry.enableCrashReporter` default `false`                                                         | medium | grep default `false` in evidence               |
| `src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution.ts` | 1 Product           | `workbench.startupEditor` default `none` (no welcome page)                                              | low    | grep default `'none'` in evidence              |
| `src/vs/workbench/contrib/remote/browser/remoteIndicator.ts`                            | 1 Product           | status bar branding `Codexsun ZVcode` / tooltip `Zetro2`; offline alert still replaces `$(remote)`      | medium | grep `Codexsun ZVcode` + local kind rule       |
| `src/vs/platform/extensionManagement/common/extensionManagement.ts`                     | 1 Product           | `extensions.allowed` default deny-by-default allowlist of built-in marketplace extensions               | high   | grep `ms-vscode.js-debug` object default       |

### Entry rules

- Layer values: `1 Product`, `2 Access`, `3 Chat`, `4 Runtime bridge`, or
  `n/a` for build tooling that is not part of a product layer.
- Risk: `high` = product identity consumed by packaging or runtime paths;
  `medium` = environment-specific behavior; `low` = identity metadata or docs.
- Every new local edit to `zvcode/` must add a row here and a matching entry
  in `source-change-map.json` in the same change, then re-run
  `check-change-map.mjs`.

## Invariants

- `LICENSE.txt` and `ThirdPartyNotices.txt` stay byte-identical (EOL-normalized)
  to the upstream reference; `verify-zvcode.mjs` asserts this.
- No nested `node_modules`, `out`, or `dist` directories under `zvcode/`.
- Host-side `npm install` or output-producing scripts never run inside
  `zvcode/`; builds happen only via `.container/Editor.Dockerfile`.
- `dist/zetro2/` manifests and diffs are generated output and are not source.

## Planned layer register

Not yet applied to the source. Later phases implement these; each lands as a
change-map entry when it becomes a real local edit.

| Planned change                                  | Layer            | Task / phase |
| ----------------------------------------------- | ---------------- | ------------ |
| Session/workspace handshake into editor connect | 2 Access         | 3            |
| Role-enforced readonly mounts                   | 2 Access         | 3            |
| Chat layer replaces inherited Copilot endpoints | 3 Chat           | 4            |
| Typed HTTP + resumable WebSocket bridge         | 4 Runtime bridge | 4            |

## Maintenance rule

1. After every intentional edit under `zvcode/`, update
   `source-change-map.md`, `source-change-map.json`, and run
   `node devkits/zetro2/editor/check-change-map.mjs`.
2. Upstream merges are explicit maintenance choices, never automatic; follow
   `upstream-update-procedure.md` and run compatibility checks before
   adopting a new reference tree (feeds task 12.11).
3. Checksums in the baseline section describe the tree at recording time and
   must be recomputed after any source change.
