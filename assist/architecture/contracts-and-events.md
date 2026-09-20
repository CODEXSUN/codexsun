# Contracts And Events

## Public contracts

A module publishes contracts from its `contracts/` folder. A contract includes a versioned TypeScript type and matching Zod schema.

HTTP contracts use a versioned API prefix. Each response uses a documented success or error envelope.

Applications, clients, and add-ons consume public contracts. They must not import module services, repositories, or domain internals.

## Provider dependencies

The Framework provider container owns shared dependencies. A normal value or
factory is an application singleton. A scoped factory requires a request scope
and resolves once in that scope.

Factories resolve lazily. The container rejects duplicate keys, missing keys,
and factory dependency cycles. A scoped dependency must never resolve from the
application root.

Platform identity contracts define actor and authorization shapes without a
login endpoint, credential, or tenant model. Platform Identity verifies signed
JWT bearer tokens privately, then resolves the token subject to an actor before
an authorization decision. Token permission claims are not an authority source.

Browser hosts import identity contracts from the browser-safe
`@codexsun/platform-core/identity` entry. They must not import the Platform
Core root entry because it also exports Node-only data adapters.

## HTTP rules

- Fastify routes validate input before a controller calls an application service.
- Controllers map contracts to application requests and responses.
- Services return domain results without Fastify-specific values.
- Error codes, error shape, pagination, and idempotency behavior belong in the public contract.
- Document a breaking contract change before implementation.

## Domain events

Every Framework module provider must declare `events.published` and `events.consumed`. Use empty arrays when the module has no asynchronous domain behavior.

A module publishes a versioned event after its transaction succeeds. An event includes an event identifier, event type, schema version, module owner, occurred time, correlation identifier, and payload.

Consumers validate events with the published schema. Consumers must be idempotent and record processed event identifiers.

The Framework event bus dispatches only to providers that declare the consumed
event. A publisher must declare the event before it publishes it. Publishers
can pass the request correlation identifier to the event bus.

## Delivery rule

Use a transactional outbox before an event leaves the module database. Until a deployment selects Redis, a database-backed worker claims and retries module-owned outbox records safely. The worker has a named owner, retry limit, retry delay, failure code, and failed-record recovery path.

Each consumer records its consumer ID and message ID before it accepts a repeat delivery. A consumer must make its own side effect safe before it records completion. Redis is reserved for a future delivery provider and never becomes the source of business truth.

The database outbox dispatcher reads persisted events and sends them through
the Framework event bus. It skips a consumer that already completed the same
message. It records completion only after that consumer handler succeeds.

## Durable jobs

The Platform uses the application database for durable jobs. A job has an
owner, a versioned name, a JSON payload, an optional correlation identifier,
and an available time.

The job worker claims one scheduled job at a time. It completes the job after
the handler succeeds. It schedules a retry after a handler failure. It marks
the job failed after its retry limit.

Only a scheduled job can be canceled. A worker releases an expired processing
lock after a crash. Redis and BullMQ are not required for this job provider.

## Notifications

Platform notifications belong to a recipient actor and can have an
application scope. Each record has a title, optional description, severity,
creation time, and read time.

An event-driven notification handler must pass the source event identifier.
The database unique key makes repeated delivery return the existing record.
Recipients can list unread records, list read records, mark one record read,
or mark all records read for an application.

Routes must derive the recipient from the verified session actor. A client
cannot choose another recipient identifier.

Use synchronous public contracts for work that needs an immediate answer. Use events for independent follow-up work.

## Decision gate

Before a new API module is protected, approve its API prefix, error envelope,
pagination format, authorization requirements, event transport, and outbox
storage design.
