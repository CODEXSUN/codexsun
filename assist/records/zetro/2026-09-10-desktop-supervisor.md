# Desktop supervisor bridge

## Outcome and ownership

Zetro adds a local supervisor API for approved agent jobs, status, saved results, and cancellation.
The [Supervisor README](../../../apps/zetro/api/src/modules/supervisor/README.md) owns the protocol.
Chat exposes public services. System Tasks adds an optional single-attempt handler policy.
The CLI calls the protocol without implementing another execution engine.

## Runtime bindings

The desktop inherits `ZETRO_SUPERVISOR_TOKEN` from its launch environment.
The API requires loopback access and a separate bearer token. Browser origins are rejected.
Desktop runtime fixes production environment, SQLite, and local queue settings explicitly.
The provider child does not inherit the three Zetro access tokens.

Jobs use committed project HEAD in isolated worktrees. Review is the default workflow.
An interrupted agent job becomes blocked. A caller must inspect its worktree before resubmission.
This first adapter does not implement distributed admission, human approval inboxes, or deployment engines.
Normal desktop exit sends a shutdown command through its child stdin pipe before the eight-second forced-stop fallback.
Active-task queries bypass the recent-history limit, and local queue close waits before storage closes.

## Parallel work

Existing UIUX renames, shared UI, Orship, deployment, and application edits were preserved.
The user authorized a complete reviewed repository commit and push with this desktop release.

## Verification

- Full root `npm.cmd run check`: Passed, including workspace builds, lint, types, tests, and ownership gates.
- Live `test:mariadb:foundation`: Passed, including install, restart, schema drift, locks, rollback, recovery, and cleanup.
- Runtime catalog validation: Passed for seven applications and fourteen components.
- Platform-only runtime smoke: Blocked by the existing Platform API listener on port 6010. It was preserved.
- Supervisor tests: Passed for authentication, validation, durable chat results, cancellation, and interrupted-job replay prevention.
- Packaged API lifecycle test: Passed for readiness, token isolation and redaction, stdin shutdown, and port release.
- Desktop Rust tests and Clippy with warnings denied: Passed.
- Final API/CLI typecheck, build, lint, CLI tests, formatting, versions, and module gates: Passed.
- Native release desktop and live provider job: Passed. The connected README was read with a completed command and a saved answer.
- Native window exit: Passed. The API recorded `desktop-stdin` shutdown with version `0.1.18`.
- Windows long-path worktree regression: Passed. Git uses `core.longpaths=true` per command without changing repository settings.
- Installer upgrade, Authenticode signing, Docker deployment, and business coding jobs: Not verified.

## Release operation

The CLI `desktop-session` launcher creates a random in-memory token and accepts JSON command arrays on stdin.
Confirmed `supervisor connect` calls the existing Projects service to register a repository.
The launch session exposes no token in output, command arguments, or files.
Desktop logs receive the compiled application version. ExitRequested requests shutdown before the window host exits.
An empty abandoned `development-workflows` directory was removed. It contained no files or data.
The first live supervisor job captured a Windows long-path checkout failure in durable history.
The worktree adapter now supports long tracked paths. Failed history is preserved for diagnosis.
The next live job exposed Windows AppData redirection. Codex connection `0.7.1` compares resolved filesystem paths and returns the physical worktree path.

## Live failure diagnosis

The redirected AppData directory was still denied to the Codex Windows sandbox.
New desktop worktrees now use `%USERPROFILE%/.zetro/worktrees`. Existing worktrees
remain in place for recovery. No sandbox restriction or filesystem permission was weakened.
Both thread and turn requests bind the resolved working directory, following the
[App Server contract](https://learn.chatgpt.com/docs/app-server#start-a-turn).
The source-level read-only provider test then read the connected README successfully.

Supervisor jobs now fail when the provider reports a failed tool action, even if an
assistant answer exists. Chat preserves that answer and bounded, redacted failure details.
The 20-item activity summary prioritizes failures so a late failure is not hidden.
Regression tests cover directory binding, late failures, redaction, and false-green prevention.

## Final release evidence

- Desktop version: `0.1.18`; release API: `127.0.0.1:16050`.
- Live supervisor job: `b0cf64c0-685e-42c6-8bbc-d4533d1fb31f`.
- Conversation: `6b23f0c2-7d33-472b-99e1-cec1264f2149`.
- Result: completed on 2026-09-10 at 04:33 UTC, one successful README read, no failed actions.
- The isolated worktree remained clean. This was a read-only test, not a business-code delivery test.
- MSI: `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.18_x64_en-US.msi`.
- MSI SHA-256: `92888B30F9F91535811B792C460BF877BD133076794608429F3D1F8F677EFEA0`.
- Release EXE SHA-256: `60C5CC07B8BE8259878F324F7C26D0FD9AAD1DF85AD02742BD2AF51DC4A8D642`.
- Both artifacts are unsigned. The release executable was launched directly; the installed copy was not upgraded.
