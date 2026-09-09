# Identity Cross-Client Security

Date: 2026-09-09

Repository version: `0.1.13`

Identity module version: `1.1.0`

## Outcome

Identity now supports one account across web, desktop, and mobile clients. It also owns device activation, safe activity records, and administrator user access controls.

The password minimum remains eight characters. Login accepts a username, email address, or mobile number.

## Ownership

- [Identity API](../../../apps/platform/api/src/modules/identity/README.md) owns all behavior and persistence.
- `user` owns users and normalized login identifiers.
- `role` owns product roles, permissions, and assignments.
- `device` owns activation state and device tokens.
- `session` owns portal-scoped cookie and bearer sessions.
- `security` owns safe activity records and risk labels.
- `verification` owns optional email and OTP provider ports.
- [Identity web](../../../apps/platform/web/src/modules/identity/README.md) owns client device storage and management screens.

## Database changes

Migration `0002-identity-devices-and-security` adds user identifiers, devices, session device binding, and security events. Seed `0002-default-super-admin-identifier` adds the seeded account email identifier.

Migration `0003-identity-access-indexes` adds session, device, identifier, and security monitoring indexes.

Both declarations are module-owned and ordered. Existing declarations remain unchanged.

## Binding properties

- A web client uses a path-scoped HTTP-only cookie.
- A desktop or mobile client receives a bearer access token.
- Every client keeps a server-issued device token outside the session token.
- The first verified device becomes active.
- A later device stays pending until an active device or super administrator approves it.
- A session resolves only while its user and device remain active.
- A session renewal updates the MariaDB expiry and browser cookie expiry.
- Product modules declare permission names. Identity owns role assignment.
- Email and OTP ports exist, but the disabled provider sends nothing.

## Access rules

Administrators can list and manage regular users. They can change status, create reset requests, create product roles, and assign permissions.

Administrators cannot read credentials or manage privileged portal users. Only super administrators can list all users and read security events.

## Security decisions

Unknown users run a sentinel Argon2 verification. This reduces identifier timing differences. Login routes keep bounded request limits.

Cookie-authenticated state changes require the configured web origin. Development login accepts loopback requests only.

The security stream records metadata, outcomes, and risk. It does not record request bodies, passwords, tokens, or reset secrets.

No implementation can guarantee that a breach will never occur. The security contract requires prevention, detection, updates, tests, and incident response.

## Parallel work

Concurrent Zetro, Orship, and UI design-system changes were present. This work did not modify their private application code.

The shared UI auth form changed only its sign-in label and eight-character minimum. Existing unrelated design-system files remain unchanged.

## Verification

- Platform API type-check passed.
- Platform web type-check passed.
- Identity service tests passed for portal isolation, expiry, identifiers, and device activation.
- Platform API production build passed.
- Platform web production build passed with every chunk below 400 KB.
- Platform web composition tests passed.
- Platform production lifecycle and API composition tests passed.
- The isolated MariaDB foundation suite passed.
- Live MariaDB applied migration `0002` and seed `0002`.
- Live MariaDB applied migration `0003` access indexes.
- Live schema checksum and readiness passed after the expected column order was corrected.
- Live development login created an active web device without returning a web bearer token.
- Live super-administrator user and security-event queries passed.
- Application docs, module docs, boundaries, versions, file limits, focused lint, and `git diff --check` passed.
- The root format gate remains blocked by concurrent Orship and Zetro files.
- The module dependency gate remains blocked by a concurrent Zetro task contract range.
- Browser checks did not run for the administrator and super-administrator desks.
