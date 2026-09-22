# CXForge command API

CXForge executes explicit commands. Zuno owns planning and any model connection.
Set `CXFORGE_EXECUTION_MODE=tools`. No model credentials are required.

The Go service exposes REST and task events. A tRPC gateway is not required.
Import `CXForgeCommands` from `apps/devkits/cxforge/api/client.ts` in a trusted server client.
Do not send the worker key to browsers.

## Submit work

Send `POST /api/v1/cxforge/control/commands` with `X-CXForge-Client-Key`.

```json
{
  "requestId": "example-command-001",
  "title": "Check source files",
  "steps": [
    {"argv": ["git", "status", "--short"], "directory": ".", "timeoutSeconds": 30},
    {"argv": ["npm", "test"], "directory": "apps/example", "timeoutSeconds": 120}
  ]
}
```

Use a new request ID for each command batch. Identical retries return the existing task.
Reusing an ID with different commands returns HTTP 409.
All batches use the same checkout and execute serially.

Commands start in `/workspace`, or a validated subdirectory.
Clone a repository before submitting commands. This endpoint does not create repositories.
Send a shell explicitly with `argv: ["sh", "-c", "..."]` when needed.

Read status from `GET /api/v1/cxforge/control/commands/<requestId>`.
Read task events from the existing task events endpoint.
Results include combined output, exit code, and an output truncation flag.
Output is limited to 256 KiB per step. Requests allow up to 32 steps.
Each step allows 1–300 seconds. The container command timeout also limits the entire batch.
Output events are emitted after each step, not for each output chunk.

Cancel with `POST /api/v1/cxforge/control/tasks/<requestId>/cancel`.
Linux cancellation kills the command process group.
After a restart, interrupted batches remain blocked. Inspect their effects before retrying.
An explicit retry repeats the entire batch and can repeat side effects.

## Preview

Set `previewCommand` to an explicit foreground command, such as `npm run dev -- --port {port} --host 0.0.0.0`.
The supervisor replaces `{port}` and returns the gateway URL in `previewUrl`.
The existing workspace preview is reused while it remains running.
Do not use background shell jobs for previews.

## Trust boundary

Only trusted Zuno servers and operators may submit commands.
The container is the isolation boundary. Owned file paths do not sandbox arbitrary shell commands.
Commands can access files available to the container user, including worker state.
Command processes do not inherit API keys from the worker environment.
This does not prevent commands from reading files or using network access.
Use unique client keys and TLS before exposing the worker outside localhost.
Do not mount the Docker socket, host credentials, or unrelated repositories into the worker.
Git publication remains an operator action. Do not give untrusted callers shell access.
