# AgentCrew Assistant Module

Own local assistant tasks, model runs, note retrieval, and bounded recurring prompts.

## Provider and contracts

Provider `agentcrew.assistant` depends on `platform.core` and declares contract `agentcrew.assistant.v1`.
It publishes no cross-module events. Operational records remain private to this module.
Routes use Zod schemas. Only the server configuration selects upstream URLs and model names.

## Persistence and recovery

`repository.ts` contains canonical migration `assistant.001` and calculates its SHA-256 checksum.
Existing checksums must match before startup. Append a new migration for future schema changes.
The scoped SQLite adapter stores task intent separately from run results.
Interrupted runs are marked for explicit retry. Scheduled budgets are consumed before inference.

## Dependencies and tests

Ollama supplies chat and embeddings. Qdrant supplies cosine retrieval.
`test/assistant.test.ts` checks validation, retry limits, authentication, run history, deduplication, and cancellation with fake upstreams.
See the [application README](../../../../README.md) for configuration and operational limits.
