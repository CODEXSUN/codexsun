# Zetro Settings Web

## Contract

- Module ID: `zetro.settings.web`
- Version: `0.1.0`
- Owner: Zetro web
- Flow: inspect or disconnect Codex, connect another account, open verification, copy or paste the device code, and refresh activation

The module owns the Settings screen, response validation, connection service, connection hook, and device activation interface. It depends only on the public `zetro.codex-connection.api` HTTP contract.

Zetro does not store Codex account tokens or API keys in browser storage. The device code is held only in component memory for the current page session. Codex owns the durable authenticated session.

Disconnect requires an inline confirmation because it signs the shared local Codex session out. Connect another account starts a new device-code flow and leaves the current session usable until the new login completes.

## Verification

Run the Zetro web typecheck and build. Verify disconnected, pending, error, and connected states in the browser. Confirm disconnect exposes a warning before sign-out, another-account login creates a fresh code, the browser link opens in a new tab, copy feedback is visible, pasted codes are validated, and successful authorization updates the connection card.

## Interface topology

The module owns the Settings topology. It identifies the connection banner,
device flow, activation controls, refresh action, and privacy note.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
