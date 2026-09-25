# AgentCrew Verification

Record the initial implementation checks and the remaining acceptance work for the local assistant.

## Checked on 2026-09-24

The repository root was `E:\codexsun\codexsun`. Existing unrelated work was preserved.
The initial checks below preceded model downloads and local deployment. No Logicx deployment, commit, or push was performed.

| Check                    | Result                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| API TypeScript check     | Passed.                                                                                               |
| Web TypeScript check     | Passed.                                                                                               |
| API and web ESLint       | Passed.                                                                                               |
| API module tests         | Seven passed with fake upstreams.                                                                     |
| Browser integration test | Passed against the real API and in-memory SQLite, with fake Ollama/Qdrant responses.                  |
| Browser interactions     | Connect, run/result, note indexing, schedule approval, and disconnect passed.                         |
| Viewport check           | Desktop 1440 x 1000 and mobile 390 x 844 captured and visually inspected; no document-width overflow. |
| API and web builds       | Passed; Vite reports a large shared-UI bundle warning.                                                |
| Compose configuration    | Passed with a test-only token.                                                                        |
| Docker build stage       | Linux dependency install and API/web compilation passed; API image loaded locally.                    |
| API container smoke test | Passed with current source mounted read-only: health 200, missing token 401, authenticated tasks 200. |
| Version alignment        | Passed at existing version 1.0.42. No version bump requested or performed.                            |

Screenshots are local artifacts under root `dist/agentcrew/verification/`, not committed documents.
UI inspection found readable hierarchy, aligned form columns, green success indicators, and a single-column mobile layout.

The temporary API container was running without an OOM kill and was stopped and automatically removed after verification.
Its disposable test database contained no user data. The full Compose stack and final Nginx web image were not run.
One host Docker CLI invocation ran out of memory; the subsequent inspection and HTTP smoke checks succeeded.

## Installation and audit limits

Host npm lockfile generation was blocked by `EALLOWREMOTE` for an existing Tailwind optional dependency.
The offline attempt hit the same policy. No npm security policy was changed.
The lockfile adds only AgentCrew workspace metadata and the existing local Playwright package metadata with its recorded integrity hashes.
The isolated Linux Docker install succeeded without using the host npm configuration.

The container install reported six dependency vulnerabilities: five high and one critical.
This includes the inherited repository dependency graph. No full vulnerability triage or forced dependency upgrade was performed.
Resolve and verify those findings before production deployment.

Repository-wide architecture and module checks report existing failures in CRM, Q Cafe, Orship, Zetro2, and other areas.
These global checks are not a clean release gate. Unrelated modules were not changed to make the audit pass.

## Manual lifecycle script checks

Added setup, update, and drop scripts with an external `codexsun-network` connection for the web gateway.
Six fake-Docker lifecycle tests passed, including network creation/reuse, model download selection, GPU options, purge guards, and failure handling.
Compose configuration validation passed after the network change. No live setup, update, purge, or model download was executed.
Existing live-inference and production acceptance limits still apply.

## Docker naming

The project, containers, built images, and volumes now use the `cx-agentcrew` name.
The external network remains `codexsun-network`. Official upstream image references and application package names remain unchanged.
This is a configuration rename only. No live resources or data were migrated or removed.
All six lifecycle tests passed after the rename. CPU and GPU Compose configuration checks passed.
Resolved project, container, image, volume, and shared-network names matched the requested naming.

## Remaining acceptance work

- Resolve the live Qwen task timeout described below and repeat complete task verification.
- Verify Qdrant persistence, snapshot recovery, and note retrieval quality.
- Measure cold/warm latency and memory use on the intended CPU or GPU host.
- Test database backup/restore and restart recovery against a real persistent volume.
- Review dependency vulnerabilities and pin tested container digests before production use.
- Add token streaming, note lifecycle controls, and better retrieval only after measuring the baseline.
- Add repository tools only through a separately approved sandbox and permission design.

This implementation has no unrestricted coding tools, permission escalation, autonomous prompt rewriting, or self-modifying code.

## Local Docker deployment on 2026-09-24

The `cx-agentcrew` stack is running on Docker Desktop at `http://127.0.0.1:6411`.
All four containers are running. API and Ollama health checks pass.
Only the web gateway joins `codexsun-network` and publishes a loopback port.
The ignored `.container/.env` contains the generated access token. No credentials were included in this document.

- Installed `qwen3:4b` (2.5 GB) and `nomic-embed-text:latest` (274 MB).
- Verified dashboard HTTP 200, unauthenticated API HTTP 401, and authenticated service/model status HTTP 200.
- Verified live browser connection without page errors and mobile document-width overflow.
- Captured `dist/agentcrew/verification/live-desktop.png` and `live-mobile.png`. Inspected the mobile capture.
- Indexed one labeled deployment smoke note and retrieved it with a similarity score of 0.866.
- Confirmed that Ollama generates text through the private network. This does not prove completed task quality.
- The complete RAG task exceeded the 180-second upstream timeout and triggered a retry. The 240-second verification deadline expired.
- Cancelled that test task to stop further retries. Its task/run history and labeled test note remain available as evidence.
- Short direct probes returned lengthy reasoning despite `think: false`, and hit their output limits. CPU generation was approximately four tokens per second.

The application is deployed, but reliable end-to-end model-task completion is not yet verified.
The dashboard build initially failed at runtime because shared navigation lacked public application port defaults.
The web build now reads public registry defaults, with the existing CXForge port as a compatibility fallback.
The Docker build copies only registry metadata, not root secrets. The rebuilt dashboard passed the live browser check.
Backup recovery, restart persistence, model-quality tuning, and production hardening remain unverified.
