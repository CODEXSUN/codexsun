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

The CRM screens use local CRM APIs for enquiries, comments, work jobs, and activities. Starting or stopping a job and requesting completion add comments on the server; location logging, charges, and collected amounts post comments from the mobile app. An administrator can manually sync a selected Android call-log entry and its comments to the local CRM database. Mobile CRM actions do not send records to Frappe.

## Closure approval refresh

Mark completed sends a closure request. It does not close the enquiry.
The detail screen checks pending requests every 15 seconds and refreshes when the app resumes.
Approval reloads the Closed status. Rejection shows the review note and allows another request.
The Flutter widget suite covers both review outcomes and cancels polling when the screen closes.
On Windows without Developer Mode, set `FLUTTER_WINDOWS=false` before `npm run crm:mobile:test -- --no-pub`.
This runs widget tests without the Windows desktop plugin symlinks. It does not replace Android device verification.
