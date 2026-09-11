# Conversation-owned provider selections

Date: 2026-09-11

## Outcome

Each Zetro conversation now stores its own provider connection, selected model, configured
reasoning level, verification receipt, and latency. A changed selection becomes verified only
after the provider returns the required smoke response.

## Boundaries

- `zetro.chat.api` owns the selection on `chat_conversations` and the connection-keyed
  provider thread registry.
- `zetro.providers.api` validates a requested connection and performs the smoke check.
- `zetro.providers.web` composes the existing package-owned compact switcher and saves the
  active conversation through the Chat API contract.
- Global provider settings remain the default for a new conversation; they do not reroute an
  existing conversation.

## Concurrency rule

Connection confirmation for a conversation does not restart the shared local Codex runtime.
This keeps unrelated active conversations running. Runtime threads are keyed by both
conversation and connection, so switching from Local Codex to CXZ and back resumes the right
isolated thread without crossing contexts.

## Verification

- Zetro API tests cover persistence across restart, independent threads for two connections,
  and the provider selection route.
- Zetro API and web TypeScript checks pass.
- The shared UI ownership audit passes; the header continues to reuse
  `@codexsun/ui/components/compact-model-switcher`.
- Live browser verification showed the persisted CXZ Codex, GPT-5.6-Terra, low selection with
  its green connection-verified control after a successful 7.4-second CXZ smoke response.
