# CodeLoop Work Review

This review records the CodeLoop agent workflow that is implemented and the small set of follow-up limits that remain explicit.

## Implemented

- SQLite identity, seeded development users, provider settings, conversation history, and project knowledge persistence.
- Actor-owned provider settings with encrypted secrets and isolated conversation provider bindings.
- Bounded filesystem tools: `fs.read`, `fs.write`, `fs.edit`, `fs.patch`, `fs.delete`, `fs.move`, `fs.copy`, `fs.list`, `fs.search`, and `fs.exists`.
- Bounded terminal tools with workspace-safe working directories and background process lifecycle controls.
- Explicit testing tools: `test.run`, `test.unit`, `test.integration`, `test.e2e`, `test.watch`, and `test.coverage`, each with command, scope, timeout, and watcher lifecycle handling.
- Unified `validate` tool that runs typecheck, lint, unit, integration, E2E, and build stages in order and returns structured status, errors, and stage results.
- Controlled Playwright browser tools: `browser.open`, `browser.navigate`, `browser.click`, `browser.type`, `browser.select`, `browser.screenshot`, `browser.console`, `browser.network`, and `browser.inspect`.
- Named process/service tools: `process.start`, `process.stop`, `process.restart`, `process.status`, and `process.logs`, backed by the workspace-safe terminal lifecycle.
- Docker sandbox tools: `sandbox.create`, `sandbox.start`, `sandbox.exec`, `sandbox.stop`, `sandbox.destroy`, `sandbox.snapshot`, and `sandbox.restore`, with labeled task containers and `/workspace` binding.
- Controlled dependency tools: `package.install`, `package.remove`, `package.update`, `package.inspect`, and `package.audit` for npm, pnpm, Yarn, and Bun.
- Project understanding tools: `project.scan`, `project.index`, `project.structure`, `project.dependencies`, `project.conventions`, and `project.architecture`, backed by a bounded project knowledge graph.
- Code search tools and TypeScript language-service intelligence for diagnostics, symbols, references, definitions, and AST inspection.
- Git status, diff, log, branch, checkout, add, commit, reset, stash, checkpoint, rollback, agent branch, and task commit operations with sandbox and confirmation gates.
- Agent tool schemas and a bounded multi-step provider tool-calling loop. Tool results are returned to the model and recorded in conversation traces.
- Agent registry exposure for the complete filesystem, code-intelligence, Git, and memory tool sets.
- Memory tools for owner-scoped task state, project state, and decisions with SQLite as the active transport and JSON as a portable transport.
- Initial `AgentTaskController` slice for durable task states, checkpoint capture, validation attempts, retry limits, completion, failure, rollback, and owner isolation.
- Provider streaming through the CodeLoop message endpoint with SSE events for provider state, tokens, thinking, errors, and completion. Agentic runs retain the bounded loop and emit the completed result through the same stream.
- Workspace files, Changes, and Run history desks are backed by workspace, Git, and conversation APIs.
- Project knowledge file selections are persisted in SQLite and loaded into the next chat context as bounded reference material.

## Safety boundaries

- All workspace paths are resolved below `CODELOOP_WORKSPACE_ROOT`.
- Mutating filesystem and Git operations require `CODELOOP_SANDBOX_MODE=read-write` and explicit approval from the caller.
- Agent runs have a maximum of six tool rounds.
- Test commands are bounded to the workspace, capped at 120 seconds for foreground runs, and approval-gated because they can create artifacts or change runtime state.
- Validation stops at the first failed stage so later work is reported as `not_run` instead of producing misleading results.
- Browser sessions are isolated per API process, accept only HTTP(S) URLs, cap captured console/network data, and save screenshots below `dist/codeloop/browser`. Page interactions that can change state require approval.
- Process names and commands are bounded, service state is isolated by name, logs are read through the tracked process buffers, and lifecycle mutations require approval.
- Docker sandboxes validate names and images, use argument-based Docker CLI calls, cap command execution at 120 seconds, and require approval for all lifecycle or execution mutations.
- Package mutations validate package specifications, stay inside the workspace, detect the package manager from the manifest or lockfile, and require approval before invoking lifecycle scripts or changing lockfiles.
- Project scans ignore generated/vendor directories, cap file discovery, and return explicit nodes and relationships for apps, packages, components, APIs, services, databases, tests, configuration, Docker, and documentation.
- Provider requests have bounded timeouts and multiple providers run independently with isolated conversation bindings.

## Follow-up limits

- Destructive tool approval is enforced at the API boundary through `approvedTools`. Agent runs pause before mutation, persist the approval trace, and expose an in-chat review card with explicit approve-and-retry or reject actions.
- Direct Anthropic streaming uses the shared OpenAI-compatible stream parser only where the configured gateway exposes that contract; a native Anthropic event adapter is a separate provider-specific follow-up.
- Project knowledge is bounded file grounding, not vector retrieval or automatic workspace indexing.
- MariaDB is intentionally reserved as the third memory transport phase. The current implementation reports it as planned and fails clearly until a MariaDB adapter is added; no false fallback or unverified connection is claimed.
- Runtime transport selection is controlled by `CODELOOP_MEMORY_TRANSPORT=sqlite|json|mariadb`; SQLite is the default, JSON uses `CODELOOP_MEMORY_JSON_PATH` or the application data default, and MariaDB remains a planned adapter.

## Verification

Independent execution of the CodeLoop API test suite passed 46 tests with one intentional MariaDB integration skip. API and web TypeScript checks passed. API and web production builds passed; the web build emitted only a chunk-size warning. API and web lint passed. Root layout and `git diff --check` passed.

Live verification on 2026-09-27 returned HTTP 200 from the CodeLoop API and web hosts. AgentCrew and Ollama Docker were healthy. Provider settings showed `Connected`, selected model `qwen3:4b`, and the UI smoke test returned `CodeLoop smoke test passed` in 12.98 seconds. Project switching between `codexsun` and `codeloop-local` worked, and approval cards were visible in the selected conversation.

The repository-wide architecture and module-boundary checkers still report unrelated baseline violations in other applications and generated backup trees. CodeLoop also needs provider/README/test contract files for its non-foundation modules before the global architecture gate can be considered complete. This is tracked as a governance follow-up, not a provider or chat failure.
