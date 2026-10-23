# Marketing: Capture forms

Marketing owns definitions, notice versions, verified origins, and encrypted public bindings. Sites owns public rendering. Changed form revisions invalidate older bindings.

## Ownership and access

Platform resolves trusted tenant context and live grants. Each client uses its own database.
Public UUIDs do not grant access. Company and record scope still apply.
No documentation or frontend control grants permission.

## Source contracts

- `apps/marketing/api/src/modules/capture/index.ts`
- `apps/marketing/web/src/modules/capture/index.ts`
- Owned primary table: `marketing_capture_forms`.

## Routes

- `/marketing/captures`
- `/marketing/captures/:uuid`
- `/marketing/captures/:uuid/activity`
- `/marketing/captures/:uuid/publish-binding`
- `/marketing/captures/count`
- `/public/marketing/captures`

## Verification and limits

This is local implementation evidence. Provider access, full authenticated desk acceptance, existing customer migrations, and deployment remain separate gates.
See the owner README and agent TASK for exact checks and unfinished acceptance.
