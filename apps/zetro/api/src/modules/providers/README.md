# Zetro Provider API

`zetro.providers.api` owns provider connection metadata and the selected connection, model, and reasoning level. It restarts the local runtime when necessary, validates the target account and model catalog, and requires a real ephemeral model smoke response before storing a selection in Zetro SQLite. The selection response includes the runtime, exact selection, smoke latency, and completion time as a typed verification receipt.

Local Codex credentials remain owned by the installed Codex app-server. CXZ keeps its own Codex credentials in a persistent container volume. This module does not persist provider secrets.

## Development records

- [Provider connections](../../../../../../../assist/records/zetro/2026-09-11-zetro-provider-connections.md)
- [CXZ provider runtime](../../../../../../../assist/records/zetro/2026-09-11-cxz-provider-runtime.md)
