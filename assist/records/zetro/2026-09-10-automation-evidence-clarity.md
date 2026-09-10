# Automation evidence clarity

## Finding and ownership

The reported repetition was real. Run lists used prompt prefixes, snapshots became identical timeline sentences,
and one response was labeled as both response and report.
Automation web 0.4.1 now projects separate identity, instruction, timeline, executor response, and execution summary.
Supervisor API 0.2.1 preserves provider item IDs in new progress snapshots.
System Tasks remains the persistence owner. Shared UI remains package-owned and unchanged by this patch.
Existing uncommitted Platform browser repairs and auth block changes were preserved.

## Binding and limits

Run labels use declared workflow, application/module scope, and a short durable run ID.
The original title remains available as context. Existing stored titles are not rewritten.
The timeline shows observed tool labels and changed statuses. Unchanged snapshots add no duplicate rows.
Response updates show receipt counts without repeating response content.
The summary reports execution status, tool counts, exit code, and task failure. It does not certify application correctness.
The downloadable report includes the projected timeline and exactly one executor-response section, without raw progress JSON.
No fabricated progress percentage, timing, or reconstructed historical tool activity is added.
Older snapshots lack stable IDs. Their matching is best-effort when the 40-action window rolls.
New snapshots carry IDs. Timestamps remain receipt times, not exact tool execution times.

## Verification and next stage

Eight Automation projection tests passed, including snapshot deduplication, state transitions, unique run labels, and report separation.
Seven API security tests passed, including stable IDs in bounded, redacted snapshots.
Zetro web build and API typecheck passed. The largest web chunk was 392.77 KB with no build warnings.
API/web lint, formatting, UI ownership, module boundaries/dependencies/docs, versions, and file-length checks passed.
The browser opened the revised Automation workspace, but its selected development project had no run history.
The CLI confirmed that project points to this repository. Its `ui-audit` command was rejected because the repository is untrusted.
Trust was not changed or bypassed. Live populated detail and running-state browser verification remain blocked on that approval.
Follow-up: the user approved project-specific trust during the 0.1.24 build. A real script run and populated browser detail passed.
See the [0.1.24 record](2026-09-10-desktop-0.1.24.md). Live agent transitions and installed-desktop UI remain separate gates.
The full repository gate was not rerun for this focused patch. Prior Platform gate evidence does not certify these new changes.
Installed desktop 0.1.23 does not gain these source changes until rebuilt and installed.
P001 still requires disposable three-portal browser accounts and device-activation acceptance.
This patch does not approve P001, automatic release, or business deployment.

References: [Automation](../../../apps/zetro/web/src/modules/automation/README.md),
[Supervisor](../../../apps/zetro/api/src/modules/supervisor/README.md),
and [P001](../../tasks/platform-first-release.md).
