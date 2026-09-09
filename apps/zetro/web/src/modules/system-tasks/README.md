# Zetro System Tasks Web

## Contract

- Module ID: `zetro.system-tasks.web`
- Version: `1.0.0`
- Owner: Zetro web

The module owns system task status, execution details, stop, retry, and completion
notifications. The API owns execution and persistence.

## User flow

The repository tools panel shows recent project tasks. Select a task to inspect its
steps. Active tasks expose stop. Failed, blocked, and stopped tasks expose retry.

The client polls only while the page is visible. It uses browser notifications only
after the user grants permission.

## Verification

Queue a repository script. Confirm status changes, step history, stop, retry, and a
completion notification in both the browser and desktop webview.

## Development records

- [2026-09-09 Production foundation](../../../../../../assist/records/zetro/2026-09-09-production-foundation.md)
