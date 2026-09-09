# Zetro Git Delivery Flow

## Outcome

Zetro now provides a reviewed Git delivery system task in its repository tools.
The flow supports changelog notes, version updates, merge or rebase pulls, commit,
and optional push.

## References

- Git workflow: `assist/operations/versioning.md`
- API owner: `apps/zetro/api/src/modules/git-delivery/README.md`
- Web owner: `apps/zetro/web/src/modules/git-delivery/README.md`
- Git executor: `apps/zetro/api/src/modules/developer-tools/README.md`

## Ownership and bindings

- `zetro.git-delivery.api` owns flow settings, preview, execution, and history.
- `zetro.git-delivery.web` owns the interactive builder and settings forms.
- `zetro.developer-tools.api` owns Git snapshots and Git command execution.
- `zetro.projects.api` supplies the registered repository and GitHub URL.
- Zetro Desk composes the builder through the Developer Tools top-content slot.
- Settings and Project Properties compose global and isolated settings.

## Decisions

- The flow runs only release scripts declared by the selected repository.
- A run includes the reviewed HEAD and changed-file list.
- The API rejects a run when repository state changes after review.
- Pull supports rebase, merge, or an explicit skip.
- Push stays optional and uses the existing Developer Tools push policy.
- Every run persists as a system task with step results and final status.
- The root version command now aligns npm, Tauri, Cargo, and the Cargo lock package.
- The version check now rejects mismatched Zetro desktop metadata.

## Parallel work

The workspace contained unrelated changes across other applications. This change
preserved them and did not run commit, pull, or push against the working repository.

## Verification

- Zetro API and web type checks passed.
- Zetro API and web lint passed.
- Git Delivery service tests passed.
- Developer Tools tests passed for merge and rebase pulls.
- Zetro API and web production builds passed for 0.1.7 and the final 0.1.8 package.
- Module documentation, boundaries, dependencies, versions, lines, and chunk budgets passed.
- Browser review confirmed the builder, GitHub URL, version transition, review dialog, and global settings.
- Live review used the current 389-path dirty workspace without running the system task.
- `github:now --dry-run` confirmed the release subject and made no Git changes.
- The version tooling test passed for npm, Tauri, Cargo, and Cargo lock alignment.
- A concurrent release advanced the workspace to 0.1.8. The final WiX MSI build passed at that version.
- MSI SHA-256: `1F46914CADB7302C5F229811F415172ABF46C63A98D91D17927A2A64A324250F`.
