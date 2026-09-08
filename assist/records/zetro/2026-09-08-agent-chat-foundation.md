# Zetro Agent Chat Foundation

## Outcome

Zetro Desk now contains a modular agent chat interface. The Desk sidebar shows
conversation history. The workspace shows messages and an 80-percent-width
prompt composer.

## Authoritative references

- Owner README: `apps/zetro/web/src/modules/agent-chat/README.md`
- Desk README: `apps/zetro/web/src/modules/desk/README.md`
- Application catalog: `assist/modules/zetro.md`
- API contract: `apps/zetro/api/src/modules/chat/README.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

The Agent Chat web module owns conversation state, response validation, history,
messages, attachments, voice input, and the prompt composer. The Desk module
owns only the surfaces that contain this UI. The API keeps ownership of saved
conversations, provider calls, and isolated worktrees.

## Binding properties

| Producer       | Consumer   | Binding                                     |
| -------------- | ---------- | ------------------------------------------- |
| Agent Chat     | Zetro Desk | `AgentChatHistory` and `AgentChatWorkspace` |
| Zetro Chat API | Agent Chat | `/api/v1/chat` routes                       |
| Agent Chat     | MDI ITO    | Regions below `15.1` and `15.2`             |
| `tw-shimmer`   | Busy state | Orange shimmer utility                      |

## Parallel work

The worktree contains concurrent Platform, Docs, DevKit, runtime, shared UI,
and Zetro cleanup changes. This work preserves those files and does not restore
the deleted legacy Chat module.

## Decisions

- Create `zetro.agent-chat.web` as a new owner.
- Keep the Zetro Desk module free of chat state and API calls.
- Use 80 percent of the workspace canvas width.
- Keep New chat at the bottom of the history sidebar.
- Group pinned and recent conversations in collapsible sections.
- Support text, attachments, voice input, and workflow selection.
- Validate API responses with Zod.
- Use the orange shimmer only while Zetro processes a turn.
- Keep display density as a small app-owned tweak control.

## Database and API changes

- Database update: No.
- API update: No. The web module uses the existing Chat API.

## Verification

- Zetro web type check: Passed.
- Zetro web production build: Passed. The largest JavaScript chunk is 174.54 KB.
- Zetro API history tests: Passed, 2 tests.
- Zetro API workflow tests: Passed, 7 tests.
- Browser check at `/zetro`: Passed for the history sidebar, 80-percent workspace,
  prompt starter, workflow menu, composer, and isolated ITO entry point.
- Browser console check: Passed with no errors after a full reload.
- Provider-backed turn: Passed after the Windows Codex launch recovery. The API
  returned `OK` from an ephemeral Codex thread without tool activity.

## Follow-up work

Add streaming transport after the provider API exposes a stream contract.
