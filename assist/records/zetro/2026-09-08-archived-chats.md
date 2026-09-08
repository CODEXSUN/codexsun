# Zetro Archived Chats

## Outcome

Zetro history rows now show an Archive action on hover and keyboard focus. The
Zetro workspace includes an Archived chats view for search, restore, permanent
single deletion, and permanent bulk deletion.

## Authoritative references

- API owner: `apps/zetro/api/src/modules/chat/README.md`
- Web owner: `apps/zetro/web/src/modules/agent-chat/README.md`
- Application catalog: `assist/modules/zetro.md`
- Application README: `apps/zetro/README.md`

## Ownership and boundaries

The Chat API owns archive timestamps, active and archived filters, and permanent
conversation deletion. Agent Chat owns the hover action and archive workspace.
The Desk module continues to supply only the sidebar and canvas surfaces.

Permanent deletion removes the saved conversation record. It does not remove
the isolated Git worktree. Worktree cleanup remains a separate lifecycle flow.

## Binding properties

| Producer       | Consumer   | Binding                                             |
| -------------- | ---------- | --------------------------------------------------- |
| Agent Chat     | Chat API   | PATCH `archived` state                              |
| Chat API       | Agent Chat | GET list with `archived=true`                       |
| Agent Chat     | Chat API   | guarded single and bulk DELETE routes               |
| Zetro API CORS | Agent Chat | DELETE allowed for the configured web origin        |
| Agent Chat     | MDI ITO    | `15.1.3` archive workspace and `15.2.3` open action |

## Parallel work

The worktree contains unrelated Platform, Docs, DevKit, shared UI, runtime, and
Zetro work. This change stays inside the Zetro Chat and Agent Chat owners plus
their catalog, record, and changelog entries.

## Decisions

- Keep the public application URL at `/zetro` and switch workspace content locally.
- Hide row archive and delete actions until hover or keyboard focus.
- Require archive state before permanent deletion.
- Require a confirmation dialog for single and bulk deletion.
- Preserve worktrees after conversation deletion.

## Database and API changes

- Database update: No.
- Persistence update: Add an optional `archivedAt` value to JSON records.
- Chat API module version: `0.6.0`.
- Agent Chat web module version: `0.2.0`.

## Verification

- Zetro API and web type checks passed.
- All 14 Zetro API tests passed, including archive, restore, guarded deletion,
  bulk deletion, Codex connection, workflow, and worktree coverage.
- The Zetro production build passed. Every JavaScript chunk remained below the
  400 KB budget.
- Browser verification passed at `/zetro`: archive, archive search, guarded
  permanent-delete confirmation, cancel, restore, and history refresh worked.
  The browser console contained no warnings or errors after verification.
- The complete repository `check` command passed, covering workspace layout,
  file limits, application and module documentation, formatting, lint, type
  checks, builds, framework tests, Platform web tests, and server lifecycle
  tests.
- `git diff --check` passed.

## Follow-up work

Add an explicit worktree cleanup screen before permanent worktree deletion is
allowed.
