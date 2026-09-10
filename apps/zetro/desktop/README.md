# Zetro Desktop

## Purpose

This workspace packages the Zetro web and API runtimes as a Windows desktop application.

## Ownership

- Tauri owns the desktop window, process lifecycle, native folder picker, and Windows installer.
- The Zetro web workspace owns all product UI.
- The Zetro API workspace owns chat, project, task, Codex, developer tools, and storage behavior.
- The desktop runtime starts one bundled Node process and stops only that owned process.

## Runtime assembly

The build refreshes Platform Core API before it prepares Zetro. It uses the current Zetro web output as `frontendDist` and bundles the Zetro API into one ESM runtime file.

The installer includes a private Node executable. The installed application does not require a system Node installation.

Desktop data lives in the Tauri application data directory. Worktrees, private records, and logs remain outside the installation directory.
New desktop worktrees live under the user's home directory at `.zetro/worktrees`.
Sandbox probes and the neutral provider directory use `.zetro/storage/app/private/sandbox`
through `ZETRO_SANDBOX_ROOT`. Existing AppData probes remain untouched.
This avoids sandbox access failures in MSIX-redirected AppData. Existing AppData worktrees
are preserved, not moved or deleted; recover any unfinished work there before cleanup.

The generated application data workspace is not a project. A new desktop
installation asks the user to connect a Git repository through the shared
project switcher.

## Native commands

- `desktop_status` reports the runtime owner and application data paths.
- `pick_repository_folder` opens the Windows folder picker.

The native command list is explicit. The webview does not receive a generic shell command.
The local API can open a registered repository in a fixed editor, Explorer, or Windows Terminal.

## Commands

```powershell
npm.cmd run desktop:zetro:dev
npm.cmd run desktop:zetro:prepare
npm.cmd run desktop:zetro:msi
```

The prepare command builds the web and API runtime before packaging. The MSI command repeats that
pre-build and writes the installer under `dist/apps/zetro/desktop/target/release/bundle/msi`.
Turbo caches only the runnable executable and bundled runtime. Cargo intermediates and
old installers remain local outputs, not duplicated cache archives.

## Security

For external supervision, set `ZETRO_SUPERVISOR_TOKEN` in the process environment before launch.
Use a random value with at least 32 characters. Keep it out of repository files and command arguments.
The desktop inherits this value. Restart without it to disable access.
Use the [Supervisor API](../api/src/modules/supervisor/README.md) and CLI with the same token.
The release runtime explicitly selects production mode, SQLite, and the local task queue.
Normal exit requests API shutdown through the owned stdin pipe and waits up to eight seconds.
Process-tree termination is the fallback when that deadline expires.

The main window uses a restricted Content Security Policy. It can connect only to the bundled local Zetro API.

The packaged API prefers `127.0.0.1:16050` and selects another free loopback port if that port is unavailable. Development keeps using port `6050`. The webview reads the packaged runtime address from `desktop_status`, and CORS allows the local web server and the Tauri application origin.

The desktop process uses typed native commands. Add a scoped command before any new operating-system access.

## Verification

Run the desktop workspace type check, lint, test, build, and MSI bundle commands on Windows.
`npm.cmd run test --workspace @codexsun/zetro-desktop` runs Rust tests and packaged API lifecycle checks.
The runtime test verifies supervisor authentication, readiness, token redaction, shutdown, and port release with temporary SQLite storage.
It also verifies repository trust denial and a real named npm script through the packaged API and durable task result.

The MSI requires the Windows WiX prerequisites that Tauri documents.

## Development record

- [Desktop 0.1.30 build](../../../assist/records/zetro/2026-09-10-desktop-0.1.30.md)

- [Desktop 0.1.27 stability candidate](../../../assist/records/zetro/2026-09-10-stability-0.1.27.md)

- [Desktop 0.1.26 scope binding](../../../assist/records/zetro/2026-09-10-scope-binding.md)

- [Desktop 0.1.25 chat contract repair](../../../assist/records/zetro/2026-09-10-chat-activity-details.md)

- [Desktop 0.1.24 candidate](../../../assist/records/zetro/2026-09-10-desktop-0.1.24.md)

- [Desktop 0.1.23 upgrade](../../../assist/records/zetro/2026-09-10-desktop-0.1.23.md)
- [Desktop 0.1.22 execution visuals](../../../assist/records/zetro/2026-09-10-live-execution-visuals.md)

- [Desktop 0.1.21 live progress](../../../assist/records/zetro/2026-09-10-desktop-0.1.21.md)

- [Desktop 0.1.20 verification](../../../assist/records/zetro/2026-09-10-desktop-0.1.20-verification.md)
- [Stable release workflow and script execution](../../../assist/records/zetro/2026-09-10-stable-release-workflow.md)
- [Desktop supervisor bridge](../../../assist/records/zetro/2026-09-10-desktop-supervisor.md)

- [Desktop 0.1.17 build](../../../assist/records/zetro/2026-09-10-desktop-0.1.17-build.md)
- [Zetro Agent Workspace rails](../../../assist/records/zetro/2026-09-09-agent-workspace-rails.md)
- [First Windows desktop build](../../../assist/records/zetro/2026-09-09-tauri-desktop.md)
- [Desktop project onboarding](../../../assist/records/zetro/2026-09-09-desktop-project-onboarding.md)
