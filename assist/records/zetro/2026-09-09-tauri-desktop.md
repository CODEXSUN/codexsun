# Zetro Tauri Windows Desktop

Date: 2026-09-09

## Outcome

Zetro now has a Tauri 2 Windows host and a WiX MSI installer. The desktop application uses the existing Zetro web and API behavior.

The installer includes the API bundle and a private Node executable. An installed copy does not need a development checkout or system Node installation.

## Authoritative references

- Owner README: `apps/zetro/desktop/README.md`
- Application README: `apps/zetro/README.md`
- Application catalog: `assist/modules/zetro.md`
- Architecture contracts: `assist/architecture/application-standard.md` and `assist/architecture/deployment-assembly-standard.md`
- Local skills: `assist/skills/web-ui.md`, `assist/skills/server-runtime.md`, and `assist/skills/deployment-assembly.md`

## Ownership and boundaries

The desktop workspace owns Windows integration, local process ownership, native commands, and installer metadata. The web and API workspaces keep their current product ownership.

The desktop webview has no generic shell command. It uses one typed folder-picker command. The API still owns Codex process access within a selected project.

The Compose catalog still owns server deployments. The Windows desktop installer stays outside that container-only schema.

The authored-file check excludes Tauri's generated `src-tauri/gen` schemas. Authored Rust and TypeScript files remain subject to repository limits.

## Binding properties

| Producer      | Consumer          | Binding                  | Version or key              |
| ------------- | ----------------- | ------------------------ | --------------------------- |
| Zetro desktop | Zetro web         | Tauri `frontendDist`     | `dist/apps/zetro/web`       |
| Zetro desktop | Zetro API         | Bundled loopback process | `http://127.0.0.1:6050`     |
| Zetro desktop | Windows Installer | WiX MSI                  | `Zetro_0.1.5_x64_en-US.msi` |
| Zetro web     | Tauri host        | Native folder command    | `pick_repository_folder`    |
| Zetro API     | Tauri host        | Parent process watcher   | `ZETRO_DESKTOP_PARENT_PID`  |

Desktop data uses the Tauri application data directory. API logs use the Tauri application log directory.

## Parallel work

The worktree contained concurrent Zetro chat, task, project, observability, and runtime changes. This change preserved them and added a new desktop workspace.

The API startup and CORS edits extend the current server composition. They do not replace its existing module behavior.

## Decisions

- Decision: Package the current API as a bundled Node sidecar managed by Rust.
- Reason: This keeps one API behavior across the browser and desktop applications.
- Rejected alternative: Port the Zetro API to Rust for the first installer. That would create two owners for chat and task behavior.
- Rejected alternative: Require a system Node installation. That would make the installer depend on developer machine setup.
- Decision: Split production JavaScript by stable dependency ownership instead of an arbitrary vendor-size boundary.
- Reason: Size-based vendor splitting created a circular React import graph that rendered a blank installed WebView.

## Verification

- `npm.cmd run typecheck --workspace @codexsun/zetro-desktop`: Passed.
- `npm.cmd run test --workspace @codexsun/zetro-desktop`: Passed, one Rust lifecycle contract test.
- `npm.cmd run lint --workspace @codexsun/zetro-desktop`: Passed after adding the standard Clippy component.
- `npm.cmd run desktop:zetro:msi`: Passed.
- Release executable and bundled API lifecycle: Passed with port `6050` released after desktop termination.
- Bundled API health: Passed at `GET /health/live`.
- Packaged WebView smoke test: Passed at `tauri.localhost/zetro`; the Zetro workspace rendered with no runtime exceptions.
- Production chunk budget and static import cycle check: Passed.
- MSI installation: Confirmed for the earlier build. The replacement installer was not installed during this verification.
- MSI uninstall: Not run.
- Code signing: Not configured.

## Follow-up work

- Add Windows code signing before public distribution.
- Add a signed updater after the first installer identity is stable.
- Add an installed MSI smoke test to the Windows release workflow.
