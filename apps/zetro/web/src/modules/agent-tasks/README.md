# Zetro Agent Tasks Web Module

- Module ID: `zetro.agent-tasks.web`
- Version: `1.2.0`
- Owner: Zetro web

## Purpose

This module owns the Task Queue rail destination, draft registry, and isolated draft detail
workspace. A completed chat response can create one durable draft and open it here. The task
page shows the immutable source prompt, proposed work, handoff state, and a return link to the
origin conversation. Its review canvas separates available context, benefits, required scope,
an editable repository, scope, criteria, and check plan, a durable review-confirmation gate, and linked
worker-job evidence. Worker preparation consumes only the confirmed saved plan. Worker verification and
decisions remain in the Worker Queue.

Reusable controls and layouts come from public `@codexsun/ui` exports. Task fields, API
calls, selection, loading, empty, and failure states remain application-owned.

## Development records

- [Multi-chat and task draft handoff](../../../../../../../assist/records/zetro/2026-09-11-multi-chat-task-drafts.md)
- [Provider safety and task queue](../../../../../../../assist/records/zetro/2026-09-11-provider-safety-and-task-queue.md)
- [Task review readiness](../../../../../../../assist/records/zetro/2026-09-11-task-review-readiness.md)
