# Daily coding readiness

## Outcome and references

- [Agent Chat](../../../../apps/zetro/web/src/modules/agent-chat/README.md) preserves drafts until acceptance and keeps delivered answers visible on save failure.
- [Settings](../../../../apps/zetro/web/src/modules/settings/README.md) owns the read-only pre-submit security check with bounded HTTP waiting.
- [Shared UI](../../../../packages/ui/README.md) owns scroll-follow behavior. Applications retain conversation state.
- The root `check:zetro:daily` command runs deterministic source checks without publication or installation.

## Binding and decisions

Chat uses the public Settings `assertExecutionReady` before conversation writes or provider submission.
It does not automatically spend another provider turn or change network policy.
The composer clears only after acceptance. Failed preflight retains both text and attachments.
Accepted user messages remain in history when later execution fails. No automatic retry risks duplicate actions.
Scroll-follow pauses when the reader scrolls upward and resets on conversation selection.

## Parallel work

Preserved shared scope, streaming, startup, and sidebar work already in the root checkout.
No isolated worktree was deleted or overwritten. No live service was restarted.

## Verification

The broad gate exposed outdated supervisor fixtures using a top-level module folder.
Fixtures now use apps/test/module. A negative test still rejects the old path. Enforcement was not weakened.
The default API suite now includes the existing Chat cancellation service test.
A live development-browser test retained the draft when its older API rejected the sandbox status request.
The test draft was cleared after inspection. No provider turn was started.
`npm.cmd run check:zetro:daily` passed with exit code 0 after the fixture correction.
UI, API, and web typechecks and lint passed. All three workspace test suites passed.
API and web builds passed without warnings. The main web chunk is 375.01 kB.
UI ownership, boundaries, dependencies, module documentation, file lengths, and 800 production chunks passed.
Installed desktop, real provider execution, and deployment readiness remain unverified for this source candidate.
