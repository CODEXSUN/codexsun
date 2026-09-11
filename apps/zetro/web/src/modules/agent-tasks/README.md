# Zetro Agent Tasks Web Module

- Module ID: `zetro.agent-tasks.web`
- Version: `1.1.0`
- Owner: Zetro web

## Purpose

This module owns the Task Queue rail destination, draft registry, and isolated draft detail
workspace. A completed chat response can create one durable draft and open it here. The task
page shows the immutable source prompt, proposed work, handoff state, and a return link to the
origin conversation. Drafts remain Awaiting approval and expose no execution, approval, Git, or
delivery controls.

Reusable controls and layouts come from public `@codexsun/ui` exports. Task fields, API
calls, selection, loading, empty, and failure states remain application-owned.

## Development records

- [Multi-chat and task draft handoff](../../../../../../../assist/records/zetro/2026-09-11-multi-chat-task-drafts.md)
- [Provider safety and task queue](../../../../../../../assist/records/zetro/2026-09-11-provider-safety-and-task-queue.md)
