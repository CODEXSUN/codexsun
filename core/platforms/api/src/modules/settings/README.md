# Platform Settings Module

Provider: `platform.settings`

This module owns the non-secret deployment settings read by platform operators.
It does not expose environment variables, credentials, tokens, database URLs, or other secret configuration.

## Public Contract

`GET /api/v1/platform/settings` requires a signed actor with `platform.settings.read`.
The Platform composition root supplies the Identity authentication function. This module does not import Identity private files.

## Data

`settings.001` creates `platform_settings`. `settings.seed.001` adds the default `platform.name` record.
The runtime uses an in-memory repository until the migration runner selects the module-owned Kysely repository.

## Events And Tests

Read operations do not publish domain events. Future changes must publish a post-commit module event.
Focused tests cover the migration, repeat-safe seed, repository read, authentication boundary, and permission check.
