# Module Test Conventions

Keep tests in `<module>/test/`. Do not keep module tests in a host-level test
folder.

| Module concern | Required test                             | Test method                                       |
| -------------- | ----------------------------------------- | ------------------------------------------------- |
| Provider       | Manifest, dependencies, and registration  | Instantiate the provider or engine.               |
| Contract       | Valid and invalid public values           | Parse with the published Zod schema.              |
| Service        | Use case outcomes and authorization       | Call the service with controlled ports.           |
| Repository     | Queries, transactions, and failures       | Use isolated SQLite or a dedicated test provider. |
| Route          | Status, response, and validation failures | Use Fastify inject.                               |
| Event          | Payload schema and idempotent handling    | Publish a fact and repeat delivery.               |
| Migration      | Apply, seed, and compatibility result     | Use the owner module database provider.           |

Add only the tests for concerns that the module owns. A route must not test a
repository directly. A browser flow belongs in the owning web module and uses
Playwright when the flow is user-visible.
