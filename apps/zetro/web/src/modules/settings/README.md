# Zetro Settings Web

## Contract

- Module ID: `zetro.settings.web`
- Version: `0.3.0`
- Owner: Zetro web
- Flow: inspect or disconnect Codex, connect another account, open verification, copy or paste the device code, and refresh activation

The module owns the mounted Settings screen, centralized Zetro preferences,
response validation, connection service, connection hook, and device activation
interface. It depends only on the public `zetro.codex-connection.api` HTTP
contract.

Settings uses five application-owned sections:

- General controls the default chat workflow and ITO visibility.
- Appearance controls theme and shared MDI command bar, app switcher,
  notifications, profile menu, and status bar visibility.
- Developer tools controls global Git, monitoring, and external editor defaults.
- Git delivery controls global changelog, version, pull, commit, and push defaults.
- Codex connection manages local account status and device activation.

The Settings action replaces the project sidebar with the settings navigation.
Back to Zetro restores the active project workspace without adding another
public route. Settings layout uses Tailwind and shared UI primitives; it owns no
custom stylesheet.

## Dependency bindings

- `zetro.codex-connection.api`: `^0.5.0`
- `zetro.developer-tools.web`: `^0.2.0`
- `zetro.git-delivery.web`: `^0.1.0`

Zetro does not store Codex account tokens or API keys in browser storage. The device code is held only in component memory for the current page session. Codex owns the durable authenticated session.

Application preferences use `zetro.settings.preferences.v1`. Shared MDI feature
visibility keeps using its established application-specific storage contract.
The first read imports the former `zetro.agent-chat.workflow` value when no
central default exists.

Disconnect requires an inline confirmation because it signs the shared local Codex session out. Connect another account starts a new device-code flow and leaves the current session usable until the new login completes.

## Verification

Run the Zetro web typecheck and build. Verify disconnected, pending, error, and connected states in the browser. Confirm disconnect exposes a warning before sign-out, another-account login creates a fresh code, the browser link opens in a new tab, copy feedback is visible, pasted codes are validated, and successful authorization updates the connection card.

## Interface topology

The module owns topology regions `15.1.5` through `15.1.5.3` for the Settings
workspace, General, Appearance, and Codex connection sections. The ITO launcher
and inspector render only when the General toggle is enabled.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
- [2026-09-09 Centralized Zetro settings](../../../../../../assist/records/zetro/2026-09-09-centralized-settings.md)
