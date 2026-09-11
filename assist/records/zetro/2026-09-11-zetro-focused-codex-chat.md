# Zetro Focused Codex Chat

Date: 2026-09-11

## Decision

Zetro exposes one workflow only: the user enters a prompt and sees the final
Codex response as plain text. Task, automation, archive, settings, attachment,
voice, repository, Git, provider, and model controls are outside this phase.

## Ownership

- `apps/zetro/web/src/app.tsx` owns the browser chat state and composition.
- `apps/zetro/web/codex-chat-plugin.ts` owns the development-only local bridge.
- `packages/ui` continues to own the reusable button and textarea controls.

## Runtime contract

`POST /api/chat` accepts `{ "prompt": string }`. The Vite development and preview
servers keep one locally authenticated Codex app-server process warm. Every
request starts a new ephemeral, read-only thread outside the repository. The
route streams newline-delimited JSON events and closes after the turn completes.
The event contract includes the exact request text, raw non-assistant Codex items,
assistant text deltas, errors, and completion.

Zetro does not trim, prefix, or append to the user's prompt. The `turn/start`
input contains one text item with the exact submitted value. It has no file,
image, attachment, or application-added developer instruction.

The request is bounded to 64 KB and each Codex process has a five-minute timeout.
CLI warnings are not returned to the browser; structured tool activity is streamed
as raw Codex items.
On Windows, the bridge checks `ZETRO_CODEX_PATH`, the process `PATH`, and the
Codex desktop installation directory in that order.
The development route accepts JSON from the same browser origin only.

## Response-time profile

Chat runs in an empty operating-system temporary directory. It uses
`gpt-5.3-codex-spark` with low reasoning. This avoids loading the CODEXSUN
repository and its agent guidance for a plain chat turn. One persistent
app-server removes repeated process initialization, and the browser renders
assistant deltas as they arrive.

The browser groups each raw stream by turn. A left-aligned separator shows
`Working for Ns` with an orange shimmer while active, then freezes as
`Worked for Ns` or `Stopped for Ns`. Consecutive runtime items are summarized by
process and retain their chronological position beside response segments. The
current process heading shimmers while active. Chevron controls reveal the complete
formatted raw JSON on demand, while assistant content remains unformatted text.
The shared message scroller shows a floating return-to-present control only when
the reader leaves the latest content. A per-turn copy action copies assistant
response segments only and excludes all raw request and activity events. It stays
hidden until its response is hovered or receives keyboard focus.
The conversation scroll viewport spans the available screen width, with responsive
padding applied to its content and composer instead of the scrollbar container.
The prompt surface displays about five to six lines and then scrolls internally
with its visual scrollbar hidden.

The earlier repository-scoped, one-process-per-message path took about 14 seconds
for the reference exact-response prompt. The persistent implementation produced
first text in about 7.2 seconds on cold start and 5.5 seconds on the next warm
request in the same local environment. Network and provider load can still vary.

## Verification

- Zetro workspace type check
- Zetro workspace lint
- Zetro production build
- Shared UI boundary audit
- Live `POST /api/chat` prompt and raw-response check
