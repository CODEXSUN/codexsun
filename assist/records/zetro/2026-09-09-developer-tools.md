# Zetro Developer Tools

## Outcome

Zetro now provides repository tools in one shared web and desktop interface. Global
defaults and project-specific settings control Git actions, monitoring, and external tools.

## Ownership

- `zetro.developer-tools.api` owns Git execution, launchers, settings, and validation.
- `zetro.developer-tools.web` owns the monitor, dialogs, and settings controls.
- `zetro.projects.api` remains the owner of registered repository paths.
- The Tauri app packages the same Zetro web bundle and local API.

## Decisions

- Decision: Treat revoke as a Git revert commit.
- Reason: Revert keeps shared history and supports a normal later push.
- Decision: Disable unrestricted force push.
- Reason: Rewriting remote history needs a separate repository workflow.
- Decision: Allow only fixed external editor choices.
- Reason: A stored arbitrary command would create a shell execution boundary.
- Decision: Pause monitoring while Zetro is hidden.
- Reason: Hidden workspaces do not need repeated Git processes.
- Decision: Apply the effective branch prefix inside the API.
- Reason: Project settings must control every branch created through Zetro.

## Interface review

- The collapsed monitor keeps the workspace clear.
- Orange marks changed-file attention without coloring the full panel.
- Explicit labels support each icon in the expanded panel.
- Confirmations protect push and revert actions.
- Project settings use the existing foreground properties layer.

## Verification

- Zetro API and web type checks passed.
- Zetro API and web lint passed.
- The focused Git test passed with a local bare remote.
- The test covered status, branch creation, commit, first push, compare, and revert.
- Zetro API and web production builds passed without chunk warnings.
- Browser review confirmed the monitor, dialogs, and both settings levels.
- A fresh browser session had no console warnings or errors.
- Commit, push, revert, and external launch actions were not run on the working repository.
- Tauri type check, lint, Rust tests, and the WiX MSI build passed.
- The MSI SHA-256 is `B2F47CAC42C3135504AAEF180D915C492523DAA5974B2A11502C9C93A3A70505`.
