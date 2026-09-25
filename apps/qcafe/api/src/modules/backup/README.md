# Q Cafe Backup Module

The backup module owns desktop data-folder selection, backup schedules, backup records, and restore checks.

It depends on `qcafe.foundation`.

QC-0706 exposes data-folder selection with absolute-path validation, repeatable backup schedules with retention counts, append-only backup records with SHA-256 checksums, and restore drills. A backup becomes `verified` only after a passing restore check. A failed restore check requires a detail note and leaves the backup unverified.

## Recovery Instructions

A Windows install keeps application data outside the install folder:

1. Select the desktop data folder through `POST /api/v1/qcafe/backup/data-folders` before first service use. Use an absolute Windows path such as `C:\ProgramData\Codexsun\Qcafe`. Relative paths are rejected.
2. Create a backup schedule through `POST /api/v1/qcafe/backup/schedules`. The desktop service copies the SQLite database files and private storage under the selected data folder to the schedule target and then records the backup with its SHA-256 checksum through `POST /api/v1/qcafe/backup/backups`.
3. Run a restore drill before production reliance: copy a recorded backup into an isolated folder, start the API against the copy, and submit the result through `POST /api/v1/qcafe/backup/backups/:backupId/restore-checks`. Only a `passed` check marks the backup verified.
4. To recover a Windows install, reinstall the application, restore the newest verified backup into the selected data folder, run the migration verification command, and confirm the lifecycle ledger before serving traffic.
5. Never restore an unverified backup into the live data folder. Never edit a recorded checksum; record a new backup instead.
