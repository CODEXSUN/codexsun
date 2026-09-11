# Provider safety and Task Queue

Date: 2026-09-11

## Outcome

Zetro now blocks prompts from an unverified conversation provider. A provider change reserves
the conversation while its smoke test runs. This prevents a response from starting with a stale
connection during verification.

The browser now presents Agent Tasks as a separate Task Queue destination on the Primary
Activity Rail. The queue has its own registry and draft workspace. A selected draft shows its
immutable handoff record, source prompt, proposed work, and a route back to the originating
conversation.

## Boundaries

- `zetro.chat.api` owns the provider verification guard and switch reservation.
- `zetro.providers.web` reports connection verification to the composer so it cannot send while
  the connection is changing.
- `zetro.agent-tasks.web` owns the queue composition and origin-navigation callback.
- Approval, execution, subtasks, verification, delivery, and release are still excluded.

## Verification

- The Zetro API test suite includes the unverified-provider and verification-reservation case.
- The Zetro web and API TypeScript checks pass.
- Production web build passes with a 345.30 KB main JavaScript chunk.
- Browser verification confirms the Task Queue rail destination, draft evidence view, and
  Conversation return action in the running Zetro web application.
