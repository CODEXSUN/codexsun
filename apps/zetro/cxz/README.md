# CXZ chat runtime

CXZ is Zetro's isolated Docker chat runtime. It keeps one warm Codex app-server, exposes Codex device login and model discovery, streams responses as NDJSON, and serves a React control page from the same container.

Codex credentials live only in the `zetro-cxz-credentials` volume. The control page shows authentication state, device code, activation shortcut, connected account, live models, and supported reasoning options. Model and reasoning changes remain drafts until **Set connection** confirms them through a same-origin CXZ proxy to the Zetro provider API. This avoids browser CORS coupling. The page polls the confirmed selection so changes made in Zetro appear without replacing an unsaved CXZ draft. The returned receipt drives the connected banner. CXZ identifies itself using its active Codex model and configured reasoning level without exposing private reasoning. CXZ has no repository mount, Docker socket, task runner, or Git capability.

## Development records

- [CXZ provider runtime](../../../assist/records/zetro/2026-09-11-cxz-provider-runtime.md)
