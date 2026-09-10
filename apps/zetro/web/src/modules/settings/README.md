# Zetro Settings Web

## Contract

- Module ID: `zetro.settings.web`
- Version: `0.6.1`
- Owner: Zetro web
- Flow: inspect or disconnect Codex, connect another account, open verification, copy or paste the device code, and refresh activation

The module owns the mounted Settings screen, centralized Zetro preferences,
response validation, connection service, connection hook, and device activation
interface. It depends only on the public `zetro.codex-connection.api` HTTP
contract.

Settings uses five application-owned sections:

- General controls the Codex model, reasoning level, default chat workflow, and ITO visibility.
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

- `zetro.codex-connection.api`: `^0.10.0`
- `zetro.developer-tools.web`: `^0.2.0`
- `zetro.git-delivery.web`: `^0.1.0`

Zetro does not store Codex account tokens or API keys in browser storage. The device code is held only in component memory for the current page session. Codex owns the durable authenticated session.

Application preferences use `zetro.settings.preferences.v1`. The same record
stores the global Codex model and the Light, Medium, or Hard reasoning level.
The web and desktop applications use this shared frontend record. Shared MDI feature
visibility keeps using its established application-specific storage contract.
The first read imports the former `zetro.agent-chat.workflow` value when no
central default exists.

Disconnect requires an inline confirmation because it signs the shared local Codex session out. Connect another account starts a new device-code flow and leaves the current session usable until the new login completes.

## Verification

### Startup readiness

The public `assertExecutionReady` performs a read-only check before Chat saves or submits a new user message.
The status request has a 15-second timeout. Expired evidence preserves the draft and directs the user to verification.
This check never starts another provider turn or changes policy. The API still enforces readiness at execution time.

`SettingsStartup` mounts before the desk. It reads the local service, account, and sandbox status.
The first unverified startup requests a network policy and permission to remember automatic verification.
The browser-local key is `zetro.settings.startup-verification.v1`. It stores policy, never evidence or credentials.
Later startups use that policy for one verification attempt. New chats do not remount the startup screen.
Current server evidence is reused. Windows setup is never automatic and remains separately confirmed.
The splash polls observed checks every two seconds. It shows passed, failed, and pending states without invented percentages.
Ready evidence is polled every 15 seconds while the splash stays open. Expiry removes the ready state.
Each attempt has a three-minute display deadline. Late responses cannot turn a timed-out attempt green.
Retry reads the server first and observes an existing verification instead of starting another.
Open desk / Settings dismisses presentation only. The API still blocks unverified project execution.
Verification may continue server-side after dismissal. The splash does not interrupt that security probe.
The Start working action opens the desk after verification. Task scope approval remains separate.
Settings can revoke automatic startup verification. Full checks still expire after 15 minutes or provider restart.
This feature does not renew evidence automatically throughout the day or reinstall the sandbox.
See the [startup record](../../../../../../assist/records/zetro/2026-09-10-startup-readiness.md).

Codex connection shows execution security separately from account login status.
Setup requires confirmation because Windows can change sandbox users, permissions, and firewall rules.
Verification requires confirmation because it uses a provider turn and disposable files.
The default action requires localhost denial. A separate action permits localhost and tests public-network denial.
The screen shows the selected policy, individual results, and last check time.
Busy states disable actions. Provider restart and expired evidence require verification again.
See the [sandbox record](../../../../../../assist/records/zetro/2026-09-10-windows-sandbox.md).

Run the Zetro web typecheck and build. Verify disconnected, pending, error, and connected states in the browser. Confirm disconnect exposes a warning before sign-out, another-account login creates a fresh code, the browser link opens in a new tab, copy feedback is visible, pasted codes are validated, and successful authorization updates the connection card.

## Interface topology

The module owns topology regions `15.1.5` through `15.1.5.3` for the Settings
workspace, General, Appearance, and Codex connection sections. The ITO launcher
and inspector render only when the General toggle is enabled.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-09 Codex model selection](../../../../../../assist/records/zetro/2026-09-09-codex-model-selection.md)
- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
- [2026-09-09 Centralized Zetro settings](../../../../../../assist/records/zetro/2026-09-09-centralized-settings.md)
