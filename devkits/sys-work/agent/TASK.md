# Sys Work tasks

- [x] Add a standalone frontend and backend with dedicated local ports.
- [x] Scan allowlisted generated files and show size, count, source, and largest files.
- [x] Require selection, a current scan, and typed confirmation before cleanup.
- [x] Skip links, changed files, and files outside approved cache areas.
- [x] Add separate Windows Temp and user AppData Local Temp cleanup targets, with system paths restricted to `C:\\Windows\\Temp`.
- [x] Add safe age-based cleanup targets for WebStorm IDE caches, Gradle wrapper downloads, npm npx packages, and Playwright browser downloads.
- [x] Add read-only inventory for Codex sessions/history, OpenCode database, WebStorm agent installs, Android SDK and emulator disks, Chrome profiles, and Windows app package data. The backend rejects inventory-only cleanup requests.
- [x] Verify the live 7-day scan lists `C:\\Windows\\Temp` and `C:\\Users\\sunda\\AppData\\Local\\Temp` as separate targets on 19-10-2026. Both contained zero eligible files at scan time.
- [x] Verify disposable-directory cleanup and link handling with `npm run test:sys-work` on 19-10-2026.
- [x] Verify the built local HTTP page, health route, and a Windows scan with a 30-day filter on 19-10-2026. The scan reported 3.13 GB in Gradle caches, 1.77 GB in old Codex runtime installs, and 1.10 GB in WebStorm temporary files.
- [ ] Verify local Windows browser scan and cleanup with disposable files.
- [ ] Verify the expanded catalog's local Windows browser scan and inventory-only rejection with disposable fixtures.

Use the exact check results from the current work before marking browser or native behavior complete.
