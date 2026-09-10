# Zetro sandbox path repair

## Cause and ownership

Installed 0.1.28 failed with `CreateProcessWithLogonW failed: 267`.
The probe existed in redirected AppData, not the path supplied to the sandbox user.
Physical path resolution fixed command startup. The agent then failed on protected MSIX ancestor traversal.
Codex Connection API 0.10.1 owns physical path resolution and safe error-267 reporting.
The desktop host supplies `ZETRO_SANDBOX_ROOT` under `.zetro/storage/app/private/sandbox` in the user home directory.
The API default remains its configured private storage directory. No data migration is required.
Existing databases, worktrees, failed probes, Windows ACLs, and firewall settings are preserved.

## References and bindings

- [Codex Connection](../../../../apps/zetro/api/src/modules/codex-connection/README.md) owns verification and provider requests.
- [Desktop](../../../../apps/zetro/desktop/README.md) owns the sandbox environment binding.
- [Official App Server contract](https://learn.chatgpt.com/docs/app-server) defines command cwd and sandbox policy.
- `.env.example` documents the optional override. Desktop sets its own value at launch.

## Verification

- Connection regression coverage includes redirected folders, configuration binding, and safe errors.
- API typecheck and lint passed before packaging.
- Live source probe: all eight checks passed at 2026-09-10 11:43:15 UTC.
- Evidence directory: `C:/Users/sunda/.zetro/storage/app/private/sandbox/probe-UXNAA9`.
- Both direct commands and a real agent turn wrote approved files and failed sibling writes.
- Both paths blocked the sampled public TCP endpoint. Localhost remained explicitly permitted.
- MSI build and final bundle passed. The user approved closing, upgrading, and relaunching Zetro.
- The silent upgrade required elevation. The approved UAC upgrade then returned exit code 0.
- Installed file/product version is 0.1.29. API readiness returned `ready` on port 16050.
- Installed and built API SHA-256 match: `F91487F3894095ECECD33205632B25C91E10FC870A20017F1AA9D05EF815A749`.
- MSI SHA-256: `4F9F7E79E385DABA859A8EFCBCDE6FF32B08B6E792938E93CC532BB95EC9095A`.
- After upgrade, SQLite integrity remained `ok` and all eight conversations remained present.
- Fresh installed-session security confirmation and chat acceptance still require the user verification action.
- Before upgrade, SQLite integrity was `ok` and eight conversations were present.
- Online backup: `storage/app/private/release-backups/0.1.29/before-install.sqlite`.
- The first complete root check exited zero but reported a Turbo disk-space warning.
- Three old generated Turbo archives were removed, freeing about 7 GB. They are regenerable.
- Desktop cache outputs now include only the executable and runtime, not Cargo intermediates or old installers.
- The subsequent full check passed without warnings (`dist/zetro-0.1.29-check-final.log`).
- A final gate for the narrowed desktop cache is recorded in `dist/zetro-0.1.29-check-clean.log`.
- Its tooling assertion required one recursive output per workspace. It now checks the exact two desktop artifacts instead.
- Other workspace output checks remain unchanged. Final full check passed without warnings: `dist/zetro-0.1.29-check-complete.log`.

## Parallel work and release limits

Existing uncommitted 0.1.28 work is preserved. No unrelated business source changed.
The canonical version helper aligns the 0.1.29 workspace and desktop metadata.
No commit, push, database migration, or production deployment is part of this repair.
Sampled sandbox success does not certify complete isolation or unattended production readiness.
