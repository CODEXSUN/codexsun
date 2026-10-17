# Sites: Site / Deployment

Tracks queued delivery of published site snapshots through the host adapter. Publication remains separate from remote delivery.

## Ownership and access

Sites owns deployment records, revision uniqueness, retries, and delivery state. Platform supplies the authorized queue and delivery adapter.
The backend checks the tenant, site, and current permission before reading state or retrying a failed deployment.
Documentation and client requests never grant access. Only configured clients support direct delivery.

## Source contracts

- `apps/sites/api/src/modules/site/deployment/`: migration, repository, schema, service, routes, module, and delivery contracts.
- `apps/sites/web/src/modules/site/deployment/`: status list, hooks, gateway types, and workspace.
- `apps/platform/api/src/sites-delivery-host.ts`: host composition and queued delivery.

## Declared routes and storage

- `GET /sites/:uuid/deployment` reads the site delivery state.
- `POST /sites/:uuid/deployment/:deploymentUuid/retry` retries a failed delivery.
- `sites_deployments` stores the snapshot, checksum, sequence, actor, attempts, status, and delivery timestamps.
- A unique site/revision key prevents duplicate snapshot rows. The site foreign key blocks deletion while dependent records exist.

## Delivery and verification

Publishing creates a persisted snapshot before queue submission. Queue submission failures remain visible and can be retried.
Only failed deployments support retry. Revision and delivery checks prevent stale snapshots from replacing newer content.
Run Sites and Platform typechecks, module boundaries, and deployment tests. A saved publication or healthy API does not prove live delivery.
