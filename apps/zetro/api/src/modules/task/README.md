# Zetro Task Module

Zetro Task owns prepared agent-task records. It accepts only a finalized brief
through the public `ZetroFinalBriefReader` contract and preserves the brief's
project scope and project reference.

The module prepares handover data and sends an immutable package to Zuno. It
stores the first package, each delivery attempt, and the Zuno receipt. The
Zetro task ID is the idempotency key.

The module does not validate repositories, create worktrees, or execute tasks.
