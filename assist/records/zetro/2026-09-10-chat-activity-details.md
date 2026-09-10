# Chat activity details contract repair

## Finding and ownership

Agent Chat web 0.12.1 accepts the API's optional command failure details, bounded to 2,000 characters.
The previous strict schema rejected valid responses and saved history that contained this field.
The frontend type now matches the validated shape. Unknown fields remain rejected.
Zetro owns this protocol repair. No reusable UI, database, account, or API behavior changes.
The working tree was clean before this patch.

## Verification

Regression tests cover turn responses, saved history, legacy activities, the size boundary, invalid types, and unknown fields.
The workspace test command includes these tests. All Zetro web tests passed, including three new contract tests.
Zetro web lint, TypeScript build, formatting, UI ownership, versions, module documentation/dependencies/boundaries,
application documentation, workspace layout, file length, and production chunk checks passed.
The version and line checks first caught changelog formatting and size issues. Both passed after compacting older entries without removing evidence.

The canonical helper aligned root and workspace versions to 0.1.25 without database changes.
The MSI build passed without warnings. The largest web chunk is 393.00 KB.
The executable reports product and file version 0.1.25.
Two Rust tests and the packaged API authentication, trusted script, and shutdown lifecycle test passed.
Installer: `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.25_x64_en-US.msi`.
SHA-256: `89AA38308D2058F991C4BE81E5D92E3EF79B54A4C7D13D7EE7F12E6F7C58ED4E`.
Evidence logs: `dist/chat-fix-tests-0.1.25.log`, `dist/desktop-msi-0.1.25.log`, and `dist/desktop-test-0.1.25.log`.
The installer is unsigned and was not installed. Live provider chat and the full repository gate were not rerun.

## Recovery and next work

This fix does not rerun failed commands or prove that the original agent task succeeded.
Inspect the existing conversation worktree before retrying its task.
P001 should use Platform Identity scope, not Zetro Agent Chat scope.
Existing conversations and worktrees are preserved. Installation, publication, and commit are separate actions.

References: [Agent Chat](../../../apps/zetro/web/src/modules/agent-chat/README.md),
[P001](../../tasks/platform-first-release.md).
