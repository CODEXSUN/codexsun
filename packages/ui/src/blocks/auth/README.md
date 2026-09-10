# Authentication Blocks

This folder owns reusable, presentation-only authentication blocks. It provides separate client, administrator, and super-administrator entry pages, separate recovery entry components, registration, and isolated portal placeholders.

The blocks do not call APIs, store sessions, select roles, or contain business policy. An application supplies callbacks and owns routes, state, validation responses, and access decisions. Internal shell and form components may share visual mechanics without merging portal behavior.

The sign-in form accepts one username, email address, or mobile number. The registration block exposes an email address plus optional username and mobile fields. The consuming application owns normalization, uniqueness, verification, and persistence.

Passwords use an eight-character presentation minimum. The consuming Identity API remains the validation authority.

Set `registerHref={null}` to hide registration explicitly. An omitted value keeps the generic default.
Privileged entry blocks always hide registration. The client block follows `registrationEnabled`.
The identifier uses a text input so browser email validation does not reject usernames or mobile numbers.
Development sign-in is disabled while a submission is pending.

## Development records

- [Browser acceptance repairs](../../../../../assist/records/platform/2026-09-10-identity-browser-acceptance.md)

`LoginPage` provides two owned variants. Version 1 is a centered CODEXSUN entry card. Version 2
uses a split card with provider actions and a supporting visual surface. `RegisterPage` provides
matching centered and split variants. The UI Gallery can persist one default per page family;
applications select a supported variant through the design-system page registry.
