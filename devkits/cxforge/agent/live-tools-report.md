# Local tools-worker verification

Date: 2026-09-20.
Repository: `https://github.com/CODEXSUN/codexsun.git`.
Source commit: `ffae2c0208ae893e6508997e705ac4f67775f34f`.
Execution mode: `tools`. Model provider: `none-tools-only`.

## Passed

- Go tests with the race detector and `go vet`.
- TypeScript checking for the client and live test.
- ShellCheck for update and drop scripts.
- Real typed-client calls to the local command API.
- Authentication rejection and working-directory traversal rejection.
- 2,048 files written, read, hashed, and searched, approximately 32 MiB.
- Ten million Node.js processing iterations with the expected sum.
- Twelve submitted command batches completed in the serial queue.
- Duplicate request IDs returned the original task. Conflicting payloads were rejected.
- Exit code 7 caused a blocked task.
- A one-second timeout stopped a sleeping command with exit code 124.
- Two million output characters were capped at 256 KiB with a truncation flag.
- Operator cancellation blocked the running task.
- An npm preview command started and served 500 successful gateway requests.
- The live workload completed in 108.221 seconds without a model.
- The archive-based update restored the checkout and preview.
- Restart interrupted a command without replaying its file append.
- A later command verified the single append and restarted the preview.

## Fixes found through live testing

The earlier Windows directory backup restored into a nested folder and changed executable bits.
The update script now transfers a tar archive through Docker standard input and output.
The checkout path and tracked file modes were repaired without changing tracked file contents.
Recovery backups remain under `.container/update.local.backups` and must be kept private.

## Scope and limits

Only `.cxforge-worker-check` was added to the cloned checkout. Large test data was removed.
No source commit, push, pull request, or remote merge was performed.
Zuno integration is supplied as a typed client. Zuno application code was not changed.
These bounded checks are not a long-duration soak test or a security certification.
The service remains localhost-only and uses the local development client key.
Use unique keys, TLS, and restricted network access before remote deployment.
Commands run as the container user. They are not individually sandboxed by owned paths.
The task output stream emits completed-step output, not per-byte live output.

## Repeat

Run `node devkits/cxforge/api/live-check.ts` from the repository root.
The live suite writes its own test directory and leaves a preview available.
Set `CXFORGE_TEST_ORIGIN` and `CXFORGE_ZUNO_CLIENT_KEY` for another trusted local worker.
