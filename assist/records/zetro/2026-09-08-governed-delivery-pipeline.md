# Zetro Governed Delivery Pipeline

## Outcome

Zetro now has a delivery workflow for complete repository changes. It guides Codex through planning, evidence collection, implementation, verification, documentation, versioning, and Git publication.

## Authoritative references

- Owner READMEs: Zetro chat web, chat API, and Codex connection API
- Application catalog: `assist/modules/zetro.md`
- Version workflow: `assist/operations/versioning.md`
- Architecture contract: `assist/architecture/application-standard.md`

## Ownership and boundaries

The chat web module owns the workflow selector and visible pipeline. The chat API owns the delivery tool catalog.

The Codex connection module owns the ordered instructions and publication gate. Root tools remain the only owner of repository-wide versions and interactive Git publication.

## Binding properties

| Producer         | Consumer         | Binding                     | Version |
| ---------------- | ---------------- | --------------------------- | ------- |
| Zetro chat web   | Zetro chat API   | `workflow: deliver`         | `0.4.0` |
| Zetro chat API   | Codex connection | delivery tool catalog       | `0.4.0` |
| Codex connection | Repository tools | version and publish command | `0.4.0` |
| Codex connection | User             | explicit publication gate   | `0.4.0` |

## Parallel work

The main checkout contains unrelated modified and untracked files. The delivery pipeline requires isolated worktrees and an intended-file review before publication.

## Decisions

- Decision: Add one complete delivery workflow beside four focused workflows.
- Reason: Narrow work stays efficient while release work gets complete governance.
- Rejected alternative: Make every chat turn run versioning, commit, and push.
- Decision: Require an explicit request for both commit and push.
- Reason: A selected workflow alone does not authorize repository publication.

## Verification

- Command: `npm.cmd run test:zetro`
- Command: Zetro API and web type checks and builds
- Command: Full repository check and Git diff check
- Not run: Commit, push, tag, package publication, or deployment

## Follow-up work

Add persistent per-stage run records when Zetro needs resumable delivery across devices.
