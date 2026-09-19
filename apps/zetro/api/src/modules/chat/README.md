# Zetro Chat Module

Zetro Chat owns idea conversations, messages, attachment staging, and chat HTTP
routes. It exposes the `zetro.chat` provider contract to the Zetro API.

It stores conversation history in the private Zetro SQLite database. It stages
turn attachments under `storage/apps/private/zetro/chat/attachments/` through
the shared `StorageProvider`. The API removes staged files after each local
Codex request.

The module invokes the installed local Codex CLI with read-only and ephemeral
execution. It streams redacted CLI events to the active browser request. It
does not store tokens, authentication files, or device codes.

The module does not own task execution, worktree dispatch, or product business
logic. Those capabilities remain separate Zetro modules and public contracts.
