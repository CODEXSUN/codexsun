# Identity And Security

## Ownership

The platform identity module owns authentication, session issuance, authorization contracts, device access, revocation, and security audit events.

Other modules request identity decisions through public contracts. They must not query identity tables or issue credentials directly.

## Required security rules

- Validate all external input with Zod.
- Keep secrets in root `.env` or an owner `.app.env` only.
- Keep browser-visible configuration free of credentials and private endpoints.
- Use least-privilege permissions for database, storage, queue, and deployment access.
- Log security-relevant actions with actor, action, target, outcome, and correlation identifier.
- Do not log passwords, tokens, session identifiers, private storage paths, or sensitive payloads.

## Decision gate

Before the first protected route, approve the authentication method, session or token format, authorization model, password policy, recovery policy, and audit retention.

Before desktop or mobile access, approve device registration, local secret storage, revocation, and offline behavior.

## Required checks

1. Verify unauthenticated access fails.
2. Verify unauthorized access fails for every protected module action.
3. Verify a revoked session or device cannot access protected resources.
4. Verify logs and error responses do not disclose secrets.
