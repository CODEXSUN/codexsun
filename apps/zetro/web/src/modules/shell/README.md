# Zetro Shell Web Module

- Module ID: `zetro.shell.web`
- Version: `2.3.0`
- Owner: Zetro web

This module owns the focused Zetro 2.0 chat. It composes public `@codexsun/ui`
controls and sends the user's exact text prompt to the web workspace's local
Codex bridge. A durable turn is accepted first. Its reconnectable event stream contains the raw request, non-message
Codex items such as command execution and output, response deltas, errors, and
completion or interruption. One durable Codex thread is retained for the current
conversation so follow-up prompts share context. The browser keeps its conversation ID
in local storage and migrates the earlier tab session ID. It loads stored turns from
the Zetro API on start and reconnects an active turn after the latest stored sequence.
Temporary stream failures use bounded exponential backoff and show `Reconnecting`.
Permanent request errors stop retrying. Stop sends the exact active turn ID.
The UI renders event data and assistant output as text, not
interpreted HTML or Markdown.

The left-aligned working separator reports elapsed seconds and shimmers only while
a turn is active. Consecutive raw events are compacted into process headings that
preserve stream order. Each heading has a chevron and reveals the complete raw JSON
on demand; the current process heading also shimmers. There is no attachment input
or image/file field in the request contract.
When the reader scrolls away from the latest content, a shared message-scroller
control returns to the present position. Each completed response exposes a copy
action that copies assistant result segments only; request, reasoning, command,
and other activity data are excluded. The copy action appears on response hover
or keyboard focus.
The conversation viewport uses the full screen width so its scrollbar remains at
the window edge. Responsive inner padding keeps content usable across mobile and
wide displays. The prompt shows about five to six lines and scrolls internally
when its content exceeds that height without displaying a scrollbar. Its focused
state remains plain without adding an inner border or ring.
While a turn is active, the send action becomes an orange-shimmering stop control.
Stopping interrupts the exact Codex turn and preserves all partial activity and
assistant text already received.
The API owns persistence. This web module has no task, automation, Git, repository,
voice, settings, archive, or desktop-runtime behavior.

The v1 implementation is retained outside the repository in the dated Zetro
reference backup. New product behavior must be added only after its contract is
reviewed and assigned to an owning module.

## Development records

- [Zetro 2.0 foundation reset](../../../../../../../assist/records/zetro/2026-09-11-zetro-2-foundation-reset.md)
- [Focused Codex chat](../../../../../../../assist/records/zetro/2026-09-11-zetro-focused-codex-chat.md)
- [Concurrent durable chat](../../../../../../../assist/records/zetro/2026-09-11-zetro-concurrent-durable-chat.md)
- [Chat alignment review](../../../../../../../assist/records/zetro/2026-09-11-zetro-chat-alignment-review.md)
