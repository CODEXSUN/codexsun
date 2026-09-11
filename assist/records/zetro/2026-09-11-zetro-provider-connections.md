# Zetro Provider Connections

Date: 2026-09-11

## Decision

Zetro supports two explicit chat connections. `codex-local` uses the installed Codex app-server. `cxz-codex` uses the isolated CXZ Codex app-server. Both expose device login and a live model catalog. Provider, model, and reasoning changes are one draft tuple and do not alter the active connection independently. The icon-only connect action commits that tuple only after the target runtime confirms the authenticated account, validates the model and reasoning combination, and returns `ZETRO_SMOKE_OK` from a real ephemeral turn. Zetro then stores the selection in SQLite and returns a typed confirmation receipt with smoke latency. It never stores provider credentials.

## Runtime boundary

The provider API owns selection and account metadata. The chat API resolves the selected connection when each turn starts. Local Codex receives the prompt directly. CXZ receives the same normalized request over its internal HTTP API and streams activity and response events back as NDJSON.

## Recovery

The selected connection, model, reasoning effort, and non-secret account label survive API restart. A confirmation receipt is transient evidence for the switching interaction; persisted settings remain the source of truth after restart. A restarted page therefore requires a fresh connect smoke before it shows the green verified state. Local Codex owns its login state, and Zetro restarts its local app-server before explicit connection verification so it reads current credentials instead of retaining stale process state. CXZ keeps its separate Codex login in the `zetro-cxz-credentials` Docker volume.

The header probes an active or drafted CXZ connection every five seconds. A failed model request, connect request, or bounded readiness probe replaces the connection icon with a red cross. Recovery removes the unavailable state, but the green verified state still requires the user to run a new smoke test.

## Verification

Provider persistence, CXZ stream validation, credential isolation, liveness, readiness, API route contracts, focused type checks, the Zetro build, and runtime catalog validation are required. Live chat requires the selected Codex runtime to be authenticated.

The focused checks passed. The local Codex app-server returned six models. CXZ built and reported live, returned the same live model catalog, and exposed device login. Restart restored the selected connection and model from SQLite. The final provider registry contains only Local Codex and CXZ Codex.
