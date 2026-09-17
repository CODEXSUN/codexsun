# Zetro Chat Module

Zetro Chat owns persisted idea conversations, chat messages, and the chat HTTP
routes. It exposes the `zetro.chat` provider contract to the Zetro API.

The module does not own task execution, worktree dispatch, or product business
logic. Those capabilities remain separate Zetro modules and public contracts.
