# F001: Framework first stable release

## Assignment

Owner: Framework package maintainer. Executor: Zetro agent. Reviewer: supervising developer.
Baseline: `1a18b7e`, version `0.1.18`. Candidate: `0.1.20`.
Technical implementation and verification: complete. Stable release approval: pending.

Deliver a verified minimal kernel. Do not add speculative framework capabilities.
Read the [release workflow](../operations/stable-release-workflow.md) before execution.

## Allowed scope

- `packages/framework` owns runtime-neutral contracts and lifecycle behavior.
- `tools/framework-contract.test.mjs` owns its existing public-contract regression suite.
- Framework references and this task record own the corresponding documentation.

Changes to Platform Core or an application need a separate owner assignment.
Do not move identity, database, HTTP, UI, tenancy, or business CRUD into the kernel.

## Required review

1. Inspect public exports and unknown-input manifest validation.
2. Verify duplicate IDs, dependency ranges, cycles, event versions, and extension cardinality.
3. Verify deterministic immutable plans and registry locking.
4. Verify install, upgrade, activation, rollback, deactivation, and uninstall behavior.
5. Test repeated and overlapping lifecycle calls, failure recovery, and cancellation semantics.
6. Check that reporting errors cannot hide cleanup failures or leak active resources.
7. Add regression tests for every confirmed defect before fixing it.
8. Verify all affected Platform Core and application consumers through public exports.

## Definition of done

- Every confirmed high or medium severity blocker is fixed or explicitly excludes stable approval.
- Kernel tests pass against freshly built output.
- Framework lint, types, boundaries, dependency checks, and documentation gates pass.
- Every affected consumer passes its checks against the proposed shared contract.
- Lifecycle failure and concurrency semantics are documented, not inferred.
- No build warning remains. Authored files remain below 700 lines.
- The reviewer records the exact tested revision and patch decision.
- The user approves the release before publication or a stable designation.

## Commands

Run `npm.cmd run check:release:framework` once for the candidate.
Run `npm.cmd run check:release:adoption` after integration to verify consumers.
Use Zetro's trusted repository script task instead of asking an agent to repeat individual commands.

## Evidence fields

Record task ID, conversation ID, worktree path, source revision, findings, changed files,
test commands, exit codes, failure logs, unverified items, and reviewer decision.

## Current execution

Original desktop execution: `0.1.18`, paired loopback API on `16050`.
Initial review job: `8d060199-eac5-45f5-b901-cd3333f4e662`.
Conversation: `ec0a56c9-2371-48e3-878d-d924310a2439`.
This review is read-only. A completed answer does not mean F001 is accepted.
The first job failed at the installed two-minute deadline. No framework findings were saved.
Source repairs extend the bounded deadline and cancel timed-out provider work.
Candidate review job `157c4b95-6e6a-4cc1-b80f-c8a1e708e616` saved findings,
but failed its execution gate because one inspection command failed. It is not a green job.
The candidate's seventeen kernel tests pass after concurrency, manifest mutation,
and reporter exception defects were reproduced and repaired.
See the [lifecycle guard record](../records/platform/2026-09-10-framework-release-guard.md).
Global capability uniqueness was not adopted: current declarations are module-scoped.
The full source/consumer gate and live MariaDB foundation integration passed.
Candidate review, desktop close-path investigation, fixture warning cleanup,
and explicit stable approval remain required before advancing the release.

The installed `0.1.19` startup and idle close passed on the next verification cycle.
Read the [0.1.20 log](../records/zetro/2026-09-10-desktop-0.1.20-verification.md) for current evidence.

## 0.1.20 follow-up

The additional cleanup ownership defect was reproduced and fixed. Nineteen kernel tests now pass.
Zetro job `2a44ba27-889d-48b8-be77-57d7071bf748` completed and confirmed both cleanup repair paths.
Idle and post-agent desktop close checks passed. Git fixtures now use explicit local line-ending settings.
The final consumer gate passed after the cleanup repair. All 27 workspace builds passed.
MariaDB integration and the live Platform profile startup, readiness, shutdown, and port-release smoke passed.
Supervisor review and regression evidence close the confirmed F001 code defects.
This is technical acceptance of the candidate patch, not a clean-commit release or all-application certification.
Stable publication still requires user approval. P001 identity and A001 application adoption remain separate tasks.
