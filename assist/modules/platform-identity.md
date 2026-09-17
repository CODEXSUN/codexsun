# Platform Identity Module

Module ID: `platform.identity`

Owner: `apps/platform/api/src/modules/identity`

Provider: `IdentityModuleProvider`

Public contracts: actor read and authorization contracts from Platform Core.

The module also provides a single-tenant deployment policy. Aaran is one named
deployment, not a tenant record. The policy adds no tenant ID to data or JWTs.

Data: module-owned actor, role, actor-role, and explicit-permission tables.
The module includes `identity.001` and repeat-safe `identity.seed.001`.

Routes: `GET /api/v1/identity/actors/:actorId` with a signed JWT bearer token.

The token subject resolves to an Identity actor. Actors can read themselves.
Reading another actor requires `identity.read` from the resolved actor record.
Token permission claims are not trusted. Token issuance and browser sessions
remain later Identity work.

No event is emitted in I-402 because the module has no state-changing public
operation. See the module event record before adding one.
