# Desktop 0.1.26 scope binding

## Findings and changes

Folder browsing retained the prior module label when the new folder had no module segment.
The scope contract had no documentation write paths. Provider turns relied on the connected cwd alone.
New chats already cleared scope. No evidence showed a hardcoded Zetro cwd after a saved Platform scope.
The repair clears stale folder metadata, rejects application/folder mismatches, and displays the selected scope before sending.
Chat API 0.15.0 stores explicit optional documentation folders. Agent Chat web 0.13.0 confirms them in the drawer.
Codex Connection 0.9.0 passes these worktree-local roots in each turn's sandbox policy.
Only existing directories below assist are accepted. Broad, escaped, missing, and redirected paths fail closed.
Network and temporary-root writes are disabled. No repository-wide or sibling-application write grant is added.
Previous 0.1.25 repairs and pending version changes were preserved.

## Verification and release

Focused API scope, transport, history, workflow, and web regression tests passed.
The complete Zetro API and web test suites, desktop Rust tests, and packaged API lifecycle test passed.
Typecheck, lint, format, UI ownership, module dependencies/docs/boundaries, app docs, versions, line limits, and chunk checks passed.
The browser rejected a Platform label paired with apps/zetro, then displayed the confirmed Platform and documentation scope.
The MSI build passed without warnings. The largest web chunk is 394.33 KB.
Windows first returned 1603 because the silent upgrade lacked administrator rights. The elevated retry returned 0.
The installed executable reports 0.1.26. The desktop-session launcher reported ready on port 16050.
The normal desktop was then launched without pairing. PID 29392 runs the installed executable and /health/ready reports ready with SQLite.
SQLite quick_check returned ok before and after upgrade. All 17 conversations were preserved.
A pre-upgrade backup is under storage/app/private/release-backups/0.1.26.
The installer is unsigned. No commit, push, publication, complete P001 run, or full repository gate was performed.
Installer: dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.26_x64_en-US.msi.
Logs: dist/desktop-msi-0.1.26.log, dist/install-zetro-0.1.26-elevated.log, dist/desktop-tests-0.1.26.log,
dist/zetro-api-tests-0.1.26.log, and dist/zetro-web-tests-0.1.26.log.
No database declarations, existing chats, worktrees, or application accounts are changed by this patch.

## Runtime enforcement limit

A real provider turn wrote disposable markers in the selected Platform and documentation folders and verified both files.
The sibling folder remained untouched in that turn. Evidence: dist/scope-turn-smoke-0.1.26.log.
A separate standalone command/exec probe accepted writes outside requested roots on this Windows runtime.
Therefore this release proves scope propagation and approved-folder execution, not operating-system denial of all sibling writes.
Do not treat the displayed scope as an independently verified security boundary or use it to execute hostile code.
Provider startup removes inherited Codex host permission, session, and tool-pipe variables and requests workspace-write mode.
Further runtime enforcement investigation remains required before claiming strict isolation.

## Use for P001

Select application `platform`, module `identity`, and folder `apps/platform`.
Add `assist/records/platform` and `assist/tasks` as documentation directories and confirm the drawer.
This explicitly grants those directories, not only one task file. Inspect the scope bar before sending.
Prompts cannot expand these permissions. Existing conversations retain their scope until explicitly changed.
Inspect previous worktree changes before retrying. Build caches and root output may need a separately approved tool workflow.

References: [Chat API](../../../apps/zetro/api/src/modules/chat/README.md),
[Agent Chat](../../../apps/zetro/web/src/modules/agent-chat/README.md),
[App Server sandbox policy](https://learn.chatgpt.com/docs/app-server#sandbox-read-access-readonlyaccess).
