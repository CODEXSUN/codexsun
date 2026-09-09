# UI Page Templates

## Outcome

The shared UI package now owns live Login, Register, Forgot Password, and Notifications page
templates. The Platform UI workspace exposes each page from its sidebar and documents the actual
public block instead of a gallery-only scaffold.

## Authoritative references

- Shared owner: `packages/ui/README.md`
- Authentication owner: `packages/ui/src/blocks/auth/README.md`
- Notification owner: `packages/ui/src/blocks/notifications/README.md`
- UI workspace: `apps/platform/web/src/modules/ui-gallery/README.md`
- Design-system contract: `assist/architecture/ui-design-system.md`

## Bindings

| Producer           | Consumer              | Binding                                                 |
| ------------------ | --------------------- | ------------------------------------------------------- |
| Page registry      | Application selection | Validated page family and variant                       |
| Auth blocks        | Application routes    | Presentation callbacks and supported variants           |
| Notification block | Application module    | Typed records and read actions                          |
| UI catalog         | MDI sidebar           | Authentication branch and Notifications Page action     |
| UI page document   | UI Gallery            | Live specimen, default selection, copy, and code dialog |

## Decisions

- Keep page presentation in `packages/ui`; applications retain authentication and notification behavior.
- Use centered `v1` and split `v2` variants for Login and Register.
- Persist one selected default per page family.
- Keep Forgot Password and Notifications as single-default pages.
- Load the complete UI Gallery behind its route boundary to preserve the 400 KB chunk budget.

## Parallel work

The worktree contains concurrent Identity, Zetro, Docs, Orship, and deployment changes. This
change preserves those files and touches only the shared UI page contract and UI workspace wiring.

## Verification

- `npm.cmd run typecheck --workspace @codexsun/ui`: Passed.
- `npm.cmd run lint --workspace @codexsun/ui`: Passed.
- `npm.cmd run check:ui-system`: Passed.
- `npm.cmd run build --workspace @codexsun/platform-web`: Passed without warnings after route splitting.
- `npm.cmd run lint --workspace @codexsun/platform-web`: Passed.
- `npm.cmd run check:app-docs`: Passed.
- `npm.cmd run check:module-docs`: Passed.
- `npm.cmd run check:module-dependencies`: Passed for 25 manifests.
- `npm.cmd run check:lines`: Passed.
- `git diff --check`: Passed.
- Browser: Verified the nested Authentication menu, direct Notifications Page action, both Login
  variants, both Register variants, Forgot Password, Notifications, persistent default selection,
  the variant code dialog, and zero horizontal overflow.
