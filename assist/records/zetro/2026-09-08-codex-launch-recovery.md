# Zetro Codex Launch Recovery

## Outcome

Zetro now finds the Codex desktop executable on Windows when the API process
cannot resolve `codex` through `PATH`. A failed App Server spawn returns a
controlled API error and does not stop the Zetro stack.

## Authoritative references

- Owner README: `apps/zetro/api/src/modules/codex-connection/README.md`
- Application README: `apps/zetro/README.md`
- Application catalog: `assist/modules/zetro.md`
- Runtime contract: `assist/architecture/runtime-foundation.md`

## Ownership and boundaries

The Codex connection API module owns command discovery and App Server process
lifecycle. The chat API continues to translate provider failures into HTTP 503
responses. The Zetro web module remains unchanged.

## Binding properties

| Producer         | Consumer                | Binding                                     |
| ---------------- | ----------------------- | ------------------------------------------- |
| Root environment | Codex connection module | `ZETRO_CODEX_COMMAND` explicit override     |
| Codex desktop    | Codex connection module | `%LOCALAPPDATA%\OpenAI\Codex\bin` discovery |
| Child process    | Zetro API               | handled `spawn`, `error`, and `exit` events |
| Chat API         | Zetro web               | controlled HTTP 503 provider error          |

## Parallel work

The worktree contains unrelated Platform, Docs, DevKit, shared UI, runtime, and
Zetro changes. This fix changes only the Zetro-owned provider launcher, its
tests, module version, and related documentation.

## Decisions

- Keep an explicit command override authoritative.
- Discover the newest Codex desktop executable only for the default Windows command.
- Handle startup errors on the child process before sending App Server messages.
- Permit a later request to retry startup after a launch failure.
- Do not use a shell to resolve or launch the command.

## Database and API changes

- Database update: No.
- HTTP contract update: No.
- Module version: `zetro.codex-connection.api` `0.5.1`.

## Verification

- Zetro API type check: Passed.
- Connection regression tests: Passed, 2 tests.
- Windows discovery test: Passed with two simulated desktop installations.
- Missing-command retry test: Passed without process termination.
- Live liveness request: Passed at `GET /health/live`.
- Live account request: Passed with the installed Codex desktop executable.
- Live provider turn: Passed and returned `OK` without tool activity.

## Follow-up work

Add this regression to a Zetro production-artifact lifecycle test when that test
is added.
