# Unattended Docker Coding and Roaming Access

Status: proposed design, not an enabled execution policy.
Parent: [planning.md](planning.md). Execution: [task.md](task.md).

## Outcome

Approve a bounded coding session once, then let routine development continue on the workspace server.
Use any authorized phone or laptop to submit tasks, inspect previews, or resolve critical decisions.
The server runs independently of WebStorm and does not require a person to click each command approval.
This design does not change permissions in the current WebStorm session.

```text
Authorized device → task/phase selection + execution profile → session authorization
  → durable runner → policy check → isolated Docker tools → verification → next task
                         │
                    critical decision
                         ↓
                  approval inbox → mobile notification → authenticated decision
                         ↓
                  revalidate and resume
```

## Default daily-coding profile

An execution profile defines capabilities, writable paths, commands, network destinations,
credentials, verification requirements, time limits, and budget limits.
The session authorization binds its version to the actor, workspace, task selection, and expiry.
Default behavior is explicit and enforced by the execution service, not inferred from a model's risk score.

| Action                                                                                   | Default decision within an authorized session                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Read/search scoped source and approved documentation                                     | Allow and audit                                                     |
| Edit source in selected task paths                                                       | Allow with version checks and a recoverable diff                    |
| Run configured tests, lint, typecheck, build, and verification scripts                   | Allow in the sandbox within resource limits                         |
| Start/stop registered development servers and authenticated previews                     | Allow for this workspace only                                       |
| Retry repairs and advance approved task items                                            | Allow within attempts, scope, and budget                            |
| Restore locked dependencies from permitted registries                                    | Allow only under the configured install/lifecycle-script policy     |
| Git status/diff/log and isolated execution-branch creation                               | Allow under the repository policy                                   |
| New dependencies, new external destinations, additional writable paths                   | Request scoped approval                                             |
| Remove tracked source, rewrite Git history, discard user changes, delete persistent data | Request approval with exact targets and recovery consequences       |
| Push, merge, publish, deploy, or write to external services                              | Request approval unless a separate explicit grant already covers it |
| Change secrets, membership, execution policy, budgets, or production data                | Require authorized critical approval                                |
| Host filesystem access, host Docker socket, privileged containers, other users' volumes  | Deny under this profile                                             |

Routine checks such as verify-zvcode.mjs must not prompt repeatedly after profile authorization.
A known command name is not sufficient: bind its executable, arguments, working directory,
environment policy, and relevant script/package configuration digest.
Source edits may proceed within scope; changes to trusted validation or policy definitions require reassessment.
Do not let the agent pass tests by disabling assertions, changing required checks, or weakening acceptance criteria.
Shell composition, package lifecycle scripts, and executable changes must not bypass action classification.
Use structured command arguments and actual filesystem/network isolation rather than a shell-command denylist alone.

## Isolation and agent backend integration

Run the editor, agent workspace, and development processes as non-root with bounded resources.
Drop unnecessary capabilities, prevent privilege escalation, and use a read-only base filesystem where practical.
Mount only the selected writable checkout, scratch space, and scoped caches.
Provide disposable test data and permit artifact cleanup only inside designated output directories.
Keep production credentials, host mounts, control-service source, and the Docker socket outside the sandbox.
Constrain outbound traffic at the runtime boundary; a model-facing allowlist alone does not block shell egress.
Use an external runtime manager with narrow lifecycle operations for container creation and cleanup.

Zetro2 dispatches directly through supported backend APIs or CLI adapters inside the sandbox.
It does not automate WebStorm permission dialogs as its execution mechanism.
Translate the profile into supported OpenCode, OpenHands, or native backend tool restrictions.
Prove restrictions against built-in tools and subprocesses before enabling unattended mode.
Use backend noninteractive execution only when enforced sandbox controls and policy conformance tests pass.
If a backend cannot honor the profile, expose that limitation and keep unattended mode disabled for it.
Do not globally disable permissions on the developer's host to eliminate prompts.

## Decisions and mobile notifications

The server evaluates allow, deny, or approval-required before every action.
Allowed actions execute and enter the audit trail without interrupting the developer.
Denied actions return an actionable reason; they do not repeatedly ask for an impossible override.
Critical requests create one durable ApprovalRequest linked to the exact task/run and proposed effect.
Store action digest, scope, source revision, policy version, reason, expiry, and eligible approvers.
Pause the affected sequential workflow until a valid decision exists.

Deduplicate repeated requests for the same unchanged action and approval scope.
Approvals are consumed according to their explicit one-action or bounded-scope grant.
Changing arguments, scope, or the relevant source revision requires fresh validation and possibly renewed approval.
Timeout, notification failure, silence, or opening a notification never means approval.
Use an atomic transition so conflicting decisions from two devices cannot both succeed.
Recheck current permission, task state, and content digest before resuming.

Start with a durable in-app approval inbox and optional browser push through a NotificationProvider adapter.
Validate push support on the actual target phone/browser before promising background delivery.
Use an outbox for reliable delivery, bounded retries, deduplication, and delivery status.
Notifications carry minimal metadata and an authenticated deep link, never source code, secrets, or approval tokens.
Opening the link shows the proposed action, diff, consequences, and approve/deny controls.
Sensitive decisions can require fresh authentication according to the identity provider policy.

Default push alerts cover critical approvals, required human decisions, and terminal failures needing intervention.
Routine tool calls, successful checks, and unchanged progress stay in the dashboard.
Completion alerts are opt-in; quiet hours and escalation preferences never bypass execution gates.
If push is unavailable or the device is offline, retain the request in the inbox and keep work paused.
Email or other channels remain optional later adapters, not a dependency for the first version.

## Multiple authorized devices

The frontend shows active devices/sessions, session expiry, recent activity, and revocation controls.
Authorize each device through normal identity login; never use possession of a push subscription as authentication.
Separate notification enrollment from workspace access grants.
Device revocation invalidates its sessions and push subscription without granting another device extra privileges.
Workspace or actor-grant revocation stops affected work; revoking one display device need not cancel a separately authorized server session.
Make that distinction explicit in the UI and record it in session policy.

Use short-lived access sessions, controlled renewal, TLS, and scoped API credentials.
Phones can create tasks, choose phases, start an approved run, inspect results, and approve critical actions.
Concurrent clients share durable server state with revision checks and event cursors.
No long-lived model credentials or workspace filesystem mounts belong on the phone.

## Availability, recovery, and budgets

Roaming access requires a reachable, powered workspace host and an authenticated network route.
Closing a browser must not stop server work; sleeping or powering off the Docker host will stop execution.
For continuous access, deploy the same private environment on an authorized always-on host.
Selecting or provisioning that host is a deployment task, not an implicit change in this plan.

Use a durable worker lease, heartbeats, checkpoints, cancellation, and side-effect reconciliation after restart.
Set per-task and whole-session time, cost, retry, output, and concurrency limits before dispatch.
Budget exhaustion pauses or ends work explicitly; approval to increase limits is separate from ordinary continuation.
Do not promise exact replay of model output or duplicate-free effects without recorded reconciliation evidence.

## End-to-end acceptance

1. Authorize a daily-coding session for a fixture task.md and declared phase range.
2. Run reads, edits, verification, repair, and previews without per-command prompts.
3. Verify a new dependency or scope expansion creates one critical approval request.
4. Receive a phone notification and inspect the request through authenticated frontend access.
5. Approve from the phone and verify the exact paused operation resumes once.
6. Deny, expire, alter, or revoke a request and verify its operation does not execute.
7. Test two-device conflicting decisions, offline delivery, retries, and duplicate notifications.
8. Test backend attempts to bypass policy through shell commands, scripts, network, or mounts.
9. Disconnect the client, restart the worker, and verify durable progress without repeated completed actions.
10. Verify default alerts contain only actionable events and do not expose sensitive content.

Record prompt counts: routine authorized actions must produce zero approval interruptions.
Critical actions must produce the expected requests, never silent escalation.
