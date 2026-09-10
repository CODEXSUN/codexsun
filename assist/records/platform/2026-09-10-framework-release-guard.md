# Framework release lifecycle guard

## Outcome and owner

F001 inspection reproduced duplicate activation from two overlapping calls on one executor.
The pre-fix probe reported two activations and an active state.
The regression failed with a missing rejection before the repair.

`packages/framework` now owns an exclusive lifecycle guard and public `ModuleLifecycleStateError`.
Install, activate, upgrade, deactivate, and uninstall share the same per-executor guard.
Uninstall rejects while modules remain active. Callers must await deactivation first.
The guard releases in `finally`, including a failed phase.

The Zetro review also identified mutable registry reads and reporter exceptions that
could prevent hooks or misclassify completed activation. Both regressions failed before repair.
Registration now stores a frozen manifest snapshot. Synchronous reporter failures remain
observable through the executor's frozen `reporterErrors` snapshot, bounded to 100 entries.
They do not change hook execution or cleanup outcomes.
The proposed global capability uniqueness check was not adopted: capabilities and public
contract names are module-scoped in the current contract, not global singleton declarations.

## Bindings and compatibility

The existing public methods keep their arguments and return types.
Overlapping lifecycle calls now fail explicitly instead of racing resource creation and cleanup.
No database, identity, UI, or application policy entered the kernel.
Read the [framework README](../../../packages/framework/README.md) and [F001 task](../../tasks/framework-first-release.md).

Zetro's independent review uses committed baseline `1a18b7e`; it does not include this uncommitted repair.
The complete source/consumer gate passed against the candidate checkout.
Stable approval still requires a reviewed revision and the remaining workflow gates.

## Verification

The new concurrency regression failed before the repair and passed afterward.
All seventeen framework contract tests passed against freshly built output.
Framework typecheck, lint, and module boundary checks passed.
`npm.cmd run check:release:adoption` exited zero: 27 workspace builds, lint, types,
ownership, shared UI, documentation, version, runtime, Zetro, identity, and server tests passed.
The chunk budget passed for 651 JavaScript chunks. Live MariaDB foundation integration passed.
Existing temporary Git fixtures emitted line-ending warnings; these remain a test-harness cleanup item.
Zetro returned findings but its job failed because one inspection command failed.
This record does not convert that failed job into a successful execution gate.
This repair does not certify Platform Identity or all applications as stable.

## Candidate 0.1.20 cleanup follow-up

Zetro found lost ownership after failed deactivation and activation rollback.
Two red-to-green regressions now prove cleanup retry and unsafe lifecycle rejection.
All nineteen kernel tests pass. Failed cleanup modules remain owned until deactivation succeeds.
The follow-up Zetro review completed without tool failures and found no remaining defect in these repairs.
Read the [0.1.20 evidence](../zetro/2026-09-10-desktop-0.1.20-verification.md) for job IDs and the exact source hash.
The installed desktop passed idle and post-agent shutdown. Git fixture line-ending behavior is now explicit and local.
