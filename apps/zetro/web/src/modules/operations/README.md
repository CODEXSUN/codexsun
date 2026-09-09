# Zetro Operations Web

## Contract

- Module ID: `zetro.operations.web`
- Version: `1.0.0`
- Owner: Zetro web

This module owns the floating local metrics control, worktree manager, diagnostics
download, connected application status, and global retention settings. The browser
and desktop use the same React source.

The control polls only while the document is visible. Cleanup refuses dirty
worktrees. The settings page controls clean-worktree sweeps and metric retention.

## Verification

Run the Zetro web type check, lint, and production build. Verify the control in
both the browser and packaged desktop bundle.

## Development records

- [2026-09-09 Production foundation](../../../../../../assist/records/zetro/2026-09-09-production-foundation.md)
