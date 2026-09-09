# Zetro Chat Turn Stop

Date: 2026-09-09

## Outcome

The Zetro message timeline uses one separator when the calendar day changes.
The live working row and composer control can stop an active Codex turn.

## Ownership and contracts

- `zetro.agent-chat.web` owns the stop control and browser request cancellation.
- `zetro.chat.api` owns the project-scoped stop route.
- `zetro.codex-connection.api` owns the App Server turn interruption.
- `POST /api/v1/chat/responses/:conversationId/stop` returns a `stopped` boolean.

The Codex connection tracks the thread ID and turn ID for each active Zetro
conversation. It sends `turn/interrupt` with both IDs. A stop requested during
startup waits for the turn ID. An inactive conversation returns `stopped: false`.

## Interface

The last turn border is absent when the next turn starts another local day. The
date section remains as the only visual boundary.

The working row shows the elapsed time and a spinner. Hover or keyboard focus
shows an orange stop state. The row is a labeled button with a pointer cursor.
The composer send button uses the same stop state while a turn runs. Stopping
from either control keeps the persisted user prompt and does not show a provider
error.

## Verification

- Zetro API and web type checks: Passed.
- Zetro API and web production builds: Passed without warnings.
- Complete Zetro test suite: Passed, 21 tests.
- Module documentation, dependency, boundary, version, application documentation,
  workspace layout, line limit, build output, affected lint, affected formatting,
  and `git diff --check`: Passed.
- Local inactive stop route: Passed with HTTP 200 and `stopped: false`.
- Browser check at `/zetro`: Passed for the day sections, turn layout, and console errors.
- A live Codex interruption was not exercised because it requires sending a new provider turn.

The repository-wide format check remains blocked by unrelated concurrent Orship
and Platform Core formatting changes. No commit or push was created.
