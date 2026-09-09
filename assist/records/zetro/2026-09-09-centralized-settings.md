# Centralized Zetro Settings

Date: 2026-09-09

## Outcome

Zetro now has one mounted Settings workspace inside `/zetro`. The Settings
action replaces the project sidebar and workspace. Back to Zetro restores the
active project workspace.

The Settings footer has no top divider in Zetro. The Chat context bar keeps the
connected-folder action only in its three-dot menu.

## Ownership

The `zetro.settings.web` module owns the Settings workspace and Zetro
preferences. The shared MDI shell owns its existing feature preferences. The
Codex connection API still owns account state and device login.

The Settings module does not store account tokens. It stores only interface
preferences in browser local storage.

## Settings

- General sets the default chat workflow and ITO visibility.
- Appearance sets the theme and shared MDI feature visibility.
- Codex connection shows account state and supports device login or disconnect.
- Search filters the Settings section list.

The default workflow now updates the chat composer through one Settings
provider. The provider imports the old workflow key when a central value does
not exist.

The ITO toggle controls the inspection launcher and inspector. It defaults to
hidden for a clean product workspace.

## Interface topology

- `15.1.5` identifies the Settings workspace.
- `15.1.5.1` identifies General settings.
- `15.1.5.2` identifies Appearance settings.
- `15.1.5.3` identifies the Codex connection.

## Verification

- The shared UI and Zetro web type checks passed.
- The Zetro production build passed.
- The production chunk budget and dependency graph check passed.
- The browser showed General, Appearance, and Codex connection sections.
- The browser showed the ITO launcher only while its toggle was enabled.
- The browser console had no application errors.
- The Tauri WiX MSI build passed with the Settings workspace included.
- Desktop preparation now refreshes Platform Core API before it bundles Zetro API.
