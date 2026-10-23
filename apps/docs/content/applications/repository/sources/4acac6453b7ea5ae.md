# TechMedia 1.1.50 cleanup and emulator verification

Repository source: `apps/crm/agent/RELEASE-1.1.50-VERIFICATION.md`

Source SHA-256 (LF line endings): `2cd162958f92690a5c7916a27ef58a701ca6c4d46365452c251bcf7bad49288f`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# TechMedia 1.1.50 cleanup and emulator verification

Verified on 2026-10-23, Asia/Calcutta.
Tenant: TECHMEDIA. CRM account: Vijay (`vijay@techmedia.in`).
Cloud API: `https://codexsun.com/api/platform`.
Frappe connection: `https://erp1.techmedia.in`.

## Test record cleanup

Closed these eight confirmed test enquiries through closure requests and approval.
Stable local record IDs and remote identities remain intact.

| CRM number | Stable local ID | Frappe identity |
| ---------- | --------------- | --------------- |
| 2057       | 2616            | Q2057           |
| 2058       | 2644            | Q2058           |
| 2060       | 2646            | Q2060           |
| 2061       | 2647            | Q2061           |
| 2062       | 2648            | Q2062           |
| 2063       | 2649            | Q2063           |
| 2064       | 2650            | Q2064           |
| 2067       | 2091            | Q2067           |

Closed test Tasks 1, 2, and 3 through their approval workflow.
Each enquiry and task has exactly one closure comment:

> Test record — verification completed. Closed after testing.

All eight Frappe enquiries returned `Closed` and one matching standalone `Job Comments` closure note.
The final check found zero unsent enquiry events.
Frappe Desk also displayed `Closed` for Q2062.
Tasks remain local.

### SOP and duty cleanup

- Deactivated SOP 1, `CODEXSUN-148-AUDIT`.
- Deactivated SOP Item 1, `CODEXSUN-148-CHECK`.
- Deactivated Duty Assignment 1.
- Preserved completed Duty Report 1 and appended the closure note. Remote `REPORTING353` contains the same note.
- Added the note to remote `SOP-14` and `ASSIGN3`. Their DocTypes have no Closed status field.

The SOP Item API has no deactivate route.
Its retirement used a scoped transaction with fixture identity checks, an exact code check, and a row lock.
The update preserved revision history and recorded the actor and update time.
This was an operational data repair, not a new API capability.

### Preserved records

Nine comparison business enquiries retained their nonterminal statuses and received no closure marker.
Enquiry 2071, named `Test`, remains active because its title does not establish agent creation.
Customer records, contact associations, collection amounts, and collection history remain intact.
No record was deleted.

## Emulator installation

| Check             | Verified result                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| Device            | `emulator-5554`                                                              |
| Package           | `in.codexsun.techmedia_crm`                                                  |
| Previous version  | 1.1.48, build 148                                                            |
| Installed version | 1.1.50, build 150                                                            |
| Artifact          | Signed release APK using the existing release certificate                    |
| Installation      | `adb install -r` succeeded                                                   |
| Session           | Existing app data and Vijay session preserved. User unlocked the PIN screen. |

APK SHA-256: `926ce43fc83122f1183c83c46e49506139a93c883ad0613fd37efa12c2d099df`.
Package Manager confirmed the installed version and build.

## Active list verification

| Surface      | Installed app result                                                     | Authenticated cloud API result                                                                                                               |
| ------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Enquiries    | Active Jobs showed existing work. Searching `CODEXSUN` returned no jobs. | All 668 active enquiries were checked across pages. None of the eight closed test IDs appeared. Vijay's assigned active feed had 12 records. |
| Tasks        | Active view showed `No active tasks.`                                    | Zero active tasks.                                                                                                                           |
| Task history | Show all displayed Tasks 1, 2, and 3 with Closed badges.                 | All three closed tasks remained available.                                                                                                   |
| Duties       | Displayed `No SOP duties are assigned to your employee record.`          | Empty active duty list.                                                                                                                      |

Restored the active task filter, cleared the enquiry search, and returned TechMedia to Home.
Home showed 12 Jobs, 0 Tasks, and 0 Duty.
These counts describe the verification snapshot, not a permanent tenant invariant.

## Evidence and limits

Local generated evidence remains outside source control under root `dist/`:

- `test-record-closure-verification.md`
- `techmedia150-emulator-verification.md`
- `test-records-closed-frappe.png`
- `techmedia150-installed-home.png`
- `techmedia150-active-enquiries.png`
- `techmedia150-test-enquiries-hidden.png`
- `techmedia150-active-tasks.png`
- `techmedia150-closed-task-history.png`
- `techmedia150-active-duties.png`

The VPS operation log is `/home/codexsun-releases/1.1.50/test-record-closure.log`.
Temporary API sessions were revoked after the checks.
Cleanup and emulator verification required no app code, schema migration, version bump, or new deployment.
This report records the completed checks. It does not claim a new complete mobile workflow audit.
```
