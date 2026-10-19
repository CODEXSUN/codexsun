# CRM mobile

This generic CRM Flutter app uses the CODEXSUN Platform API. Its default app name is `CRM` and its Android application ID is `in.codexsun.crm_app`. Client branding remains available as an optional build input.

Run from the repository root with Flutter installed:

```powershell
npm run crm:mobile:run -- --api-url=http://127.0.0.1:7010
```

Create a client-named APK with the same settings. Release APKs include the repository version in their filename:

```powershell
npm run crm:mobile:apk:release -- --api-url=https://crm.example.com
```

Optional build inputs are `--client-name="Client Name"`, `--application-id=in.example.crm`, `--corporate-id=CLIENTCODE`, `--logo-asset=assets/crm-logo.png`, and `--android-brand-asset=crm`. The API URL is the API base URL, without an app-specific `/crm` path. The default display name is `CRM` across supported platforms.

The CRM screens use local CRM APIs for assigned enquiries, tasks, comments, jobs, check-in/out, activities, duties, and reports. Mobile comments use the enquiry/task comment endpoints. Job start/stop is a toggle with an elapsed timer, and check-in changes to check-out after a successful capture. Charge initiation and collection are managed in the web Charges tab, not as mobile action notes. A user can sync a selected Android device call-log entry and its comments to the local CRM database. Creating enquiries from call logs remains administrator-only. Mobile CRM actions do not send records to Frappe.

## Closure approval refresh

Mark completed sends a closure request. It does not close the enquiry.
The detail screen checks pending requests every 15 seconds and refreshes when the app resumes.
Approval reloads the Closed status. Rejection shows the review note and allows another request.
The Flutter widget suite covers both review outcomes and cancels polling when the screen closes.
On Windows without Developer Mode, set `FLUTTER_WINDOWS=false` before `npm run crm:mobile:test -- --no-pub`.
This runs widget tests without the Windows desktop plugin symlinks. It does not replace Android device verification.

## Assigned tasks and action reports

Open Menu > Tasks for accessible active tasks. A task shows its optional contact, status, action history, and completion request.
Choose Add action on an enquiry or task. The action sheet follows the web Actions pattern: comment composer, check-in/out toggle, job timer toggle, WhatsApp, and closure request.
Enquiries and tasks support comments, GPS checkpoints, job timers, and closure requests. The web Charges tab handles structured charge/collection amounts. Duties use their report/result fields in the duty flow.
GPS checkpoints require location permission and a fresh capture.
A failed submission retains its retry key and input. Permission errors remain visible during history polling.
The server enforces assignment, checkpoint sequence, and duplicate protection. Reports appear in the web Actions tab.
Completion stays pending until an administrator approves or rejects it. Task details poll for the decision.
Duty reports can be edited from their history. Editing preserves the report date and changes Actions through the existing protected update API.
The 2026-10-19 mobile scope keeps Chat out of mobile navigation. Enquiry and task comments remain visible in their own record details.

The Android build cache, including Kotlin state, is redirected under root `dist` by the mobile launcher.

## Mobile user scope and rich-text display: 2026-10-19

Mobile navigation is focused on a user's assigned enquiries, tasks, device call logs, activities, duties, and reports. Home summarizes these work areas; Chat is not shown in the mobile navigation. Call logs show Android device call history after call-log permission is granted. Creating enquiries from a call log remains administrator-only.

Enquiries, tasks, and activities use a server-enforced `mine`/assigned scope in mobile requests, including when the authenticated role has broader web access. Activities default to the last seven days; a user can explicitly request the last 30 days from the Activities screen. The server defaults user activity queries to seven days and caps them at 30 days. The Home activity count stays on the default seven-day window. The Reports screen lists submissions for the user's assigned duties; enquiry/task work reports stay in their record details.

Mobile text decoding handles escaped and double-escaped Frappe rich text before removing markup. The normalized text is used in enquiry card titles, enquiry comments/activity, task cards and details, duty instructions, and report entries.

## Historical mobile Home counts: 2026-10-17

Home includes Enquiries, Tasks, Duty, Activities, Chat, and administrator-only device Call logs. Task totals come from the server; other cards count accessible records or conversations. Counts refresh every 20 seconds while the app is active and pause in the background. Call logs read only after permission is already granted. Failed counts show Unavailable.
The top-right bell and Chat card show unread Chat message badges, including assignment/work conversations. The bell opens the unread conversation list. It does not claim a separate push notification inbox.
Fixed duty report requests to pass query parameters separately from the URL path, restoring duty loading and counts.

## 2026-10-17: Home card and badge acceptance

- Verified all six Home destinations on the Android emulator: Enquiries, Tasks, Duty, Activities, Chat, and administrator Call Logs.
- A labeled local assignment increased active Tasks from 1 to 2 and Chat conversations from 2 to 3. Reading its conversation cleared the bell, Chat, and Task badges. A subsequent message raised the badges again; reading cleared them. Closing the labeled task through request/approval returned the active count to 1.
- Fixed Future-returning refresh callbacks in Chat, Duty, Actions, and Call Logs. Open Chat threads mark newly polled messages read and immediately refresh Home badges. The bell opens the selected conversation directly.
- Activities use the server's joined, date-filtered and paginated feed, so the Home count and activity screen share the same seven-day window without loading every enquiry and its details. Work badges derive from unread Enquiry, Task, and Duty conversations rather than the unavailable legacy notification endpoint.
- Added Home navigation/count-refresh, unread-snapshot, and visible-thread read tests. All 29 mobile tests pass. The work-report database E2E also checks assignment unread counts, same-second messages, read clearing, and stale cursor protection.
- Emulator testing uses the saved administrator session and labeled local fixtures. User assignment isolation is covered by the isolated API E2E. No production or live Frappe change is claimed.
