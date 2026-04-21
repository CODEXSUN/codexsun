# Planning

## Pending

- `#206` Let super admins manage user password reset from the user access workspace
  - Goal:
    - let a signed-in super admin set a new password for an existing user from the admin user-access tab
    - let the same super admin send the existing email reset-link flow to that user without leaving the user workspace
  - Why this slice now:
    - the current user edit screen says password changes happen through the email reset-link flow, but there is no admin action to trigger that flow for the selected user
    - the shared admin-user payload already accepts an optional `password`, but the UI does not expose it and the backend does not restrict it to super admins
  - Current repository reality:
    - user-management business logic belongs in `apps/cxapp`
    - the external auth API already supports `/api/v1/auth/password-reset/request-link` for self-service reset emails
    - the internal admin user edit route currently accepts generic admin access and updates the user without a super-admin-only password management branch
  - Architecture posture for this batch:
    - keep the password-management behavior in `apps/cxapp` auth service and `apps/api` internal route wiring
    - keep shared `apps/ui` limited to primitives; do not move app-specific password workflow logic into the shared UI package
  - Scope in this batch:
    - add one internal super-admin-only reset-link trigger for an existing user
    - expose a password field on the existing user access tab for direct password replacement
    - show the new controls only when the signed-in operator is a super admin and the form is editing an existing user
  - Constraints:
    - preserve the existing email reset-link flow as the canonical user-facing password reset path
    - do not broaden direct password editing rights beyond super admins
    - keep the change inside the current framework user-management surface instead of creating a parallel auth screen
  - Planned validation:
    - run focused auth tests covering the new service behavior
    - run `npm run typecheck`
  - Residual risk to watch:
    - the direct password-set path will bypass mailbox delivery by design, so audit visibility still depends on existing activity and admin review surfaces
  - Progress so far:
    - updated the `cxapp` auth admin service so direct password replacement requires a signed-in super admin
    - added an internal admin route and service method to send the existing password reset-link flow for a selected user
    - updated the framework user access tab so super admins editing an existing user can enter a replacement password or send a reset link from the same section
    - moved password-management success feedback on the user page to the shared `record-result` toast path instead of a local inline success panel
    - `cmd /c npm run typecheck`
    - `cmd /c npx tsx --test tests/core/auth-service.test.ts` is currently blocked by a pre-existing test harness failure where `getServerConfig()` no longer returns the `notifications` shape expected by the test fixture before the changed auth code is exercised