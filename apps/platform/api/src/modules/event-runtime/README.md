# Event Runtime API Module

## Purpose

The Event Runtime owns durable event storage and at-least-once consumer delivery state.

## Identity and version

- Module ID: `event-runtime`
- Kind: `core`
- Version: `1.0.0`
- Scope: `platform`
- Status: active

## Ownership

The module owns `platform_event_outbox` and `platform_event_inbox`.
The outbox stores immutable published facts. The inbox stores one delivery state per consumer and event.

Business modules write their business record and outbox event in the same MariaDB transaction.
Consumers must make their own domain mutation idempotent. The inbox prevents a completed event from running twice for one consumer.

## Public contract

The `event-runtime.durable-events` 1.0.0 contract supplies a MariaDB durable event store. It uses the public `PlatformDurableEventDispatcher` contract from `@codexsun/platform-core-api`.

The dispatcher supports restart recovery, bounded retries, and terminal delivery failures. It does not provide a broker, queue, cache, distributed lock, or automatic business handler registration.

## Lifecycle and persistence

Migration `0001-event-runtime-schema` creates the outbox and inbox tables.
The module depends on `module-runtime` 1.1.0 or later. Module Runtime applies the migration and checks the immutable schema checksum before activation.

## Development records

- [2026-09-11 Durable event runtime](../../../../../../assist/records/platform/2026-09-11-durable-event-runtime.md)
