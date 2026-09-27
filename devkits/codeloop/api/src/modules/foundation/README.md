# CodeLoop Foundation Module

This module owns CodeLoop health, provider verification, and durable provider runtime settings.

## Ownership

- `provider-settings-store.ts` owns the CodeLoop runtime SQLite schema, encrypted provider credentials, provider defaults, and conversation-to-provider bindings.
- `provider-connection.ts` owns provider connection checks and AgentCrew/Ollama integration.
- `server.ts` exposes the authenticated HTTP contracts for these capabilities.

## Storage

The runtime database is `storage/apps/codeloop/private/data/codeloop_runtime.sqlite`. It is separate from the identity database. The store applies migration `codeloop.provider-settings.001` and creates default provider rows on first startup. API keys are encrypted with the platform JWT secret and are never returned by the settings API.

## Agent run recovery

Streamed agent messages create a persistent run in `codeloop_agent_runs` and append ordered SSE payloads to `codeloop_agent_run_events`. The active-run and event-replay endpoints allow the web client to resume activity after a refresh or lost connection. Cancellation uses the run controller and records a cancellation request without exposing provider credentials.

## Contracts

- `GET /api/v1/codeloop/providers` loads the authenticated actor's safe provider settings.
- `PUT /api/v1/codeloop/providers` replaces the authenticated actor's provider settings without clearing an omitted saved secret.
- `GET` and `PUT /api/v1/codeloop/conversations/:conversationId/providers` isolate provider selections by actor and conversation.
- `POST /api/v1/codeloop/providers/verify-many` verifies several configured providers concurrently.
- `POST /api/v1/codeloop/providers/verify` verifies one provider.
- `POST /api/v1/codeloop/conversations/:conversationId/messages` sends conversation context to all selected providers concurrently and returns provider-labelled responses.

Ollama conversations use the authenticated AgentCrew `/api/v1/agentcrew/chat` bridge. OpenAI-compatible providers use their `/chat/completions` endpoint. The chat route does not persist message bodies yet; the UI keeps the active conversation transcript and sends it as context.

## Verification

Run `npm test --workspace @codexsun/codeloop-api -- --test-name-pattern="provider settings"` and `npm run check --workspace @codexsun/codeloop-api`.
