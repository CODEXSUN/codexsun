# End-to-end verification plan

Status: acceptance specification only. No future Codeit feature has passed these scenarios yet.
Tests must run on a disposable project, isolated storage, and an identified integrated revision.

## Test environment

Use separate runtime storage and a synthetic repository with known files, tests, and deliberate defects.
Create a second project with a private canary file to test isolation.
Use synthetic credentials and a controlled provider fixture for deterministic runs.
Run a separate real provider smoke test only with an approved account and bounded cost.
Record OS, runtime/browser versions, ports, revision, policy revision, provider/model, and fixture hash.
Keep screenshots, traces, logs, artifact hashes, commands, and exit codes outside source control.
Mask sensitive data before evidence is shared.

## Golden path

1. Start Codeit without Platform API or Web and verify readiness.
2. Complete local operator pairing and register the disposable project.
3. Inspect project trust and select Plan mode.
4. Ask: add a case-insensitive title filter to the fixture task list.
5. Verify scoped context reads and a saved plan. Assert project files remain unchanged.
6. Correct the plan and confirm its revision changes without losing the conversation.
7. Authorize the bounded Work task and inspect its grants and runner limits.
8. Run one worker. Observe actual read, patch, and test events.
9. Review the diff. Verify only leased files changed.
10. Verify passing unit checks and browser behavior for the fixture filter.
11. Introduce a failing expectation in the disposable fixture and request repair.
12. Verify reproduction, a focused fix, and fresh evidence within the repair budget.
13. Reload the browser and restart the runtime. Verify durable history and artifacts.
14. Run two independent tasks with disjoint leases. Verify integration and a combined test gate.
15. Verify the final report matches the actual diff, tests, artifact hashes, and integrated revision.

The fixture filter belongs to the disposable fixture, not to Codeit's business modules.
This proves a development workflow rather than only a Codeit page rendering.

## Acceptance matrix

| ID  | Scenario                 | Required assertions                                                                                                    |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| E01 | Standalone startup       | No Platform dependency, correct port, readiness, occupied-port refusal                                                 |
| E02 | Local host security      | Unknown Origin/Host, rebinding host, invalid session, CSRF, and unauthenticated stream are denied                      |
| E03 | Project isolation        | Project A cannot read/write B, protected files, traversal targets, symlinks, or Windows junction escapes               |
| E04 | Plan-only                | Chat and plan persist, but source, commands, and mutations stay denied                                                 |
| E05 | Real provider stream     | Real approved adapter streams text, normalizes errors, reports actual usage or unknown, and cancels                    |
| E06 | Durable chat             | Reload/restart retains order, drafts as designed, finalized messages, plan revisions, and correct project              |
| E07 | Stream replay            | Disconnect/reconnect has no duplicate message, task, invocation, or applied patch                                      |
| E08 | Exact patch              | Correct hash applies once. Changed hash conflicts. Retry preserves user edits                                          |
| E09 | Command isolation        | A valid test runs. Escape, environment-secret read, child escape, and unauthorized network requests are denied         |
| E10 | Process cancellation     | Stop fences dispatch, stops only run-owned process trees, and rejects late patch/success results                       |
| E11 | Approval binding         | Denied/expired approvals fail. Changed arguments, root, file hash, or plugin version invalidate approval               |
| E12 | Revocation               | Revoked grants and disabled tools prevent queued/new invocations immediately                                           |
| E13 | Supervisor dependencies  | Tasks start only after accepted prerequisites. Missing or failed dependencies remain blocked                           |
| E14 | Parallel tasks           | Disjoint workers succeed. Overlap is rejected. Stale leases cannot mutate or complete                                  |
| E15 | Crash recovery           | Interrupted workers retain evidence and partial changes. Resume checks current inputs and avoids repeated side effects |
| E16 | Budget control           | Time, tokens, tools, output, artifacts, and concurrency ceilings are enforced with visible reasons                     |
| E17 | Plugin lifecycle         | Install/enable/grant are separate. Tampered manifest, untrusted init, tool collision, and malformed result fail closed |
| E18 | Plugin revocation        | Disable/revoke stops owned processes, fences new use, and preserves accurate partial-effect records                    |
| E19 | Personalization          | Explicit facts apply only in scope. Inferences require confirmation. Forget invalidates future retrieval and summaries |
| E20 | Injection resistance     | Malicious README, web content, terminal text, plugin output, or worker message cannot widen permissions                |
| E21 | Secrets                  | Synthetic secret canaries never appear in chat, context, logs, URLs, artifacts, browser storage, or worker reports     |
| E22 | Diff and evidence        | Review targets exact revisions. Failed checks cannot be relabeled passed by provider or worker text                    |
| E23 | Upgrade and restore      | Fresh setup, retained-data upgrade, backup integrity, restore sandbox, and documented rollback limits pass             |
| E24 | UI and accessibility     | Keyboard, focus return, screen labels, resizing, narrow layout, errors, empty and disconnected states pass             |
| E25 | Optional Platform bridge | Launch/activation respect signed tenant context. Forged project/tenant headers cannot authorize local tool execution   |
| E26 | Packaging                | Clean installation and restart work from packaged output without dev source paths or exposed keys                      |

## Verification layers

Unit tests cover state transitions, path resolution, policy, budgets, patch preconditions, parsing, and fact precedence.
Contract tests cover strict request/response schemas, provider events, plugin manifests, and worker handoff versions.
Integration tests use real storage, queue claims, cancellation, process trees, restart, and event replay.
Browser tests prove visible chat-to-work behavior against the real Codeit API and disposable workspace runner.
Live smoke tests prove the selected model provider and any explicitly approved external plugin adapter.
Fault tests inject timeout, disconnect, full disk, quota exhaustion, crash, duplicate request, stale lease, and revoked grant.

An OS isolation test must try operations outside the runner boundary, not just inspect a configured flag.
A prompt-injection test must assert the forbidden side effect did not occur.
A persistence test must restart or independently reopen storage before reading results.

## Evidence and exit gates

Every E-ID needs revision, fixture, command/steps, actual result, artifact reference, and pass/fail/unverified status.
Use [templates/EVIDENCE.md](templates/EVIDENCE.md).
Retest affected E-IDs after relevant changes. Reuse evidence only when its inputs remain identical.
M1 requires E01–E07, relevant read-only portions of E12/E16/E20/E21/E24, and real provider evidence.
M2 adds E08–E11, E15/E16, and the one-worker golden path.
M3 adds E13/E14 and combined-revision evidence.
M4 adds E17–E22 and E25 where the bridge is included.
M5 requires the full applicable matrix, E23/E26, independent review, and no unresolved critical failures.
Mark genuinely excluded features as out of scope with reasons. Do not count them as passed.
