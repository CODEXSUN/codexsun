# Q Cafe Platform Contracts

Q Cafe owns restaurant behavior and records. Platform services own shared infrastructure. Q Cafe may use only the public contracts below and must remain operable when an optional adapter is unavailable.

| Capability | Owner | Public contract used by Q Cafe | Failure behavior |
| --- | --- | --- | --- |
| Identity and authorization | Platform Identity | `Actor`, authenticated sessions, permission checks, identity management HTTP routes | Reject unauthenticated or unauthorized requests. Never create a Q Cafe-local password store. |
| Business and location scope | `qcafe.foundation` | Business, location, business-day, and service-channel identifiers | Reject commands whose referenced scope does not exist. Never infer a different outlet. |
| Database storage | Platform Core | Kysely data providers, `DB_DRIVER`, lifecycle plans, SHA-256 migration verification | Development applies explicit plans. Production verifies and fails before serving when history differs. |
| Activity audit | `qcafe.foundation` | `ActivityRecorder` and `CommandContext` | State-changing commands require actor and correlation IDs. A command is not reported as successful when its audit write fails. |
| Device trust | Platform Identity and future device provider | Authenticated actor plus approved device profile contract | Keep privileged device actions disabled until the device contract is available and trusted. |
| Local-to-cloud sync | Future Platform Sync provider | Change envelope, cursor, idempotency, and conflict contracts | Local work remains durable. Do not claim synchronization or silently overwrite financial conflicts. |
| Object storage | Future Platform Storage provider | Object reference, checksum, media type, and lifecycle contract | Menu records remain usable without media. Do not store image binaries in Q Cafe relational tables. |
| Document delivery | Future Platform Delivery provider | Durable document reference, consent, destination, attempt, and provider result | Queue or fail visibly. Never mark email, WhatsApp, or print delivery complete without acknowledgement. |

## Command Boundary

Every Q Cafe state-changing service receives a trusted `CommandContext` from the authenticated HTTP boundary. The activity event stores the event type, actor, subject type and ID, correlation ID, outcome, time, and optional structured reference payload. Client-supplied actor IDs are never accepted.

## Data Boundary

Each module owns its schema and lifecycle plan. The composition root runs plans serially through the shared recorder. Modules communicate through public contracts; they do not import another module's private repository or mutate another module's tables.
