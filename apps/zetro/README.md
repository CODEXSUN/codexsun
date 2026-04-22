# Orexso Agentic Tools

Local AI code assistance powered by Orexso API and implemented in the CodeAssist VS Code agent.

## Quick Start

### Prerequisites

1. **Orexso API** running on `http://localhost:6005`
   ```bash
   # Check if Orexso is running
   curl http://localhost:6005/health
   ```

2. **Node.js / TypeScript** environment
   ```bash
   npm install
   npm run build
   ```

### Basic Usage

#### Via Standalone Zetro IDE

```bash
# Run the standalone Zetro IDE server with the built-in frontend
npm run zetro:dev

# One-shot start without watch mode
npm run zetro:start
```

Open `http://localhost:4211`.

#### Via VS Code Agent

1. Open VS Code with this workspace
2. Use agent commands:
   - `AIAssist: Plan` - Analyze code without changes
   - `AIAssist: Write` - Generate code preview
   - `AIAssist: Execute` - Apply changes
   - `AIAssist: Fix` - Find and fix errors
   - `AIAssist: Chat` - Interactive conversation

#### Via TypeScript API

```typescript
import { createAgenticTools, createOrexsoClient } from "./apps/zetro/src/agentic-tools";

const tools = createAgenticTools(undefined, {
  projectId: "default",
  sessionId: "my-session",
});

// Plan phase
const plan = await tools.plan("Create a validation utility");
console.log(plan.plan.steps);

// Write phase
const code = await tools.write("Implement the validation function");
console.log(code.generatedCode);

// Execute phase
const result = await tools.execute("Apply the changes");
console.log(result.appliedChanges);
```

## Architecture

### Components

**1. OrexsoClient** (`apps/zetro/src/orexso-client.ts`)
- Low-level API bindings for Orexso endpoints
- Handles authentication, streaming, and error management
- Supports all endpoints: chat, stream, tasks, files, memory, MCP

**2. AgenticTools** (`apps/zetro/src/agentic-tools.ts`)
- High-level workflow API
- Implements plan-write-execute-verify loop
- Provides streaming and session management
- Supports rollback and interruption

**3. VS Code Integration** (`.agent.md` and `.instructions.md`)
- Agent manifest with commands and configuration
- User-facing instructions and examples
- Session management and context tracking

### Discover-Plan-Execute-Verify Loop

```
┌─────────────────────────────────────────────┐
│ 1. DISCOVER                                 │
│ - Analyze codebase                          │
│ - Find relevant files (up to max_files)     │
│ - Build context                             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ 2. PLAN                                     │
│ - Create execution plan                     │
│ - Define assumptions & steps                │
│ - Preview scope of changes                  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ 3. EXECUTE                                  │
│ - Generate code (write mode)                │
│ - Apply changes (execute mode)              │
│ - Create snapshots for rollback             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│ 4. VERIFY                                   │
│ - Run tests                                 │
│ - Check compilation                         │
│ - Validate changes                          │
└─────────────────────────────────────────────┘
```

## Workflow Modes

### Mode: Plan
```typescript
const plan = await tools.plan("Analyze this code");
// Returns: PlanResult with discovered files and execution plan
// Changes applied: None
// Use when: Understanding impact before making changes
```

### Mode: Write
```typescript
const code = await tools.write("Generate this code");
// Returns: WriteResult with generated code preview
// Changes applied: None
// Use when: Reviewing code before execution
```

### Mode: Execute
```typescript
const result = await tools.execute("Implement this feature");
// Returns: ExecuteResult with applied changes
// Changes applied: Yes (with snapshots for rollback)
// Use when: Ready to modify codebase
```

### Mode: Fix
```typescript
const fixes = await tools.fix("Fix errors in this code");
// Returns: WriteResult with proposed fixes
// Changes applied: None
// Use when: Analyzing and fixing errors
```

### Mode: Chat (Streaming)
```typescript
for await (const chunk of tools.chat("Explain this")) {
  console.log(chunk);
}
// Returns: Streamed text responses
// Changes applied: None
// Use when: Quick questions and exploration
```

## Configuration

### Environment Variables

```bash
# API Configuration
OREXSO_API_URL=http://localhost:6005
OREXSO_API_KEY=optional-api-key

# Agent Configuration
AGENT_PROJECT_ID=default
AGENT_MAX_FILES=4
AGENT_TIMEOUT=120000
AGENT_USE_MODEL=true
```

### VS Code Settings

`.vscode/settings.json`:

```json
{
  "agent.apiUrl": "http://localhost:6005",
  "agent.apiKey": "",
  "agent.timeout": 120000,
  "agent.projectId": "default",
  "agent.useModel": true,
  "agent.maxFiles": 4,
  "agent.sessionPersistence": true,
  "agent.autoHealthCheck": true
}
```

## API Reference

### Creating Clients

```typescript
// With defaults
const tools = createAgenticTools();

// With custom client
const client = createOrexsoClient({
  baseUrl: "http://custom-host:6005",
  apiKey: "your-key",
  timeout: 60000,
});
const tools = createAgenticTools(client);

// With context
const tools = createAgenticTools(undefined, {
  projectId: "my-project",
  sessionId: "session-123",
  activeFile: "src/app.ts",
  selection: "const x = 1;",
});
```

### Planning

```typescript
const plan = await tools.plan(
  "Refactor this function for better performance"
);

// Result properties
plan.taskId          // Unique task identifier
plan.summary         // Summary of the plan
plan.plan.steps      // Array of execution steps
plan.plan.assumptions // Assumptions made
plan.discoveredFiles  // Files that will be analyzed
```

### Writing

```typescript
const result = await tools.write(
  "Generate a React component for user profile"
);

// Result properties
result.taskId           // Task identifier for this write
result.generatedCode    // The generated code
result.rollbackActions  // Available rollback options
result.discoveredFiles  // Files analyzed
```

### Executing

```typescript
const result = await tools.execute(
  "Add authentication middleware to the API"
);

// Result properties
result.taskId          // Task ID for potential rollback
result.appliedChanges  // true if changes were applied
result.verificationStatus // "verified" or "pending"
```

### Streaming

```typescript
// Stream planning updates
for await (const plan of tools.planStream(instruction)) {
  console.log("Summary:", plan.summary);
  console.log("Steps so far:", plan.plan.steps);
}

// Stream chat
for await (const chunk of tools.chat(message)) {
  process.stdout.write(chunk);
}
```

### Session Management

```typescript
// Create new session
tools.createSession("my-session-id");

// Get current context
const context = tools.getContext();

// Update context
tools.setContext({
  activeFile: "src/new-file.ts",
  selection: "selected code...",
});

// Health check
const isHealthy = await tools.healthCheck(3); // Retry 3 times
```

### Rollback & Interruption

```typescript
// Interrupt a running task
await tools.interrupt(taskId);

// Rollback changes
await tools.rollback({
  taskId: "task-123abc",
  // or
  snapshotId: "snap-xyz",
  // or
  gitStashRef: "stash@{0}",
});
```

## Examples

### Example 1: Simple API Integration

```typescript
import { createOrexsoClient } from "./apps/zetro/src/orexso-client";

const client = createOrexsoClient();
const response = await client.chat({
  message: "Explain TypeScript types",
  sessionId: "my-session",
  useModel: true,
});
console.log(response.reply);
```

### Example 2: Full Workflow

```typescript
import { createAgenticTools } from "./apps/zetro/src/agentic-tools";

const tools = createAgenticTools();

// 1. Plan
const plan = await tools.plan("Create a new API endpoint");
console.log("Plan:", plan.plan.steps);

// 2. Write (preview)
const code = await tools.write("Implement the endpoint");
console.log("Preview:", code.generatedCode.substring(0, 200));

// 3. Execute (apply)
const result = await tools.execute("Apply the endpoint implementation");
console.log("Applied:", result.appliedChanges);
```

### Example 3: Streaming with Progress

```typescript
import { streamPlanning } from "./apps/zetro/src/agentic-tools";

const plan = await streamPlanning(
  "Create a validation library",
  (chunk) => process.stdout.write(chunk),
  { activeFile: "src/validators.ts" }
);
console.log("Complete. Task:", plan.taskId);
```

### Example 4: Error Handling

```typescript
const tools = createAgenticTools();

try {
  // Health check with retries
  const isHealthy = await tools.healthCheck(3);
  if (!isHealthy) {
    console.error("Orexso API not available");
    return;
  }

  const result = await tools.execute("Fix the TypeScript errors");
  console.log("Fixed:", result.successMessage);
} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
    // Implement recovery logic
  }
}
```

## Testing

Run the test suite:

```bash
# Run the standalone IDE frontend surface
npm run zetro:start

# Run the standalone IDE in watch mode
npm run zetro:dev

# Run all tests
npm test

# Run Orexso tests specifically
npx tsx --test tests/zetro/agentic-tools.test.ts

# Run examples
npx tsx apps/zetro/src/examples.ts 1  # Run example 1
npx tsx apps/zetro/src/examples.ts    # Run all examples
```

## Performance

- **Small tasks** (< 10 files): 5-15 seconds
- **Medium tasks** (10-50 files): 15-30 seconds
- **Large tasks** (50+ files): 30-120 seconds
- **Streaming**: Real-time token delivery

First request may take longer as model warms up.

## Troubleshooting

### Orexso Not Running

```bash
# Start Orexso (Docker)
docker run -d \
  -p 6005:6005 \
  -e OREXSO_MODEL=qwen2.5-coder:3b \
  orexso

# Or check if running
curl http://localhost:6005/health
```

### Authentication Issues

```bash
# If API key is required
export OREXSO_API_KEY=your-key

# Or set in code
const client = createOrexsoClient({
  apiKey: "your-key",
});
```

### Model Warm-up

```bash
# Check warmup status
curl http://localhost:6005/health | jq .warmup_status

# Wait for warmup_ready: true before using
```

### Timeout Errors

Increase timeout for large files:

```typescript
const client = createOrexsoClient({
  timeout: 300000, // 5 minutes
});
```

## Files Structure

```
apps/zetro/
├── src/
│   ├── orexso-client.ts              # API client
│   ├── agentic-tools.ts              # Workflow tools
│   ├── agentic-tools-memory.ts       # Memory integration
│   ├── project-memory.ts             # Project memory manager
│   ├── codebase-analyzer.ts          # Repository indexer
│   ├── execution-history.ts          # Execution tracking
│   ├── context-cache.ts              # Cache layer
│   ├── quick-reference.ts            # Quick-ref generator
│   ├── memory-boundary.ts            # .ai folder setup
│   └── examples.ts                   # Usage examples
├── tests/
│   └── agentic-tools.test.ts         # Test suite
├── .agent.md                         # Agent manifest
├── .instructions.md                  # User instructions
├── AI_GUIDANCE.md                    # Orexso API docs
└── README.md                         # This file

Root-level (external to Zetro):
├── .ai/                              # Project memory (external)
│   ├── memory/                       # Execution history, patterns, context
│   ├── cache/                        # Cache persistence
│   └── config.json                   # Memory config
├── ASSIST/
│   ├── Execution/TASK.md             # Task #207 tracking
│   └── AI_RULES.md                   # Repository rules
```

## Integration with ASSIST

This implementation follows repository guidelines:

- Task tracking in `ASSIST/Execution/TASK.md` (#207)
- Architecture rules in `ASSIST/AI_RULES.md`
- Ownership: `apps/zetro` owns AI integration
- Clean separation: client, tools, agent, examples
- Session persistence and rollback support

## Next Steps

1. **Verify Orexso is running**: `curl http://localhost:6005/health`
2. **Test the agent**: Use VS Code agent commands
3. **Run examples directly**: `npx tsx apps/zetro/src/examples.ts 1`
4. **Integrate with your workflow**: Use in your development process
5. **Customize configuration**: Adjust `.agent.md` for your needs

## Support Resources

- [Agent Config](./apps/zetro/.agent.md)
- [Agent Instructions](./apps/zetro/.instructions.md)
- [Orexso API Guidance](./apps/zetro/AI_GUIDANCE.md)
- [Examples](./apps/zetro/src/examples.ts)
- [Tests](./apps/zetro/tests/agentic-tools.test.ts)
- [Repository Rules](../../ASSIST/AI_RULES.md)
- [Task Tracking](../../ASSIST/Execution/TASK.md)

## License

[Your License Here]
