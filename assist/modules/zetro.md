# Zetro 2.0 Module Catalog

Zetro is a focused browser chat with a local API that connects to the installed
Codex CLI and stores history in SQLite. The v1 modules remain retired in the backup.

| Module                  | Version | Runtime        | Composition | Documentation                                                             |
| ----------------------- | ------- | -------------- | ----------- | ------------------------------------------------------------------------- |
| `zetro.providers.api`   | 1.2.0   | Zetro API      | Active      | [Provider API](../../apps/zetro/api/src/modules/providers/README.md)      |
| `zetro.chat.api`        | 2.4.0   | Zetro API      | Active      | [Chat API](../../apps/zetro/api/src/modules/chat/README.md)               |
| `zetro.agent-tasks.api` | 1.0.0   | Zetro API      | Active      | [Agent Tasks API](../../apps/zetro/api/src/modules/agent-tasks/README.md) |
| `zetro.providers.web`   | 1.4.0   | Zetro web      | Active      | [Provider settings](../../apps/zetro/web/src/modules/providers/README.md) |
| `zetro.shell.web`       | 2.7.0   | Zetro web      | Active      | [Shell](../../apps/zetro/web/src/modules/shell/README.md)                 |
| `zetro.agent-tasks.web` | 1.1.0   | Zetro web      | Active      | [Agent Tasks web](../../apps/zetro/web/src/modules/agent-tasks/README.md) |
| `zetro.cxz`             | 1.0.0   | Node container | Active      | [CXZ](../../apps/zetro/cxz/README.md)                                     |

The active provider registry contains only Local Codex and CXZ Codex. Agent Tasks currently
owns durable drafts only. There is no approval, task execution, desktop, queue, automation,
repository, worktree, or Git delivery module.
