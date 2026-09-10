# Platform Identity Client

## Ownership and contract

Platform owns `@codexsun/platform-identity-client`, public protocol version 1.0.0.
This workspace contains HTTP contracts and a client, not Identity policies or persistence.
The first consumer is Platform web session loading. Other applications import this public package, never Platform API source.

`PlatformIdentityClient.session(portal, credential, signal)` reads an existing portal session.
`PlatformIdentityClient.authorize(portal, requirement, credential, signal)` checks one product permission against the current session.
Credentials are explicit: `{ kind: 'cookie' }` for a browser, or `{ kind: 'bearer', token }` for an API/native caller.
The client never stores tokens, retries requests, follows redirects, or caches permission decisions.
Configure a trusted fixed origin. HTTPS is required except for explicit loopback development hosts.
Responses are bounded to 64 KiB, validated with Zod, and rejected on portal mismatch.
Timeouts, cancellations, malformed responses, and dependency failures throw safe errors. They never grant access.

## Consumer rules

Use the same-origin deployment proxy for browser sessions. This client does not exchange cookies across applications or origins.
Native clients and API adapters must supply a user bearer credential, not a supervisor token or caller-selected user ID.
Enforce `allowed` on the server immediately before protected work. UI visibility is not authorization.
Do not trust permissions cached in a browser. Do not return credentials in logs or persist them through this package.
The `/api/identity[/admin|/sa]/authorize` endpoint returns the authenticated user ID, portal, and decision only.
Identity remains responsible for users, roles, device activation, revocation, and policy.

## Build and verification

Run the workspace `build`, `typecheck`, `lint`, and `test` scripts from the root.
Output is `dist/apps/platform/contracts`. Preflight builds this dependency before Platform web.
No server, database, migrations, or seed runs in this workspace.

## Development records

- [Identity public client](../../../assist/records/platform/2026-09-10-identity-public-client.md)
