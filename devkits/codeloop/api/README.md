# CodeLoop API

The CodeLoop API exposes typed routes, local identity, persistent conversations, provider settings, workspace tools, and an agent chat runtime.

## Configuration

Copy `.app.env.example` to `.app.env` for local development. The API reads shared values from the repository root `.env` and CodeLoop overrides from this file. Do not commit the copied file.

## Verification

Run `npm.cmd run check --workspace @codexsun/codeloop-api`, `npm.cmd run test --workspace @codexsun/codeloop-api`, and `npm.cmd run build --workspace @codexsun/codeloop-api` from the repository root.

Provider settings are stored in `storage/apps/codeloop/private/data/codeloop_runtime.sqlite`, separately from identity storage. Settings are actor-owned, provider secrets are encrypted at rest, and conversation provider selections are isolated by conversation ID. Multiple enabled providers can be saved and verified concurrently.

## Workspace tools

The authenticated workspace contract is `/api/v1/codeloop/workspace`. It supports `fs.read`, `fs.write`, `fs.edit`, `fs.patch`, `fs.delete`, `fs.move`, `fs.copy`, `fs.list`, `fs.search`, and `fs.exists` through `/execute`, plus read-only file and capability routes. The sandbox is restricted to `CODELOOP_WORKSPACE_ROOT` and rejects traversal, symlinks, sensitive files, oversized content, and unsafe nested moves or copies.

Code inspection tools are exposed through the same executor: `code.search`, `code.find_symbol`, `code.find_references`, `code.find_definition`, and `code.find_files`. TypeScript language-service tools are available as `code.diagnostics`, `code.symbols`, `code.references`, `code.definition`, and `code.ast`.

## Terminal and Git

Terminal tools provide bounded synchronous and background execution with workspace-safe working directories. Git tools are exposed at `/api/v1/codeloop/git/execute`: `git.status`, `git.diff`, `git.log`, `git.branch`, `git.checkout`, `git.add`, `git.commit`, `git.reset`, `git.stash`, `git.create_checkpoint`, `git.rollback`, `git.create_agent_branch`, and `git.commit_task`.

Read operations are available in the workspace. Filesystem and Git mutations require `CODELOOP_SANDBOX_MODE=read-write` and explicit approval. Hard reset and rollback have additional confirmation requirements.

## Agent chat and streaming

`POST /api/v1/codeloop/conversations/:conversationId/messages` accepts `agentic`, `approvedTools`, `knowledgePaths`, and `stream`. Agentic requests use a bounded six-step tool-calling loop for supported providers. When `stream=true`, the response is Server-Sent Events with provider, token, thinking, error, provider completion, and final completion events. Completed provider messages and tool traces are persisted before the final event is sent.

## Project knowledge

Project knowledge selections are persisted through `/api/v1/codeloop/projects/:projectId/knowledge` and loaded as bounded reference material for the next chat request. This is file grounding, not automatic vector indexing.
