# Framework

`@codexsun/framework` owns provider manifests, lifecycle orchestration, shared
result contracts, and test helpers. It contains no app-specific business logic.

Providers declare an owner, version, dependencies, and exported contracts.
The engine registers providers, starts them in dependency order, and stops them
in reverse lifecycle order. Apps compose their providers; modules retain their
own routes, services, repositories, migrations, seeders, and tests.

Providers can register values or lazy singleton factories. A request can create
an isolated dependency scope that reads shared values and owns request values.

Providers use `context.on()` for declared consumed events. They use
`context.emit()` for declared published events. The event bus delivers events
in the current process only. Use the Platform database outbox for durable or
cross-process delivery.
