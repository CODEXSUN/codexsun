# Support Assistant Boundary

## Purpose

This file defines what an external support assistant such as `orekso` may and may not ingest from `codexsun`.

The goal is to let a local-first assistant help users with workflow guidance, field meaning, and operational support without exposing secrets, customer-private records, or deployment internals.

## Allowed Uses

An external support assistant may be used to:

1. explain product workflows in business-user language
2. explain page purpose, field meaning, status meaning, and likely next steps
3. summarize documented operational flows
4. point to likely backend or frontend ownership for debugging and support
5. answer with source references and uncertainty when confidence is low

## Prohibited Uses

An external support assistant must not:

1. ingest `.env` files, secrets, API keys, passwords, tokens, or private credentials
2. ingest live database dumps, backups, customer exports, or uploaded private files
3. ingest runtime volumes, generated cache, or deployment-specific machine state
4. mutate codexsun data directly unless an explicit reviewed API contract is added later
5. present guessed ERP/accounting answers as certain when the retrieved evidence is weak

## Preferred Source Types

The assistant should prefer these source categories:

1. top-level documentation and setup guides
2. architecture and boundary documents under `ASSIST/Documentation`
3. app and framework manifests
4. route definitions and page modules that reflect business workflows
5. shared schemas, domain contracts, and business-safe application logic
6. module descriptions and help-oriented UI copy

## Excluded Paths

The assistant should exclude these paths unless a reviewed exception is added:

1. `node_modules/`
2. `.git/`
3. `dist/`
4. `build/`
5. `.next/`
6. `coverage/`
7. `tmp/`
8. `storage/`
9. `.env`
10. `.env.*`
11. `error.log`
12. `package-lock.json`

## Safety Rules

1. Responses must distinguish between documented behavior and inferred behavior.
2. Accounting, inventory, tax, payments, and authorization guidance must be labeled carefully because they are high-risk areas.
3. If a user asks for action outside retrieved evidence, the assistant should say it is uncertain and request a human or stronger source.
4. Tenant-specific or customer-specific support knowledge should be separated later through metadata and authorization, not by mixing all clients into one blind index.

## Codexsun Integration Contract

Codexsun may expose:

1. a machine-readable support knowledge manifest
2. curated lists of recommended source paths
3. app/module metadata helpful for indexing and support answers

Codexsun does not currently expose:

1. write APIs for assistant-driven business actions
2. tenant-specific support knowledge partitions
3. direct database access for RAG systems
