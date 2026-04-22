# Orexso API Integration Guide

This file explains how to connect another app to the local Orexso API.

It covers:

- base URL and health checks
- API-key authentication
- standard chat requests
- streaming chat requests
- task interruption
- rollback
- agent task execution
- MCP integration
- practical client examples

## 1. Base URL

By default, Orexso runs on:

```text
http://localhost:6005
```

If you deployed it on another machine, replace `localhost` with that server IP or hostname.

Examples:

- local machine: `http://localhost:6005`
- LAN server: `http://192.168.1.25:6005`
- remote host: `http://your-server:6005`

## 2. Authentication

Orexso supports optional API-key protection.

### Server-side configuration

If the server sets:

```env
OREXSO_API_KEYS_RAW=key1,key2
```

then every protected API request must include one of those keys.

If `OREXSO_API_KEYS_RAW` is empty, authentication is disabled.

### Accepted auth headers

You can authenticate in either of these ways:

```http
X-API-Key: your-key
```

or:

```http
Authorization: Bearer your-key
```

### Check auth status

Request:

```bash
curl http://localhost:6005/api/v1/auth/status
```

Typical response:

```json
{
  "enabled": false,
  "authenticated": true,
  "header_name": "x-api-key",
  "notes": [
    "API key protection is disabled for this Orexso instance."
  ]
}
```

If auth is enabled and your key is missing or invalid, protected routes return:

```json
{
  "detail": "Missing or invalid API key. Send x-api-key or Authorization: Bearer <key>."
}
```

## 3. Basic health check

Use this before integrating chat or tools.

```bash
curl http://localhost:6005/health
```

Example response:

```json
{
  "status": "ok",
  "app": "Orexso",
  "environment": "development",
  "chat_model": "qwen2.5-coder:3b",
  "warmup_ready": true,
  "warmup_status": "ready",
  "warmup_detail": "qwen2.5-coder:3b warmed",
  "ide_mode": "vscode-and-mcp",
  "qdrant_url": "http://qdrant:6333",
  "ollama_url": "http://ollama:11434",
  "auth_required": false
}
```

## 4. Standard chat API

This is the simplest endpoint for another app that just wants an answer.

### Endpoint

```text
POST /api/v1/chat
```

### Request body

```json
{
  "message": "Explain this repository",
  "session_id": "external-app-1",
  "use_model": true,
  "history": []
}
```

### Field meanings

- `message`: the user prompt
- `session_id`: optional session identifier from your app
- `use_model`: `true` to use Ollama, `false` for deterministic fallback
- `history`: currently accepted by the API; you can send `[]`

### Response shape

```json
{
  "session_id": "external-app-1",
  "reply": "Orexso response text",
  "activities": [
    {
      "tool": "file_search",
      "status": "completed",
      "detail": "Completed in 31 ms"
    }
  ],
  "generated_by": "ollama",
  "rollback_actions": []
}
```

### cURL example

Without auth:

```bash
curl -X POST http://localhost:6005/api/v1/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Explain this repository\",\"session_id\":\"external-app-1\",\"use_model\":true,\"history\":[]}"
```

With auth:

```bash
curl -X POST http://localhost:6005/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{\"message\":\"Explain this repository\",\"session_id\":\"external-app-1\",\"use_model\":true,\"history\":[]}"
```

## 5. Streaming chat API

Use this when your app wants partial tokens while Orexso is generating a reply.

### Endpoint

```text
POST /api/v1/chat/stream
```

### Content type

The response is Server-Sent Events:

```text
text/event-stream
```

### Request body

Same as `/api/v1/chat`:

```json
{
  "message": "Summarize the backend architecture",
  "session_id": "external-app-1",
  "use_model": true,
  "history": []
}
```

### SSE events you should handle

#### `status`

Example:

```text
event: status
data: {"message":"Discovering relevant files"}
```

#### `metadata`

Example:

```text
event: metadata
data: {
  "task_id":"task-123abc",
  "discovered_files":["app/api/app.py"],
  "tool_calls":[...],
  "generated_by":"ollama",
  "rollback_actions":[]
}
```

Important:

- save `task_id` if you want to interrupt the request later
- save `rollback_actions` if this task modified files

#### `chunk`

Example:

```text
event: chunk
data: {"content":"partial text"}
```

Append each chunk to the current assistant message.

#### `done`

Example:

```text
event: done
data: {
  "task_id":"task-123abc",
  "reply":"final response",
  "activities":[...],
  "generated_by":"ollama",
  "status":"completed",
  "rollback_actions":[]
}
```

### JavaScript streaming example

```ts
const response = await fetch("http://localhost:6005/api/v1/chat/stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your-key",
  },
  body: JSON.stringify({
    message: "Explain the agent task flow",
    session_id: "my-app-session",
    use_model: true,
    history: [],
  }),
});

if (!response.ok || !response.body) {
  throw new Error(`Request failed: ${response.status}`);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let taskId = "";
let fullReply = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const events = buffer.split("\n\n");
  buffer = events.pop() ?? "";

  for (const rawEvent of events) {
    const lines = rawEvent.split("\n");
    const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
    const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim();
    if (!event || !dataLine) continue;

    const data = JSON.parse(dataLine);

    if (event === "metadata") {
      taskId = data.task_id;
      console.log("Task ID:", taskId);
    }

    if (event === "chunk") {
      fullReply += data.content ?? "";
      console.log("Partial:", fullReply);
    }

    if (event === "done") {
      console.log("Final:", data.reply);
    }
  }
}
```

## 6. Interrupting a running chat

If your app uses `/api/v1/chat/stream`, save the `task_id` from the `metadata` event.

Then call:

```text
POST /api/v1/agent/tasks/{task_id}/interrupt
```

### Example

```bash
curl -X POST http://localhost:6005/api/v1/agent/tasks/task-123abc/interrupt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{}"
```

Example response:

```json
{
  "task_id": "task-123abc",
  "cancelled": true,
  "status": "interrupt-requested",
  "notes": [
    "Interrupt request accepted."
  ]
}
```

Notes:

- interruption is cooperative, not a hard process kill
- this is designed for active streaming chat flows
- if the task has already ended, the API reports that instead

## 7. Rolling back changes

If Orexso changed files during a task, the response may include `rollback_actions`.

Your app can roll back in three ways.

### Option A: roll back by `task_id`

```bash
curl -X POST http://localhost:6005/api/v1/agent/rollback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{\"task_id\":\"task-123abc\"}"
```

### Option B: roll back latest change in a `session_id`

```bash
curl -X POST http://localhost:6005/api/v1/agent/rollback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{\"session_id\":\"external-app-1\"}"
```

### Option C: explicit snapshot or stash rollback

Snapshot rollback:

```bash
curl -X POST http://localhost:6005/api/v1/agent/rollback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{\"snapshot_id\":\"abc123\",\"path\":\"app/api/app.py\"}"
```

Git stash rollback:

```bash
curl -X POST http://localhost:6005/api/v1/agent/rollback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d "{\"git_stash_ref\":\"stash@{0}\",\"drop_after_apply\":false}"
```

### Rollback response

```json
{
  "restored": true,
  "path": "app/api/app.py",
  "snapshot_id": "abc123",
  "git_stash_ref": null,
  "notes": [
    "Rolled back task task-123abc using the most recent file snapshot."
  ]
}
```

## 8. Structured agent task API

Use this when another app wants Orexso to behave more like a coding agent instead of plain chat.

### Endpoint

```text
POST /api/v1/agent/task
```

### Example request

```json
{
  "instruction": "Explain how the chat API works",
  "mode": "explain",
  "active_file": "app/api/routes/chat.py",
  "selection": "",
  "project_id": "default",
  "session_id": "external-app-1",
  "use_model": true,
  "apply_changes": false,
  "verify_command": null,
  "max_files": 4
}
```

### Modes

- `chat`
- `explain`
- `fix`
- `edit`

### Important behavior

- Orexso discovers files first
- it builds a phased plan
- it uses tools internally
- if `apply_changes` is true in edit/fix modes, file snapshots may be created
- rollback information is returned in `rollback_actions`

### Example response

```json
{
  "task_id": "task-123abc",
  "summary": "Execute the request using Orexso's discover-plan-execute-verify loop.",
  "discovered_files": [
    "app/api/routes/chat.py"
  ],
  "plan": {
    "summary": "Execute the request using Orexso's discover-plan-execute-verify loop.",
    "assumptions": [
      "Files are read before any mutation."
    ],
    "steps": [],
    "generated_by": "deterministic"
  },
  "tool_calls": [],
  "verification": [],
  "assistant_message": "Response text",
  "generated_by": "ollama",
  "rollback_actions": []
}
```

## 9. File endpoints

These are useful if another app wants direct file access through Orexso.

### Read file

```text
GET /api/v1/agent/files?path=app/api/app.py
```

### Write file

```text
PUT /api/v1/agent/files
```

Example body:

```json
{
  "path": "notes/example.txt",
  "content": "Hello from another app",
  "create_directories": true
}
```

Write responses may include `snapshot_id`, which can be used for rollback.

## 10. Memory indexing

If your external app wants Orexso to populate Qdrant for better retrieval:

```text
POST /api/v1/agent/memory/index
```

Example body:

```json
{
  "project_id": "default",
  "include_glob": null,
  "limit_files": 400
}
```

## 11. MCP integration

If the other app is an MCP client, use the `/mcp` endpoint.

### Metadata

```bash
curl http://localhost:6005/mcp
```

### JSON-RPC methods

Supported methods:

- `initialize`
- `ping`
- `notifications/initialized`
- `tools/list`
- `tools/call`

### Example initialize

```bash
curl -X POST http://localhost:6005/mcp \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{}}"
```

### Example tools/list

```bash
curl -X POST "http://localhost:6005/mcp?access_mode=limited" \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}"
```

### Example tools/call

```bash
curl -X POST "http://localhost:6005/mcp?access_mode=limited" \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2025-11-25" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"file_search\",\"arguments\":{\"query\":\"chat route\",\"limit\":3}}}"
```

### Full-access note

For risky tools in `full` mode, Orexso may require:

```http
X-Orexso-Full-Access-Approve: true
```

## 12. JavaScript client example

This is the simplest complete example for another app.

```ts
const API_BASE_URL = "http://localhost:6005";
const API_KEY = "your-key";

async function orexsoChat(message: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({
      message,
      session_id: "my-app-session",
      use_model: true,
      history: [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Orexso request failed: ${response.status}`);
  }

  return response.json();
}

const result = await orexsoChat("Explain this codebase");
console.log(result.reply);
```

## 13. Python client example

```python
import requests

API_BASE_URL = "http://localhost:6005"
API_KEY = "your-key"

response = requests.post(
    f"{API_BASE_URL}/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
    },
    json={
        "message": "Explain the backend architecture",
        "session_id": "python-client",
        "use_model": True,
        "history": [],
    },
    timeout=120,
)

response.raise_for_status()
payload = response.json()
print(payload["reply"])
```

## 14. Recommended integration flow

For most external apps, use this sequence:

1. Read `/api/v1/auth/status`
2. Read `/health`
3. Send chat through `/api/v1/chat` if you only need final answers
4. Use `/api/v1/chat/stream` if you need live tokens
5. Save `task_id` from streaming metadata if you want interrupt support
6. Save `task_id`, `session_id`, and `rollback_actions` if you want rollback support

## 15. Common failure cases

### `401 Unauthorized`

Cause:

- API key missing
- API key invalid

Fix:

- send `X-API-Key`
- or send `Authorization: Bearer <key>`

### `404` on interrupt

Cause:

- task already ended
- wrong `task_id`

Fix:

- only interrupt live tasks from streaming metadata

### `404` on rollback

Cause:

- no snapshot-backed change exists for that task or session

Fix:

- only call rollback after a mutation-producing task

### `503` on readiness checks

Cause:

- Ollama warmup or startup not finished

Fix:

- retry `/ready` after a short delay

## 16. Current endpoints summary

Primary endpoints for external apps:

- `GET /health`
- `GET /ready`
- `GET /api/v1/auth/status`
- `POST /api/v1/chat`
- `POST /api/v1/chat/stream`
- `POST /api/v1/agent/task`
- `POST /api/v1/agent/tasks/{task_id}/interrupt`
- `POST /api/v1/agent/rollback`
- `GET /api/v1/agent/overview`
- `GET /api/v1/agent/files`
- `PUT /api/v1/agent/files`
- `POST /api/v1/agent/memory/index`
- `GET /mcp`
- `POST /mcp`

## 17. Practical recommendation

If you are connecting a separate frontend, desktop app, automation worker, or IDE plugin:

- use `/api/v1/chat` for simple answers
- use `/api/v1/chat/stream` for interactive UX
- use `/api/v1/agent/task` for code-agent style operations
- persist `session_id` in your app
- persist `task_id` for live operations
- persist `rollback_actions` if you allow file-changing tasks
