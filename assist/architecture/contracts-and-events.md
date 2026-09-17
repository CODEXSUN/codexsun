# Contracts And Events

## Public contracts

A module publishes contracts from its `contracts/` folder. A contract includes a versioned TypeScript type and matching Zod schema.

HTTP contracts use a versioned API prefix. Each response uses a documented success or error envelope.

Applications, clients, and add-ons consume public contracts. They must not import module services, repositories, or domain internals.

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

## Delivery rule

Use a transactional outbox before an event leaves the module database. Until a deployment selects Redis, a database-backed worker claims and retries module-owned outbox records safely. The worker has a named owner, retry limit, retry delay, failure code, and failed-record recovery path.

Each consumer records its consumer ID and message ID before it accepts a repeat delivery. A consumer must make its own side effect safe before it records completion. Redis is reserved for a future delivery provider and never becomes the source of business truth.

Use synchronous public contracts for work that needs an immediate answer. Use events for independent follow-up work.

## Decision gate

Before a new API module is protected, approve its API prefix, error envelope,
pagination format, authorization requirements, event transport, and outbox
storage design.
