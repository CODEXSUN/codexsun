# Identity permission HTTP verification

## Outcome and ownership

This follow-up source patch builds on committed version 0.1.23.
Platform HTTP now maps the public `PlatformAuthorizationError` to HTTP 403 with code `FORBIDDEN`.
The previous handler returned 500 for an ordinary permission denial. A regression test reproduced that response before the fix.
The HTTP adapter owns this mapping. Framework and Platform Core remain transport-neutral.
No database migration, public permission policy, or reusable UI changed.

## Tests and binding

The Identity HTTP test composes the production request context, session resolver, authorizer, and HTTP error handler.
A test-only product endpoint uses the public `requirePlatformAuthorization` helper.
Cookie and bearer tests cover missing permission, wrong action, exact permission, wildcard permission, and revoked sessions.
Permission-store and session-store outages cannot execute the protected handler or expose private failure details.
All three portal tests now verify that only super administrators can read security events.

Eleven Identity tests, Platform API typecheck, and lint passed after the first permission mapping repair.
The final expanded suite and `check:release:platform` passed, including runtime,
web composition, eleven Identity tests, and nine server composition/lifecycle tests.
The negative readiness tests emitted expected 503 warnings. Builds had no warnings.
Final API typecheck, lint, documentation, module boundaries/dependencies, line limits,
and `git diff --check` passed.

Installed Zetro review `f5661a4e-5be3-462c-a941-73b68baffe64` confirmed the 500 defect.
Its proposal added an HTTP status to the shared error. This patch instead maps the
error in Platform HTTP, so the shared policy contract stays transport-neutral.
The review made no edits and did not certify the patch or release.

## Remaining acceptance

This test endpoint is not evidence that every product API has adopted Identity.
The public cross-application client contract, browser portal flows, and A001/R001 gates remain open.
This source patch does not change installed Zetro 0.1.23, which packages Zetro rather than the Platform API.

References: [Identity owner](../../../apps/platform/api/src/modules/identity/README.md),
[P001 task](../../tasks/platform-first-release.md), and [desktop upgrade](../zetro/2026-09-10-desktop-0.1.23.md).
