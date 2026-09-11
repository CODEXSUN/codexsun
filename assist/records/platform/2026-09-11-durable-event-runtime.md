# Durable event runtime

## Outcome

Platform now owns durable event delivery through the `event-runtime` core module.
The module adds a MariaDB outbox and one inbox state record for each consumer and event.
It supports at-least-once delivery, lease recovery after restart, bounded retry, and terminal failure diagnostics.

## Authoritative references

- Owner README: [Event Runtime API](../../../apps/platform/api/src/modules/event-runtime/README.md)
- Application catalog: [Platform modules](../../modules/platform.md)
- Architecture contract: [Framework capability roadmap](../../architecture/framework-capability-roadmap.md)
- Local skill: [Framework development](../../skills/framework-development.md)

## Ownership and boundaries

`packages/platform-core/api` owns neutral event, dispatcher, and registration contracts.
`event-runtime` owns the MariaDB tables and Platform adapter.
Business modules own event payloads, publishing decisions, consumer domain work, and idempotent mutations.
The Framework kernel remains unchanged. It still owns only module declarations and in-process event validation.

## Binding properties

| Producer        | Consumer                 | Binding                                  | Version or key                       |
| --------------- | ------------------------ | ---------------------------------------- | ------------------------------------ |
| Business module | Event Runtime            | Outbox write in the producer transaction | `event-runtime.durable-events` 1.0.0 |
| Event Runtime   | Declared module consumer | Manifest-validated consumer registration | declared event ID and version        |
| Event Runtime   | System diagnostics       | Terminal delivery failure                | `EVENT_DELIVERY_FAILED`              |

## Parallel work

The workspace contained active Orship and Zetro changes. This work changed only Platform Core, Platform API, Platform documentation, and the root runtime test mapping.

## Decisions

- Decision: Keep durable delivery out of the Framework kernel.
- Reason: MariaDB storage and dispatch lifecycle are Platform concerns.
- Rejected alternative: A generic queue, Redis dependency, or automatic business handler discovery.

## Verification

- Command: `npm.cmd run test:platform-runtime`
- Result: Platform Core durable-event tests, Platform runtime tests, and builds passed.
- Command: `npm.cmd run check:module-docs`, `check:module-boundaries`, `check:module-dependencies`, `check:lines`, and `git diff --check`
- Result: Passed.
- Command: `npm.cmd run test:mariadb:foundation`
- Result: Passed against a disposable MariaDB database. It applied Event Runtime, persisted an outbox event, completed one consumer inbox record, and rejected a second delivery.
- Command: `npm.cmd run check:app-docs`
- Result: Passed. The check validates only applications registered in the deployment catalog.
- Not run: Browser verification, Docker deployment, and a real domain-module producer or consumer.

## Follow-up work

Add a first business-module producer and consumer as a vertical domain slice. Add a queue or worker only when a domain module needs independent throughput or scheduling.
