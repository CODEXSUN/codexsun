# TConnect: Product

The Product leaf owns company products, descriptions, publishing status, persistence, and staff/member forms.

## Access and validation

Public reads require a company UUID query and filter published records.
Staff product access requires the view or manage permission.
Member access requires the self permission and limits company ownership to the authenticated member.
Writes validate company identity and record activity in the same transaction.
Platform supplies trusted tenant context and identity.

## Source and verification

Read `apps/tconnect/api/src/modules/product` and its public exports.
The matching frontend lives under `apps/tconnect/web/src/modules/product` when present.
Apply the owning managed tenant migrations before using new tables.
Run TConnect API/web type checks, lint, builds, and module boundaries.
Verify ownership denial, public filtering, and retained writes against a test tenant.
This reference does not certify live persistence or deployment.
