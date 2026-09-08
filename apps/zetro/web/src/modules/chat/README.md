# Zetro Chat Web

## Contract

- Module ID: `zetro.chat.web`
- Version: `0.5.0`
- Owner: Zetro web
- Flow: select or start a conversation, send a multimodal prompt, and manage conversation history

The module owns the conversation workspace, history drawer, attachments, browser speech recognition, speech synthesis, validation, API calls, and interface states. The API base URL comes from `VITE_ZETRO_API_URL`. An empty value uses the current origin and the Vite development proxy.

The drawer lists pinned conversations first and recent conversations second. An icon toggle collapses the desktop drawer to a narrow rail. The new-chat action stays at the bottom. The drawer also supports selection, inline rename, and pin actions. The API owns history persistence.

Voice recognition depends on browser support and has a typed fallback. The client sends encoded attachments only when the user submits a turn.

Each assistant reply can show an isolated-task summary. The summary shows the worktree path, available coding tools, and completed tool activity.

The composer has delivery, development, documentation, review, and test workflows. Zetro stores the last selected workflow in browser local storage.

The delivery workflow shows its ordered stages below the selector. It marks commit and push as an approval-gated final stage.

Completed Deliver replies show the persisted stage status and evidence. The panel also shows whether the record is ready for publication.

The client sends the latest delivery record when the user continues the conversation. It does not send unvalidated interface state.

The empty workspace shows prompts that match the selected workflow. The execution summary records the workflow used for each response.

There are no frontend migrations, permissions, events, jobs, or persistent business records. Customization state belongs to the app shell and is stored in browser local storage.

## Verification

Run the Zetro web typecheck and build. Verify the workflow selector, task summary, worktree path, tool list, and activity states.

Also verify history, rename, pin, keyboard submission, attachments, voice states, and API errors.

## Interface topology

The module owns the Chat workspace topology. It identifies history, conversation,
empty, message, workflow, composer, attachment, voice, and send controls.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-08 Cross-app interface topology](../../../../../../assist/records/platform/2026-09-08-cross-app-interface-topology.md)
