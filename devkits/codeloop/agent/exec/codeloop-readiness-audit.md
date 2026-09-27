# CodeLoop Readiness Audit

This document records the end-to-end readiness audit for CodeLoop as a governed coding-machine foundation.

## Audit result

CodeLoop is operational for the current local development slice. The provider, chat, approval, project-switching, filesystem, validation, Git, browser, process, sandbox, dependency, project-understanding, and memory foundations are implemented and covered by automated tests.

The product is not yet release-complete for repository-wide governance because the shared architecture checker reports baseline violations outside CodeLoop and CodeLoop's non-foundation modules do not yet all publish the required provider, README, and test contract files.

## Verified green gates

- API TypeScript check passed.
- Web TypeScript check passed.
- API lint passed.
- Web lint passed.
- API production build passed.
- Web production build passed with a chunk-size warning only.
- CodeLoop API tests passed: 46 passed, 1 intentional MariaDB skip.
- Root layout check passed.
- `git diff --check` passed.
- AgentCrew and Ollama Docker containers were healthy.
- CodeLoop API health returned HTTP 200.
- CodeLoop web returned HTTP 200.

## Live end-to-end evidence

The live browser flow verified:

1. CodeLoop opened at `http://127.0.0.1:6371/overview`.
2. Project switching selected `codeloop-local` and updated the workspace context.
3. Provider settings showed Ollama as connected.
4. The selected Ollama endpoint was `http://127.0.0.1:6411`.
5. The selected model was `qwen3:4b`.
6. The provider smoke test returned `CodeLoop smoke test passed` in approximately 13 seconds.
7. Approval cards displayed the operation, provider, arguments, `Reject`, and `Approve and retry` actions.
8. Persisted approval state survived conversation reload and remained attached to the selected conversation.

The direct chat contract also returned a completed response through AgentCrew using `qwen3:4b` with assistant content present.

## Governance controls verified

- Workspace paths are bounded below the configured workspace root.
- Mutating filesystem, Git, process, package, browser, and Docker operations require explicit approval.
- Agent tool execution is bounded by a maximum tool-round limit.
- Provider requests have timeouts, selected-model validation, transient retry, and sanitized upstream error reporting.
- Project and conversation state are owner-scoped and persisted in SQLite.
- Memory supports SQLite and JSON transports; MariaDB remains an explicit planned phase.
- Validation returns structured stage results and stops after the first failed stage.
- Approval state is persisted in conversation traces and restored into the review UI.

## Release blockers

### Repository governance

The global architecture and module-boundary checkers currently scan unrelated applications and generated backup trees with existing violations. CodeLoop itself also needs module contract files for its non-foundation modules:

- `provider.ts` with owner and event declarations
- module `README.md`
- module test suite marker

### Product hardening

- Add a CodeLoop-scoped architecture gate that excludes unrelated applications and generated backups.
- Add provider contract files and focused tests for every CodeLoop module.
- Add a true browser E2E test runner for login, project switching, provider smoke test, approval, retry, and chat completion.
- Add observability for request id, provider id, model, latency, retry count, and sanitized failure category.
- Add an explicit workspace snapshot/restore proof using a disposable sandbox.
- Split the largest web bundle before production release.

## Definition of governed coding-machine readiness

CodeLoop is ready for the next release stage when all of the following are true:

1. The CodeLoop-scoped architecture gate is green.
2. Every module publishes its owner, events, README, and tests.
3. Browser E2E passes on a clean database and disposable workspace.
4. A real approved write is followed by validation evidence.
5. A forced validation failure retries, then rolls back to the checkpoint.
6. Provider failure messages identify the actionable upstream cause without exposing secrets.
7. SQLite restart persistence and backup/restore are verified.
8. MariaDB is either implemented and tested or remains disabled with an explicit product flag.
