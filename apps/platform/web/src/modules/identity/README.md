# Identity Web Module

## Purpose

The Identity web module composes three isolated portal desks and their account routes from shared presentation blocks.

## Identity and version

- Module ID: `identity`
- Version: `1.1.1`
- Scope: `platform`
- Status: `active`

## Routes

| Portal              | Desk     | Sign in        | Recovery                 |
| ------------------- | -------- | -------------- | ------------------------ |
| Regular             | `/`      | `/login`       | `/password/forgot`       |
| Administrator       | `/admin` | `/admin/login` | `/admin/password/forgot` |
| Super administrator | `/sa`    | `/sa/login`    | `/sa/password/forgot`    |

`/register` creates regular accounts only. `/admin/login` is the only administrator sign-in route. Login accepts a username, email address, or mobile number.

## Boundaries

The module owns routes, React Query hooks, API services, device identity, and portal compositions.
Session reads use public `@codexsun/platform-identity-client` with explicit cookie mode and validated responses.
Shared auth blocks, buttons, inputs, and table elements come from public `@codexsun/ui` exports. No
portal imports another portal page, credential state, or cookie. The API remains the authority for
portal access.

The administrator desk lists regular users and supports status, reset-request, role, and permission work. The super-administrator desk lists all users and recent security activity. Other portals cannot call those API routes.

## Verification

Run Platform web typecheck and build checks. Browser verification must cover all three sign-in routes, the three protected desks, registration visibility, and development sign-in visibility.

## Development records

- [2026-09-10 Public Identity client](../../../../../../assist/records/platform/2026-09-10-identity-public-client.md)
- [2026-09-09 Identity cross-client security](../../../../../../assist/records/platform/2026-09-09-identity-cross-client-security.md)
- [2026-09-09 Identity portals](../../../../../../assist/records/platform/2026-09-09-identity-portals.md)
