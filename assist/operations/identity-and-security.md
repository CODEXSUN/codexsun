# Identity And Security

## Ownership

The platform identity module owns authentication, session issuance, authorization contracts, device access, revocation, and security audit events.

Other modules request identity decisions through public contracts. They must not query identity tables or issue credentials directly.

## Public identity contracts

Platform Core publishes `Actor`, `Role`, `Permission`, `IdentitySession`, and
`AuthorizationRequirement` contracts. An actor has explicit assigned
permissions. Roles are labels until the Identity module resolves them to
permissions.

`authorize()` allows an action only when the actor has every required
permission. The contracts contain no password, token, credential, tenant, or
transport field. The Identity module will own those private details.

## Required security rules

- Validate all external input with Zod.
- Keep secrets in root `.env` or an owner `.app.env` only.
- Keep browser-visible configuration free of credentials and private endpoints.
- Use least-privilege permissions for database, storage, queue, and deployment access.
- Log security-relevant actions with actor, action, target, outcome, and correlation identifier.
- Do not log passwords, tokens, session identifiers, private storage paths, or sensitive payloads.

## Current API authentication boundary

Platform API Identity routes use a signed HS256 JWT bearer token. The required
root environment values are `PLATFORM_JWT_SECRET`, `PLATFORM_JWT_ISSUER`, and
`PLATFORM_JWT_AUDIENCE`. The token `sub` identifies an actor; the Identity
repository resolves the actor and its permissions. Token permission claims are
not an authority source.

Identity actor reads are isolated by default. An actor can read only its own
record unless its resolved permissions include `identity.read`.

The Platform web Identity module keeps an accepted bearer token in React memory
only. It uses the verified current-actor API route to load the public actor
contract. It does not use browser storage, cookies, or browser-visible token
configuration. A page reload ends this web session.

Token issuance, password policy, recovery, persistent browser sessions,
revocation, device policy, tenant selection, and audit retention remain future
decisions.

## Current Aaran deployment policy

The Aaran deployment uses one configured deployment. It has no tenant records,
tenant schema, or JWT tenant claim. A signed actor is isolated by actor ID and
permissions only.

The root environment names the bootstrap administrator email. The system does
not store or seed its password yet. A credential-issuance task must read the
password from the ignored environment, hash it, and never log it.

## Decision gate

Before token issuance, approve credential flow, session or token lifetime,
password policy, recovery policy, revocation, and audit retention.

Before desktop or mobile access, approve device registration, local secret storage, revocation, and offline behavior.

## Required checks

1. Verify unauthenticated access fails.
2. Verify unauthorized access fails for every protected module action.
3. Verify a revoked session or device cannot access protected resources.
4. Verify logs and error responses do not disclose secrets.
