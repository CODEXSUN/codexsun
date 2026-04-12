# Needed Things

This file lists what Zetro needs before it becomes a real agent system.

## Already Available

1. App scaffold.
2. Dashboard route.
3. Terminal command.
4. Static playbook catalog.
5. Static output modes.
6. Static guardrails.
7. Static sample runs and findings.

## Needed For Persistence

1. Table names.
2. Migrations.
3. Seeders.
4. Store/repository functions.
5. Services.
6. Tests.

## Needed For API

1. Internal API routes in `apps/api`.
2. Auth/session checks from `apps/cxapp`.
3. Request/response contracts.
4. Error handling.
5. API tests.

## Needed For Terminal Agent Behavior

1. Persisted terminal sessions.
2. Session event log.
3. Prompt templates.
4. Output mode selector.
5. Source collector.
6. Approval prompts.
7. Safe command proposal format.

## Needed For Model Integration

Decision required:

1. Which provider do we use first?
2. Where are provider settings stored?
3. Which environment variables are allowed?
4. What is the max output limit?
5. What is the cost limit?
6. Should model usage be admin-only first?

Implementation needed:

1. provider adapter interface
2. disabled-by-default provider settings
3. prompt builder
4. response persistence
5. token/cost metadata
6. fallback when provider is disabled

## Needed For Command Execution

Do not build this before persistence and approvals.

Needed first:

1. command allowlist
2. approval record
3. runner policy service
4. timeout
5. cancellation
6. stdout/stderr capture
7. exit code capture
8. sensitive command blocking

## Needed For Controlled Loop

Do not build this early.

Needed first:

1. max iterations
2. hard timeout
3. cancel button
4. stop condition
5. event log
6. admin-only enablement
7. no-op dry run mode

## Decisions To Make

1. Model provider first: local, OpenAI-compatible, Anthropic, or configurable?
2. Store long output in database, files, or both?
3. Zetro permissions: admin-only first or dedicated role?
4. Should review findings create Task follow-ups automatically or only by click?
5. Should command execution live in `apps/cli` or a Zetro runner that delegates to CLI?
