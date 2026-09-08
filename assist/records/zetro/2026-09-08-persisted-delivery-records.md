# Zetro Persisted Delivery Records

## Outcome

Each Deliver response now contains a validated record for all nine stages. Zetro saves the record with the assistant message and restores it with conversation history.

The next Deliver turn receives the latest validated record. Codex can continue from prior evidence and recheck stale facts.

## Authoritative references

- Owner READMEs: Zetro chat web, chat API, and Codex connection API
- Application catalog: `assist/modules/zetro.md`
- Prior decision: `assist/records/zetro/2026-09-08-governed-delivery-pipeline.md`
- Architecture contract: `assist/architecture/application-standard.md`

## Ownership and boundaries

The Codex connection module owns the output schema, validation, timestamps, and readiness calculation. The chat API owns persistence inside assistant execution metadata.

The chat web module owns the delivery progress panel. The Platform and framework packages remain unchanged.

## Binding properties

| Producer         | Consumer       | Binding                     | Version |
| ---------------- | -------------- | --------------------------- | ------- |
| Codex App Server | Zetro API      | structured delivery output  | `0.5.0` |
| Zetro API        | Conversation   | execution delivery record   | `0.5.0` |
| Conversation API | Zetro chat web | delivery progress and state | `0.5.0` |
| Zetro chat web   | Zetro chat API | latest delivery record      | `0.5.0` |

## Parallel work

The repository contains unrelated modified and untracked files. This change keeps delivery records inside Zetro-owned files.

## Decisions

- Decision: Store the delivery record with each assistant message.
- Reason: Conversation history already owns task context and atomic persistence.
- Rejected alternative: Add a generic workflow database to Platform Core.
- Decision: Reject invalid or reordered stages.
- Reason: The interface must not show invented progress.

## Verification

- Command: `npm.cmd run test:zetro`
- Command: Zetro API and web type checks and builds
- Command: Full repository check and Git diff check
- Not run: A live Deliver turn that changes or publishes repository files

## Follow-up work

Add a stage-resume API only when a delivery must continue outside its conversation.
