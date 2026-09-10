# Windows sandbox enforcement

## Ownership and contracts

Codex Connection API 0.10.0 owns official setup, disposable verification, and the project-turn gate.
Settings web 0.5.0 owns confirmation and status presentation through public shared UI primitives.
The [connection README](../../../apps/zetro/api/src/modules/codex-connection/README.md) defines request properties and lifecycle.
Reference: [official App Server protocol](https://learn.chatgpt.com/docs/app-server).

## Decisions

The provider starts from a neutral private storage directory. Each turn receives its own confirmed workspace roots.
Starting the provider from the repository root widened the observed sandbox write access.
Setup success is not proof. Direct commands and agent turns must both pass disposable checks.
Readiness expires after 15 minutes and on provider shutdown. No full-access fallback exists.
The user approved official elevated Windows setup and the localhost exception.
Localhost access supports local APIs and browser tests. It can also reach local services, so those services require authentication.
Public-network verification samples a TCP connection to `1.1.1.1:443` after a successful unsandboxed baseline.
These checks do not prove isolation against every escape, protocol, destination, or local proxy.

## Live evidence

Official Windows setup completed successfully on 2026-09-10.
Strict localhost-denial verification failed, as expected on this native runtime.
After explicit localhost approval, direct and agent paths passed all eight checks at 10:47:49 UTC.
Both approved folders accepted writes. The sibling sentinel remained unchanged. Public TCP access was blocked.
Disposable fixture: `storage/app/private/zetro/sandbox/probe-UX6l9k`.
An earlier agent attempt lacked usable output and remained blocked. Missing evidence never grants readiness.
No business files, live accounts, or database rows were test targets.

## Parallel boundaries and handoff

The initial checkout was clean. Changes are limited to Zetro and its Assist documentation.
No shared package, Identity implementation, or unrelated application was changed.
The installed desktop remains 0.1.27 without this new code. Source verification is not installation verification.
No commit, push, installer replacement, or production deployment occurred.

## Verification

### Chat acceptance follow-up

The installed desktop completed read-only chat job `841e8a11-1469-4fc1-a301-a5766e9d07f9` on 2026-09-10.
Its conversation is `6b271e3e-30da-4043-8c9a-2d514b5087c4`. This older installation does not contain the sandbox candidate.

Fresh packaged-runtime checks exposed model transcription errors in long encoded probe commands.
One observed error changed `node:net` into `node:nod`, so no agent probe files were created.
Failed attempts remained blocked. The repair uses a short command and a host-written probe file outside approved roots.
The host rejects changed probe code. A regression test covers command length and tampering.
The repaired packaged API passed all eight checks at 11:08:33 UTC.
The acceptance harness then hit duplicate repository registration. It now reuses the existing discovered repository.

After repair, the fresh packaged runtime passed all eight sandbox checks again at 11:09:24 UTC.
Two read-only repository chat jobs completed:

- `6cfeda63-f868-426c-bbaa-f906570d5caf`, conversation `51375686-0d88-44bb-8802-7b41891e7768`.
- `bac0a34e-ccae-4ee1-9da0-fcd60f615d6d`, conversation `daf6009e-1e26-4ac1-a2f7-392ba83cf75f`.

Both returned Zetro purpose, API port 6050, web port 6060, and a clean worktree report.
Host Git checks confirmed both worktrees were clean. SQLite integrity returned `ok`, with two saved conversations.
Evidence is retained under `storage/app/private/zetro/chat-acceptance/run-KnCOdc`.
The candidate API used reserved loopback port 6196 and exited with code 0 through desktop stdin shutdown.

One desktop test rebuild failed because the acceptance runtime held its SQLite native binary open.
After shutdown, the same desktop test command passed: two Rust tests and the packaged lifecycle test.
The complete API suite, 14 focused connection tests, API typecheck, lint, and file-length checks passed.
The earlier full repository check predates this transcription repair. It was not rerun as a full gate.

Verdict: chat transport, observed tool activity, saved replies, and sampled sandbox checks passed in the candidate API.
This was read-only acceptance, not business-feature delivery or a matching installed release check.
Production approval still needs a clean reviewed commit, matching installer, installed UI/restart checks, and release-gate evidence.
PowerShell command completion alone cannot prove every subcommand succeeded. Non-terminating errors can precede a successful final command.
Do not treat the task status as a replacement for result review or production acceptance.

The follow-up changes only Codex Connection implementation, its tests, and documentation.
Earlier uncommitted work remains intact. No installer, commit, or push occurred.

### Source checks

- Focused connection tests: 13 passed, including HTTP confirmation, explicit policy, network failure, and late setup failure.
- Complete Zetro API and web test scripts passed. Log: `dist/zetro-sandbox-tests.log`.
- API and web typecheck, lint, and production builds passed.
- Shared UI, module documentation, module boundaries, dependency bindings, and file-length checks passed.
- The Settings security screen loads separately to keep the main JavaScript chunk below 400 KB.
- Live setup and both sandbox execution paths: passed with the approved localhost exception.
- Browser interaction, installed-desktop upgrade, Docker deployment, and business-task acceptance remain unverified.
- Full `npm.cmd run check` passed, including desktop compilation and server lifecycle tests. Log: `dist/zetro-sandbox-check.log`.
- Readiness warnings in that log belong to asserted dependency-failure tests, not production build warnings.
- Root format, application documentation, file-length, and `git diff --check` checks passed.
