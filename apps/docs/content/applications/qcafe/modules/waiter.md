# Q Cafe: Waiter

The waiter module owns restaurant staff metadata used to confirm kitchen-token delivery.

## Routes and access

- `GET /qcafe/waiters` lists registered waiters.
- `POST /qcafe/waiters` creates a waiter.
- `PUT /qcafe/waiters/:uuid` updates a waiter.

Records contain a code, name, and active or inactive status.
Waiter management requires `qcafe.waiter.manage`. Registration does not create a Platform login or grant a role.
Staff are inactivated rather than deleted so delivery history retains its references.
Kitchen delivery requires an active registered waiter and the authoritative order permission checks.

## Persistence and verification

Read `apps/qcafe/api/src/modules/waiter` for the service, repository, route contracts, and migration.
Apply `qcafe.waiter.001` and the related order migrations through the tenant migration process.
Run Q Cafe type checks, lint, boundaries, and its configured database integration tests.
Verify denied access, inactive staff rejection, and tenant isolation.
Database tests do not certify physical printer or scanner operation.
