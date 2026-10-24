# Codeit roadmap

All future milestones remain planned until implementation and evidence satisfy their gates.

## First usable product

M0 resolves contracts, storage, provider, local identity, runner isolation, and task ownership.
M1 delivers persistent chat, selected project context, a real provider adapter, plans, and read-only tools.
M2 delivers bounded source changes, tests, diff review, cancellation, and a reliable repair loop.
M3 delivers one supervisor with at most two isolated implementation workers and explicit integration review.
M4 adds reviewed plugin/MCP lifecycle, explicit personalization, and optional Platform launch integration verification.
M5 packages and verifies the complete local product, upgrade, backup, restore, and recovery.

Ship a narrower verified milestone rather than labeling unavailable execution or providers as working.
Keep known limitations visible in the app and release evidence.

## Later capabilities

| Future capability               | Prerequisites and gate                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Rich editor and LSP navigation  | Proven workspace boundaries, document versions, diagnostics, safe save and conflict handling           |
| Interactive terminal/debugger   | Proven sandbox, PTY/process lifecycle, explicit grants, sensitive-output policy                        |
| Reusable workflow/skill library | Versioned artifact contract, trust review, explicit capabilities, no prompt-based privilege            |
| Plugin marketplace              | Integrity verification, signing/provenance policy, reviewed install, sandbox, upgrade and revoke tests |
| Remote workers                  | Authenticated transport, secrets isolation, lease fencing, resource quotas, reconnect evidence         |
| Team collaboration              | Real identity, role checks, project membership, audit, tenant/database policy where applicable         |
| Cloud project execution         | Isolated compute, network policy, billing budgets, repository access and retention controls            |
| Offline/local model             | Selected model/runtime compatibility, hardware budget, privacy, meaningful coding evaluation           |
| Scheduled background tasks      | Explicit schedules and authorization, budget enforcement, actionable notifications, cancel controls    |
| Git PR/release automation       | Exact repository grants, branch protection, CI proof, user-authorized publishing and rollback boundary |
| Automatic IDE adapters          | Documented APIs, supported versions, scoped credentials, lifecycle and result verification             |

## Operational measures

Measure request-to-first-event latency, cancellation latency, recovery success, tool denial accuracy, and verified task completion.
Record actual token/cost usage when available. Keep unknown measurements explicit.
Set numeric performance budgets in T00 from fixture measurements and target hardware.
Do not invent performance claims or universal provider quality scores.
Track regression cases and unresolved high-impact failures before widening concurrency or permissions.

## Release discipline

Separate local build, packaged installation, signing, deployment, and live validation.
Do not bump versions, publish artifacts, or deploy from this plan alone.
The release candidate needs exact revision, passed gates, known limits, migration/backup evidence, and recovery instructions.
