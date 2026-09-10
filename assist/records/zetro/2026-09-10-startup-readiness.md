# Startup readiness

## Outcome and ownership

Settings web 0.6.0 replaces the two-frame startup loader with observed connection and security checks.
The shared Execution Status block owns the splash, checklist icons, semantic colors, and compact presentation.
Zetro owns requests, policy consent, timers, retries, and readiness decisions.

## References and bindings

- [Settings](../../../../apps/zetro/web/src/modules/settings/README.md) owns the startup workflow and local preference key.
- [Execution Status](../../../../packages/ui/src/blocks/execution-status/README.md) owns the presentation contract.
- [Codex Connection](../../../../apps/zetro/api/src/modules/codex-connection/README.md) owns server evidence and enforcement.
- The startup uses existing authenticated status and sandbox HTTP routes. No server permission contract changes.
- The root composition mounts `SettingsStartup` once before application providers.

## Decisions

Remember consent and network policy, never a successful verification result.
Do not repeat elevated Windows setup automatically. Its approval remains separate.
Show observed check counts instead of estimated completion percentages.
Keep Settings accessible when blocked. Dismissing the splash does not bypass API enforcement.
Limit startup to one attempt. Explicit Retry prevents an uncontrolled provider-turn loop.
Automatic renewal during daily work is not included. Existing evidence expiry remains enforced.

## Parallel work

Preserved pending shared-package scopes and Chat streaming in this checkout.
The isolated sidebar patch was not merged. No installed desktop process was replaced.

## Verification

Policy tests cover consent, malformed storage, exact network policy, and expired evidence.
Shared rendering tests cover semantic result labels and indeterminate splash progress.
Nine web contract, streaming, and policy tests passed. Seven shared UI rendering tests passed.
The complete Zetro web suite passes 23 tests. Combined with UI, 30 focused tests pass.
UI and Zetro web typechecks, lint, and the Zetro web production build passed.
UI ownership, module documentation, boundaries, dependencies, and file-length checks passed.
The dependency gate first found two old Settings ranges. Both consumers now declare Settings 0.6.0.
An initial root-directory rendering test lacked the UI JSX configuration. The workspace test command passes.
The live development browser renders the startup checklist and Retry / Settings actions.
Its existing API returns 404 for sandbox status. Startup correctly stays blocked after the account check.
The error now directs users to update the matching API build instead of displaying only Not Found.
No existing API listener was restarted. Successful live startup and installed-desktop verification remain unverified.
The final build initially exceeded the chunk warning limit. Startup now loads through a separate lazy boundary.
The final main chunk is 372.36 kB and the build reports no warnings. Root version remains 0.1.30.
