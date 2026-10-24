# Redis delivery isolation — 2026-10-24

## Confirmed failure

CODEXSUN and legacy CXApp connected to Redis database 0 with BullMQ's default prefix.
Both subscribed to the same system queue while using different master databases.
Two worker clients were visible on that queue.
Data Bridge job 2517 had a completed Redis delivery with a null return value while its CODEXSUN database record remained pending.
A numeric queue job ID alone could select a missing or unrelated record in another application's master database.

## Fix

Derive a deterministic CODEXSUN Redis prefix from the configured master database host, port, and database name.
Use that prefix for every publisher, worker, and connection probe.
Keep credentials out of the namespace. Preserve the legacy service and its Redis keys.

Send the persisted job UUID with its numeric ID. Module payload fields cannot replace these delivery identifiers.
Workers reject missing or mismatched UUIDs before claiming or dispatching a database job.
A missing database job must fail delivery instead of completing Redis with null.

Reconcile up to 100 pending database records on each Redis worker tick.
Republishing uses the same delivery ID for that attempt, so startup recovery does not create a second delivery.
Completed and failed database records are not republished by this recovery path.

## Verification before deployment

- Pass namespace and malformed/reused-identity unit tests.
- Pass the actual publisher and worker integration test against VPS Redis with temporary queues.
- Confirm the legacy-prefix test worker receives no delivery.
- Confirm a hostile module payload cannot replace the persisted ID or UUID.
- Confirm duplicate publication leaves one completed delivery and one processor call.
- Local Redis was unavailable. The real Redis test ran on the VPS instead, with all three tests passed.
- Platform API compilation and lint pass.

## Deployment and live acceptance

Pending: deploy only the reviewed CODEXSUN API/web revision, preserve legacy services and infrastructure, run a fresh authenticated SUKRAA import through Redis, compare both databases before and after, and record the final report.

The next approved pair is altex_db to registered ALTEX target altexlabs_v2_db.
Keep the source read-only, rehearse with protected verified backups, import missing business data only, and hold new conflicts for review.
