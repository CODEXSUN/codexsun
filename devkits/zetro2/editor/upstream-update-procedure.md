# ZVcode Optional Upstream Source-Update Procedure

Optional maintenance procedure for adopting a newer upstream reference tree
into `devkits/zetro2/zvcode`. Upstream adoption is an explicit maintenance
choice, never automatic. Task register item 12.11 runs compatibility checks
against the maintained source-change map before adopting later upstream
changes.

Purpose: define the ordered steps to refresh the reference source, re-apply
every recorded local modification, verify provenance, rebuild, and keep a
rollback path — without mutating `zvcode/` blindly or relying on Git history
that neither tree contains.

## When to use

- A security fix, license update, or required feature exists only in a newer
  upstream tree, and the product chooses to take it.
- Never as a routine merge, continuous sync, or CI step.

## Prerequisites

1. `node devkits/zetro2/editor/verify-zvcode.mjs` passes on the current tree.
2. `node devkits/zetro2/editor/zvcode-manifest.mjs --diff` output matches
   `source-change-map.json` (`check-change-map.mjs` passes).
3. The new upstream reference is available as a local folder (same shape as
   `apps/temp/openvscode-server`: no `.git` required, source inventory only).
4. The prior editor image (or last known-good artifact) is retained for
   rollback (Phase 2 tasks 2.9c–2.10).

## Inputs

| Input             | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Current reference | `apps/temp/openvscode-server` — baseline for the existing diff       |
| New reference     | replacement local folder (path recorded in the evidence record)      |
| Change map        | `editor/source-change-map.{md,json}` — inventory to re-apply         |
| Diff tool         | `editor/zvcode-manifest.mjs --diff` — detects modified/added/removed |
| Identity verifier | `editor/verify-zvcode.mjs` — branding, packaging hooks, licenses     |
| Map checker       | `editor/check-change-map.mjs` — diff ↔ map equality                  |
| Container build   | `.container/build-editor.ps1` — rebuilds without host installs       |

Neither tree has a verified upstream Git HEAD. The inherited
`zvcode/scripts/sync-with-upstream.sh` (rebase onto `microsoft/vscode`
with yarn) does not apply: no Git history in the import, no base commit,
different package manager. Do not run it.

## Procedure

1. **Snapshot the "before" record.** Run `zvcode-manifest.mjs --write` and
   `--diff`, `verify-zvcode.mjs`, and `check-change-map.mjs`. Save the
   outputs (or the evidence baseline entry) as the pre-update state.
2. **Stage the new reference.** Place the new upstream tree at a temporary
   path (for example `apps/temp/openvscode-server-next`). Do not overwrite
   the current reference or `zvcode/` yet.
3. **Compute the new diff set.** Temporarily point the diff at the new
   reference (or copy the new tree over the reference path after archiving
   the old one) and run `zvcode-manifest.mjs --diff`. Record `modified`,
   `added`, and `removed` relative to the new tree.
4. **Re-apply each change-map entry.** For every row in
   `source-change-map.json`:
   - Re-apply the local edit onto the new upstream content for that path.
   - For `product.json`, merge field-by-field; do not overwrite unrelated
     upstream fields added in the new tree.
   - For identity files (`package.json`, `package-lock.json`), keep version
     in sync with the new upstream version and keep the local package name.
   - For `build/vite/vite.config.ts` and `README.md`, re-apply the local
     hunks onto the new base.
   - Confirm `LICENSE.txt` and `ThirdPartyNotices.txt` now match the new
     reference (they are not local edits; if upstream changed them, adopt
     upstream text and keep `verify-zvcode.mjs` equality true).
5. **Update provenance.** Recompute the aggregate checksum, file count, and
   version/distro fields in `source-change-map.{md,json}` and the
   `editor/README.md` checksum section. Record the new reference path and
   date in the evidence baseline.
6. **Verify.** Run, in order:
   ```powershell
   node devkits/zetro2/editor/verify-zvcode.mjs
   node devkits/zetro2/editor/zvcode-manifest.mjs --diff
   node devkits/zetro2/editor/check-change-map.mjs
   ```
   All three must pass; fix any unmapped paths before continuing.
7. **Rebuild and compatibility-check.** Run
   `powershell -File devkits/zetro2/.container/build-editor.ps1` (allow
   network for npm/Electron/Node headers; Docker engine ≥ 10 GiB RAM).
   Run Phase 2.9 parity checks and task 12.11 compatibility tests against
   the updated source-change map before switching any runtime to the new
   artifact.
8. **Adopt or roll back.** On success, replace the reference tree, update
   evidence, and check the dependent task items. On failure, keep the prior
   reference, prior `zvcode/` state, and prior image; restore from the
   snapshot in step 1.

## Non-goals

- No automatic or scheduled upstream sync.
- No host-side Git operations inside `zvcode/` (the container build performs
  its own `git init` for upstream tooling only).
- No host-side `npm install` inside `zvcode/`.
- No edits to `LICENSE.txt` / `ThirdPartyNotices.txt` that break equality
  with the reference tree.
- No silent merges: every path that differs after step 4 must appear in the
  change map.

## Failure modes to expect

- `verify-zvcode.mjs` license equality fails when upstream changed notice
  text while `zvcode/` still has the old copy → adopt the new upstream
  notice files (step 4) and re-run.
- `check-change-map.mjs` reports unmapped paths when new upstream files were
  never part of the map and local edits touched other files → update the map
  before proceeding.
- Build failures in `deps`/`build` stages when the new tree changes npm
  lockfiles or gulp targets → re-pin or re-verify container inputs before
  declaring the update complete.
