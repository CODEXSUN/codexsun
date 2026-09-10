# Stable release workflow preparation

## Outcome

Added an ordered, documented release workflow and the first framework task card.
Root check aliases reuse existing engines instead of duplicating their behavior.
The workflow does not automatically approve, merge, publish, or deploy.

## Owners and references

- [Release workflow](../../operations/stable-release-workflow.md) owns gate order and approval rules.
- [F001](../../tasks/framework-first-release.md) owns the first kernel release acceptance checklist.
- [Developer Tools](../../../apps/zetro/api/src/modules/developer-tools/README.md) owns npm execution.
- [Codex Connection](../../../apps/zetro/api/src/modules/codex-connection/README.md) owns provider timeout and cancellation.
- [Supervisor](../../../apps/zetro/api/src/modules/supervisor/README.md) owns approved job dispatch and history.

## Live installed desktop

Verified `C:/Program Files/Zetro/zetro-desktop.exe` as version `0.1.18`.
Its SQLite readiness passed on fallback port `55924`. Supervisor access was disabled.
The user approved a graceful relaunch with an in-memory token.
The installed application then paired successfully on port `16050`.

F001 review job `8d060199-eac5-45f5-b901-cd3333f4e662` was accepted and persisted.
It failed at the installed two-minute provider deadline. This is not a completed framework review.
Conversation `ec0a56c9-2371-48e3-878d-d924310a2439` identifies its isolated worktree.
Do not retry or advance a dependent release gate without review.

After these failures were reviewed, the rebuilt `0.1.19` candidate was launched separately
from the installed copy. Review job `157c4b95-6e6a-4cc1-b80f-c8a1e708e616`, conversation
`771afe02-0f7c-4fcd-b5c6-c12ff950a0a2`, returned useful findings on committed baseline `1a18b7e`.
One inspection command failed, so the job remained failed even though its answer was saved.
Three confirmed kernel defects were repaired with red-to-green tests in the
[framework record](../platform/2026-09-10-framework-release-guard.md).
The candidate did not exit after a native close request within 15 seconds.
Its verified, owned process tree was stopped before rebuilding; port `16050` was released.
Packaged API shutdown tests are not proof that the desktop window close path exits cleanly.

## Confirmed workflow defects and repairs

Windows rejected direct `spawn('npm.cmd', ..., {shell:false})` with `EINVAL`.
Developer Tools now resolves npm's JavaScript entry point and invokes it with Node.
It retains the named-script allowlist, repository trust policy, redaction, and hidden helper windows.
Cancellation checks before spawn and stops the owned Windows process tree.
The execution test uses real temporary npm scripts and checks failure, redaction, and pre-cancellation.

The provider deadline previously rejected local collection without cancelling the remote turn.
The source client now requests `turn/interrupt` before deadline failure.
An interruption failure closes its owned provider connection and rejects pending requests.
The bounded default is ten minutes. Large tasks still need smaller scopes.
The protocol follows [official App Server interruption](https://learn.chatgpt.com/docs/app-server#interrupt-a-turn).

## Parallel work and compatibility

The checkout started clean at `1a18b7e`. No application business code or shared UI was changed.
Root aliases are visible to Zetro after its connected repository script list refreshes.
The installed desktop does not contain these source repairs until a new release is built and installed.
Provider worktrees still use committed HEAD, not the current dirty checkout.

## Verification and next gates

- Real npm execution, failed exit, secret redaction, and pre-cancellation tests: passed.
- Provider interruption-on-timeout regression: passed.
- Framework public-contract tests: all seventeen passed against freshly built output.
- Full `check:release:adoption`: exit zero, including 27 workspace builds, lint, types,
  documentation, boundaries, shared UI, runtime, Zetro, identity, and server tests.
- Production chunk budget: 651 JavaScript chunks passed the 400 KB limit.
- Existing Git test fixtures emitted LF/CRLF warnings. Negative readiness tests emitted
  asserted failure logs. Neither is evidence of a production build warning; fixture cleanup remains open.
- Installed dispatch and durable failed-task reporting: verified.
- Live MariaDB integration: install, restart, schema drift, locking, rollback, recovery,
  and temporary database cleanup passed on the candidate source.
- Packaged API E2E: untrusted script rejected; trusted named npm script completed as a durable task;
  token stayed out of captured output; graceful shutdown passed.
- Framework stable review: findings received, but failed inspection command and final approval remain open.
- Platform Identity cross-app adoption, browser E2E, Docker, and release publication: not completed by this change.

Complete F001 review and regressions before P001 implementation.
Do not label a partially checked application set as stable.

## Candidate artifact

The final `desktop:zetro:msi` command exited zero after the complete source gate.
Artifact: `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.19_x64_en-US.msi`.
SHA-256: `B50441A481084FE92667F0A5B0E00754B7287065BC9585C14E8925D6DA864BCA`.
The executable is unsigned. The installed copy remains `0.1.18`; installation/upgrade is unverified.
The final `0.1.19` root-dist executable was relaunched with an in-memory pairing token
and passed readiness on loopback port `16050`. No commit, push, or publication was performed.
