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
npm.cmd run desktop:zetro:msi
```

The MSI command writes the installer under `dist/apps/zetro/desktop/target/release/bundle/msi`.

## Security

The main window uses a restricted Content Security Policy. It can connect only to the bundled local Zetro API.

The API listens on `127.0.0.1`. CORS allows the local web server and the Tauri application origin.

The desktop process uses typed native commands. Add a scoped command before any new operating-system access.

## Verification

Run the desktop workspace type check, lint, test, build, and MSI bundle commands on Windows.

The MSI requires the Windows WiX prerequisites that Tauri documents.

## Development record

- [First Windows desktop build](../../../assist/records/zetro/2026-09-09-tauri-desktop.md)
- [Desktop project onboarding](../../../assist/records/zetro/2026-09-09-desktop-project-onboarding.md)
