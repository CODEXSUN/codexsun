# Platform Identity Module

Provider: `platform.identity`

This module owns identity routes, controllers, services, repositories,
migrations, seeders, and tests. It exposes verified actor reads and public
authorization contracts.

The current provider uses an in-memory repository only for the Platform host.
`KyselyIdentityRepository`, `identityMigration`, and `identitySeeder` define the
module-owned data path. The migration is not run by startup.

Identity routes accept only signed JWT bearer tokens. The token subject resolves
to an actor through this module repository. The module does not trust token
permissions. A signed actor can read itself; reading another actor requires
`identity.read` from the resolved actor permissions.

The API does not issue tokens or manage passwords, recovery, or browser
storage. The Platform web module owns its in-memory session boundary.

The initial Aaran deployment uses `SingleTenantPolicy`. It allows one configured
deployment without tenant IDs, tenant tables, or JWT tenant claims. A future
multi-tenant add-on must own tenant data and selection rules.
