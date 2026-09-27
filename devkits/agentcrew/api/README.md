# AgentCrew API

Serve the single-user assistant contract and bounded prompt scheduler through Fastify.

## Ownership and configuration

The `assistant` module owns task state, runs, retrieval, and operational events.
The host composes Framework and Platform Core providers and obtains a scoped storage path from the public storage provider.
The authenticated `/api/v1/agentcrew/chat` route provides a direct, non-scheduled chat bridge for CodeLoop and forwards bounded requests to Ollama.
The authenticated read-only workspace routes expose bounded file listing, text reading, and metadata for the configured `WORKSPACE_ROOT`. They reject path traversal, symlinks, sensitive files, and large reads. They are a foundation for later agent tool calls; chat does not execute them yet.
Copy `.app.env.example` to the ignored `.app.env` for host development. Never commit the token.

## Verification and contracts

Use the API workspace `check`, `lint`, `test`, and `build` scripts from the repository root.
Tests live in `src/modules/assistant/test/`. Builds write to root `dist/devkits/agentcrew/api/`.
See the [application README](../README.md) for routes, Docker setup, storage, recovery, and security limits.
