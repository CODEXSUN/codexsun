# T10: Plugin lifecycle and MCP broker

Status: planned. Prerequisites: T09. Owner: plugin worker.

## Scope

Implement reviewed plugin manifests, version/integrity pinning, isolated initialization, tool registration, grants, and lifecycle.
Add the broker protocol and one controlled MCP fixture adapter.
Add plugin settings, capability inspection, enable/disable/revoke, and clear unavailable states.
External account adapters require separate operator choices and credentials.

## Allowed paths

Lease API/frontend plugin leaves and plugin/MCP-specific fixtures/tests.
Use public tool and secret-store contracts. Request changes to them through the supervisor.
T11 owns personalization. Do not share write leases.

## Acceptance

- Install, enable, and grant remain distinct audited transitions.
- Plugin code runs outside the privileged API boundary under enforced capabilities.
- Tampered packages, unknown capabilities, tool collisions, malformed schemas, and oversized results fail closed.
- Disable/revoke fences pending work and stops owned processes without falsifying partial external effects.

## Verification and handoff

Cover E12/E17/E18/E20/E21 through real broker integration and adversarial plugin fixtures.
Run owner checks and cancellation/reconnect regression tests.
Return manifest/protocol versions, integrity proof, revocation evidence, and templates/HANDOFF.md.
Do not claim a public marketplace or IDE extension compatibility from a working MCP fixture.
