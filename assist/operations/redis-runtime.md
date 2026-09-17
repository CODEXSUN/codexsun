# Redis Runtime Scaffold

## Current Decision

CODEXSUN reserves Redis as an optional future delivery runtime. It is not a required local service and no application or worker connects to it yet.

Database-backed jobs are the active delivery path. A module records its outbox work in its own database transaction. A future worker will claim and process those records using the database until a Redis deployment is selected.

## Configuration Contract

The root `.env` owns `REDIS_URL`. Use `redis://` for a local or private runtime and `rediss://` for a TLS-protected runtime.

```text
REDIS_URL=redis://127.0.0.1:6379
```

`readRedisRuntimeConfig()` validates the URL only when a future Redis-backed provider is composed. Browser, desktop, and mobile hosts must never receive this value.

Do not place Redis credentials in an app `.app.env`. Deployment-specific secrets belong in the ignored root environment or the deployment secret store.

## Future Adoption Gate

Add a Redis service and a BullMQ provider only after a deployment profile selects it. The implementation must define provider ownership, worker lifecycle, retry limits, dead-letter handling, observability, and recovery steps.

Redis is a delivery mechanism, not the source of business truth. The module-owned database record and transactional outbox remain authoritative.
