# Task

## Pending

- [ ] `#206` Let super admins manage user password reset from the user access workspace
  - [x] Phase 1: auth admin password-management audit
    - [x] 1.1 trace the current user access tab, admin user update payload, and password reset-link service flow
    - [x] 1.2 confirm where super-admin-only enforcement should live for direct password updates and reset-link sends
  - [x] Phase 2: backend auth management changes
    - [x] 2.1 add a super-admin-only internal action to send a password reset link for a selected user
    - [x] 2.2 enforce super-admin-only direct password changes through the existing admin user update flow
  - [x] Phase 3: user access UI changes
    - [x] 3.1 add a password input on the user access tab for super admins editing a user
    - [x] 3.2 add a send-link action on the same surface with clear reset-link guidance and feedback
    - [x] 3.3 route user password-management success feedback through the shared toast pattern
  - [ ] Phase 4: validation
    - [ ] 4.1 run focused auth tests and typecheck for the changed surface