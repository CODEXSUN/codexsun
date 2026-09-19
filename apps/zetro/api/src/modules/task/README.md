# Zetro Task Module

Zetro Task owns prepared agent-task records. It accepts only a finalized brief
through the public `ZetroFinalBriefReader` contract and preserves the brief's
project scope and project reference.

The module prepares handover data only. It does not create worktrees, change
repositories, or execute tasks.
