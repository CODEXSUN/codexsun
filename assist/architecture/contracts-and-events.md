# Contracts And Events

## Public contracts

A module publishes contracts from its `contracts/` folder. A contract includes a versioned TypeScript type and matching Zod schema.

HTTP contracts use a versioned API prefix. Each response uses a documented success or error envelope.

Applications, clients, and add-ons consume public contracts. They must not import module services, repositories, or domain internals.

## HTTP rules

- Fastify routes validate input before a controller calls an application service.
- Controllers map contracts to application requests and responses.
- Services return domain results without Fastify-specific values.
- Error codes, error shape, pagination, and idempotency behavior belong in the public contract.
- Document a breaking contract change before implementation.

## Domain events

A module publishes a versioned event after its transaction succeeds. An event includes an event identifier, event type, schema version, module owner, occurred time, correlation identifier, and payload.

Consumers validate events with the published schema. Consumers must be idempotent and record processed event identifiers.

## Delivery rule

Use a transactional outbox before an event leaves the module database. A worker publishes outbox records and retries safely.

Use synchronous public contracts for work that needs an immediate answer. Use events for independent follow-up work.

## Decision gate

Before the first API, approve the API prefix, error envelope, pagination format, authentication header, event transport, and outbox storage design.
