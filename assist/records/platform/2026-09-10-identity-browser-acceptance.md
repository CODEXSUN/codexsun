# Identity browser acceptance repairs

## Outcome and ownership

Started from clean commit `70c5e7e`, root candidate 0.1.23. Identity web advances to 1.1.2.
Browser testing found three integration defects that the earlier Node tests did not cover.
The public client called native fetch with a class receiver. Login succeeded, but session loading failed before transport.
A receiver-free adapter fixes the client. The new regression failed before the fix and passed afterward.
The Platform shell now consumes Identity's public profile hook and portal-scoped logout callback.
The shared auth block accepts username, email, or mobile input and explicitly hides privileged registration links.
No new dependency, root release, desktop installer, private cross-app import, or migration declaration was added.

## References and bindings

- [Public client](../../../apps/platform/contracts/README.md) owns bounded HTTP transport and response validation.
- [Identity web](../../../apps/platform/web/src/modules/identity/README.md) owns session queries, revocation, and redirects.
- [Auth blocks](../../../packages/ui/src/blocks/auth/README.md) own reusable presentation and registration-link mechanics.
- [P001](../../tasks/platform-first-release.md) remains the acceptance checklist.

The shell receives the authenticated display name, email, initials, and sign-out callback.
Logout uses the current portal endpoint, validates `loggedOut: true`, and redirects only after confirmation.
Failure leaves the session intact and shows a retry instruction in the status bar.
Default fetch and injected transports receive no client instance as their receiver.
No shared UI component receives database, credential, or authorization policy ownership.

## Live evidence

Started Platform API 6010 and web 6021 through root preflight in the configured loopback development environment.
MariaDB smoke passed. Startup applied the existing queued Identity 0004 migration with unchanged checksums.
Readiness reported database, storage, and module runtime ready.
The browser proved super-admin development sign-in, authenticated desk rendering, refresh, and real profile identity.
Profile logout returned to `/sa/login`. Revisiting `/sa` remained denied.
A super-admin session did not grant `/admin` or `/` access. Each redirected to its own login page.
Privileged login screens had no registration link. Regular login retained its configured registration link.
A username-only submission reached the API and returned the expected invalid-credentials message.
No existing regular user credential or administrator account was changed or guessed.

## Verification and remaining gates

`test:identity` passed seven public-client tests and twelve Identity API tests.
UI tests passed five cases, including privileged registration isolation and the regular registration setting.
`npm.cmd run check` passed: 28 workspace builds, typecheck, lint, format, boundaries, documentation, and all included regression/lifecycle tests.
The first attempt caught a 701-line changelog. Consolidating the follow-up note restored the 700-line limit before the successful rerun.
Builds emitted no warnings. Negative dependency tests emitted their expected readiness 503 warnings.
The browser diagnostic log contained no warnings or errors. The test session was signed out after verification.
Evidence: `dist/check-identity-browser.log`. The cold workspace build took 5m12s, including the Windows release executable.
The executable was built by the gate, not installed or published. Installed Zetro remains the earlier 0.1.23 build.
Positive regular/admin browser sign-in, device activation UI, native UI, per-app adoption, and Docker gates remain unverified.
The local database has no administrator account. An owned disposable three-portal fixture is the next acceptance requirement.
This record does not approve a stable release. No commit, push, or installation was performed in this repair pass.
The starting worktree was clean. No unrelated files were reverted.

## Zetro review

Installed Zetro 0.1.23 accepted review `c9f60d05-f83d-4112-9cf1-9dc51411efdd`.
It failed on a Git command. Its isolated worktree was inspected and remained clean.
Replacement file-only review `61d11929-28f5-4dbd-8a5c-976f621bfa80` completed.
It confirmed fetch compatibility but suggested a logout confirmation dialog and portal-specific error copy.
The supervisor rejected these as blockers: the explicit Sign out action already expresses intent.
The service validates server confirmation before redirecting. The visible failure instruction tells the user where to retry.
No release approval or automatic merge followed either review.
