# Framework

`@codexsun/framework` owns provider manifests, lifecycle orchestration, shared
result contracts, and test helpers. It contains no app-specific business logic.

Providers declare an owner, version, dependencies, and exported contracts.
The engine registers providers, starts them in dependency order, and stops them
in reverse lifecycle order. Apps compose their providers; modules retain their
own routes, services, repositories, migrations, seeders, and tests.
