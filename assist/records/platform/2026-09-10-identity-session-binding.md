# Identity session binding repair

## Outcome and ownership

Platform Identity now resolves cookie and bearer actors through one module-owned
presentation helper. Previously, activity logging accepted bearer sessions but
the actor resolver accepted cookies only. Identity routes now use the same token
parser. No business code moved into Framework or another application.

## Binding properties

An explicit Authorization header takes precedence over cookies, including when
invalid. Bearer matching is case-insensitive. Session lookup still checks portal,
expiry, active user, and active device. It also checks the user's current portal
to reject sessions retained after a portal reassignment.

The change does not implement cross-origin token exchange or all-app adoption.
No database schema, migration, seed, password policy, or public response changed.
Root candidate version remains `0.1.20`; this source patch is not part of the
already-built Zetro installer. Platform API must be rebuilt to consume it.

## References and verification

- [Identity owner](../../../apps/platform/api/src/modules/identity/README.md)
- [P001 task](../../tasks/platform-first-release.md)
- [Release gates](../../operations/stable-release-workflow.md)

Eight service/HTTP binding regressions passed, including cookie/bearer equivalence,
invalid-header fallback denial, revocation, portal changes, disabled users,
expired sessions, identifier login, and pending-device activation.
All three portal HTTP routes accept their own cookie and bearer tokens, reject
cross-portal tokens, and reject sessions after logout or user portal reassignment.
Platform API typecheck and lint passed after the final parser consolidation.
`check:release:platform` passed runtime, web composition, Identity, and server
SIGTERM/IPC lifecycle checks. The added HTTP test also passed afterward.
Module documentation, boundaries, dependencies, application documentation, line
limits, versions, workspace layout, and `git diff --check` passed.

Installed-Zetro review `d37b8492-78b2-40ac-ae9c-f954fba1436e` completed with source
findings, not release approval. Its snapshot preceded route consolidation. The
reported parser drift and missing HTTP proof were addressed afterward. The review
worktree was read-only; it did not integrate changes or run tests.
Browser, cross-app, and Docker acceptance are not verified by these unit tests.
