# Legacy VPS archive and hotfix audit

Operation date: 2026-11-19 (Asia/Calcutta).

## Scope and current outcome

The user authorized local backups of `/home/codexsun-releases` and
`/home/codexsun-hotfixes`, hotfix comparison against GitHub, a versioned operation
record and eventual VPS synchronization. The user clarified that both legacy
folders may be removed only after all checks pass. Neither folder has been removed.

This record does not certify a completed production update. Application data,
shared infrastructure, runtime images and active Compose models remain intact.

## Source and production identities

At comparison time, GitHub `main` and the clean Windows checkout both identified
`5e33dfc44499a92fe703e84ca0419913ba57c652`, package version `1.1.87`.
This documentation batch prepares the next lockstep version, `1.1.88`.

The VPS `/home/codexsun` checkout identified version `1.1.72`, commit
`bc0670e3f320f3a71f35f2dcae2a170c2a695950`.
Production API and Web report `1.1.75`, revision
`4c6b37784c9d4a24094b44649f1aae7e57ad2350`.
Shop, Worker and Chatb report `1.1.72`, revision
`e6e7b79c751fb0d700b063daadd89cba4b289473`.
All five containers were healthy during the audit. These identities do not match
the GitHub baseline or the proposed documentation version.

## Private backup evidence

The protected local operator backup directory is
`D:/workspace/backups/hostinger-codexsun-20261119`.
Archives and source manifests may contain private customer or operational data;
they must never be committed. See the adjacent verification JSON records for
archive sizes, SHA-256 values, member counts and verification outcomes.
Full archive transfer and source comparison must both complete before removal.
Directory archives alone are not current database, Redis, media or runtime-image
recovery evidence for a production deployment.

Both archives passed complete gzip/tar reads:

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| `codexsun-releases.tar.gz` | 1981071511 | `069cd6a9ec20aecf423c7ff2ad7d0b8a852780d9a241b4c1d93081e08c70fd54` |
| `codexsun-hotfixes.tar.gz` | 121136597 | `f3e0a1899a0d99cf7a51f3d202c02e20076ce33e05517d10f1ed1983edfba352` |

Archive member counts are 122043 and 22003 respectively. Per-file source
comparison is a separate check recorded in the private verification files.
Both source comparisons passed: 122042 and 22002 source descendants respectively,
with zero mismatches and zero extra archive entries. Regular-file SHA-256 values,
permissions, owners and symlink targets were compared. The archive root itself
accounts for the one additional member in each archive.

## Hotfix review

Compared three hotfix groups against the exact published `1.1.87` baseline:

| Group | Source review |
| --- | --- |
| `20261021-crm-record-scope` | Administrator-only enquiry/task tenant-wide access, hidden Contact 360 permission entries, Team Head role, task-assignee guards and closure ownership checks remain present. Later CRM changes extend some files. |
| `20261021-custom-domain-login` | Custom-domain tenant selection without Corporate ID remains present. Corporate ID is required on shared hosts; credential-recovery source is unchanged from the patch. Login-context construction was refactored. |
| `20261021-duty-report-options` | Own-report users retain access to options; team-wide capability and list access remain guarded separately. |

All 21 patch entries exist in the published baseline. Eight whole files match
exactly after line-ending normalization; the other 13 entries have subsequent
changes, including the duty-report path appearing in two patch groups. Review
confirmed the listed hotfix behaviors in current source; byte equality alone was
not used as a behavioral acceptance test.

Focused command executed from the local repository:

```text
node --import ./tools/register-root-package-resolution.mjs --import tsx --test apps/crm/api/src/crm.access.test.ts apps/crm/api/src/modules/duty-report/duty-report.routes.test.ts apps/crm/api/src/modules/task/task.service.test.ts
```

Result: 11 tests passed, zero failed. Database/browser acceptance, including
custom-domain login, has not been rerun against a new staged or production image.
| CRM record scope | Administrator-only tenant-wide reads; Contact 360 permission filtering; own-record closure guards; assignee-change restrictions; Team Head and permission seed logic remain represented. |
| Custom-domain login | Verified-domain login avoids mandatory Corporate ID; shared-domain login still requires it; credential-recovery domain binding remains represented. |
| Duty-report options | Own-report users can retrieve capability options; all-report and summary access remains permission-guarded. |

The patch inventory contains 21 file entries (20 distinct paths). All paths
exist in the published baseline; eight entries match their historical patch
bytes after line-ending normalization. Other files have later changes and were
reviewed for the relevant hotfix behavior, rather than treated as exact copies.
Raw patches, per-file historical diffs and comparison JSON remain in the protected
local backup directory. Do not overwrite newer code with whole historical files.

Eleven focused tests passed using:

```powershell
node --import ./tools/register-root-package-resolution.mjs --import tsx --test apps/crm/api/src/crm.access.test.ts apps/crm/api/src/modules/duty-report/duty-report.routes.test.ts apps/crm/api/src/modules/task/task.service.test.ts
```

This is source review and focused unit verification. Custom-domain browser/login,
tenant-database E2E and production acceptance were not run by this audit.
Historical database grant changes are not proved by source-file comparison.

## Removal and production gates

The active Compose files are under `/home/codexsun/.container/releases`, not
`/home/codexsun-releases`. No inspected container mounts either legacy removal
target. The legacy release folder nevertheless holds recovery/import artifacts
and `current` links; historical references also occur in operator documentation
and saved backup metadata. Absence of live mounts does not prove recovery safety.

Keep `/home/codexsun`, its `.container/releases`, Docker volumes, previous images,
private configuration, shared services and recovery records. Only the two named
legacy directories are potential removal targets after successful verification.

Before any production replacement, follow `IMMUTABLE-PROMOTION.md` and
`STAGING-PREPARATION.md`: prepare exact candidate images, isolated staging
acceptance, reviewed target migrations, mount adoption, current backup/restore
evidence and the bound production model. No latest-version images or matching
acceptance receipts were found on the inspected VPS. Existing receipts identify
older releases and cannot be reused as acceptance for `1.1.88`.

The old VPS updater is not a safe shortcut: the recorded readiness audit flags
the read-only Data Bridge source mount and outdated migration compatibility.
Do not drop that mount, widen backup scope silently, forge receipts, or rebuild
production source to bypass immutable-promotion gates.

Final deletion, production promotion and version convergence remain pending until
these conditions are actually met. No production success is asserted here.

## Release preparation checks

`npm run check:versions`, `npm run docs:sync`, `git diff --check` and the complete
`npm run check` passed for prepared version `1.1.88`. The latter completed
component documentation tests, cleanup tests, module-boundary checks/tests,
add-on checks, documentation validation, type checks and lint. These are source
release checks, not staging or production acceptance evidence.

No `1.1.87` or `1.1.88` CODEXSUN application images were present on the VPS at
inspection. Existing staged acceptance records identified earlier releases only.
The published promotion contract requires exact new image digests, fresh staging,
migration compatibility/target review, mount adoption and verified production
recovery before apply. No evidence receipts were invented or old receipts reused.
The source-building updater was not used to bypass these gates.
