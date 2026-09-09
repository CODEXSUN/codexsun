# Zetro Dated Chat Timeline

Date: 2026-09-09

## Outcome

The Zetro chat timeline separates turns by local calendar day. A live elapsed
timer shows how long the active Codex turn has run.

## Ownership and contracts

- `zetro.chat.api` owns the persisted message creation time.
- `zetro.agent-chat.web` owns date labels and the live timer.
- Each new user and assistant message stores an ISO creation time.
- Legacy messages use their conversation creation time during startup migration.

## Interface

The first turn for each local day has one centered date section. Today and
yesterday use relative labels. Older sections show their calendar date. The
section also shows the first turn time.

The active turn shows `Working for 0s` after the conversation is saved and the
Codex request starts. The timer updates each second and stops when the request
completes or fails. Rename, archive, history, and scope requests do not show it.

## Verification

- Zetro API type check: Passed.
- Zetro web type check: Passed.
- Chat history tests: Passed, 7 tests.
- Zetro API and web production builds: Passed without warnings.
- Module documentation, dependencies, boundaries, versions, line limits, lint,
  workspace layout, build output, runtime validation, framework tests, runtime
  holder tests, server tests, affected formatting, and `git diff --check`: Passed.
- Browser check at `/zetro`: Passed for the migrated date section, turn layout,
  and console errors. The live provider timer was not exercised.

The complete repository check remains blocked by unrelated Orship formatting and
type errors. No commit or push was created.
