# Platform Operations Module

This module owns Platform audit records, database-backed outbox schema, consumer idempotency records, and scoped storage access.

The provider exposes `operations.service`. The service validates structured audit entries and returns module-scoped storage namespaces.

`operations.001` creates the outbox, consumer, and audit tables. A deployment must run this module-owned migration before it starts a database-backed worker.

Redis and BullMQ are not part of this module today. Database-backed delivery is the selected path.
