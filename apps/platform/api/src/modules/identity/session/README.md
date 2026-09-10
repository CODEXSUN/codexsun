# Identity Session

This capability owns portal-scoped sessions. Web clients use HTTP-only cookies. Desktop and mobile clients can use bearer tokens.

Every session binds to an active device. Sliding renewal updates both the database record and browser cookie.

The owning presentation helper resolves both cookie and bearer requests. An explicit
Authorization header takes precedence and cannot fall back to cookies on failure.
The current user's portal must match the session portal.
See the [binding record](../../../../../../../assist/records/platform/2026-09-10-identity-session-binding.md)
and [Identity owner](../README.md) for verification and remaining release gates.
