# ZCode Agentic Engine — Master Architecture & Implementation Prompt

## 1. Mission

Build a production-grade **Agentic Software-Engineering Engine** inside the existing **ZCode sandbox**.

ZCode already contains:

* OpenVSCode
* React-based IDE/UI
* Source-code workspace
* Terminal
* Existing project files

The goal is to add a native **Agentic Engine** that can autonomously perform software-engineering tasks from end to end:

```text
Task
→ Understand Repository
→ Build Context
→ Plan
→ Implement
→ Execute
→ Test
→ Diagnose
→ Repair
→ Review
→ Complete
```

The engine must be **model-independent**, **workspace-independent**, **tool-driven**, **workflow-aware**, and **extensible**.

Do NOT build a simple chatbot.

Build an **engineering execution system**.

---

# 2. Core Architectural Principle

Use the following separation:

```text
MODEL
  = intelligence

AGENT
  = reasoning identity + instructions + capabilities

RUNNER
  = model/tool execution loop

WORKFLOW
  = deterministic engineering process

CONTEXT
  = repository and task knowledge

TOOLS
  = capabilities available to the agent

POLICY
  = what the agent is allowed to do

WORKSPACE
  = where actions happen

STATE
  = what has happened

EVENTS
  = observable execution history
```

The Agent must NOT directly depend on:

* OpenAI
* Claude
* Ollama
* Qwen
* Docker
* a specific IDE
* a specific database

All external dependencies must be behind interfaces/adapters.

---

# 3. High-Level Architecture

Implement this architecture:

```text
                         ZCODE SANDBOX
                              │
                              ▼
                    ┌───────────────────┐
                    │     OPENVSCODE    │
                    │   React + IDE UI  │
                    └─────────┬─────────┘
                              │
                     HTTP / WebSocket
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════╗
║                       AGENTIC ENGINE                            ║
║                      Node.js + TypeScript                       ║
║                                                                  ║
║  ┌──────────────┐                                               ║
║  │ TASK SYSTEM  │                                               ║
║  │              │                                               ║
║  │ Task         │                                               ║
║  │ Session      │                                               ║
║  │ Run          │                                               ║
║  │ Approval     │                                               ║
║  └──────┬───────┘                                               ║
║         ▼                                                        ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │                     AGENT RUNTIME                          │ ║
║  │                                                            │ ║
║  │ Reason → Act → Observe → Update Context → Repeat          │ ║
║  └───────────────────────────┬────────────────────────────────┘ ║
║                              │                                   ║
║       ┌──────────────────────┼─────────────────────────┐         ║
║       ▼                      ▼                         ▼         ║
║ ┌──────────────┐      ┌──────────────┐        ┌──────────────┐ ║
║ │   CONTEXT    │      │   WORKFLOW   │        │ MODEL ROUTER │ ║
║ │    ENGINE    │      │    ENGINE    │        │              │ ║
║ └──────────────┘      └──────────────┘        └──────────────┘ ║
║       │                      │                         │         ║
║       │                      │                  ┌──────┼──────┐ ║
║       │                      │                  ▼      ▼      ▼ ║
║       │                      │                Ollama OpenAI Claude
║       │                      │                                 ║
║       └──────────────────────┼─────────────────────────────────║
║                              ▼                                   ║
║                     ┌─────────────────┐                          ║
║                     │  TOOL REGISTRY  │                          ║
║                     └────────┬────────┘                          ║
║                              │                                   ║
║              ┌───────────────┼────────────────┐                  ║
║              ▼               ▼                ▼                  ║
║          CODE TOOLS      EXEC TOOLS      PROJECT TOOLS           ║
║                                                                  ║
║  ┌─────────────┐ ┌──────────────┐ ┌──────────────────────────┐ ║
║  │ Permissions │ │ Middleware   │ │ Events / State /         │ ║
║  │ Policy      │ │ Pipeline     │ │ Checkpoints / Recovery   │ ║
║  └─────────────┘ └──────────────┘ └──────────────────────────┘ ║
╚══════════════════════════════╤═══════════════════════════════════╝
                               │
                               ▼
╔══════════════════════════════════════════════════════════════════╗
║                     WORKSPACE RUNTIME                            ║
║                                                                  ║
║                    Workspace Interface                           ║
║                              │                                   ║
║                 ┌────────────┼────────────┐                      ║
║                 ▼            ▼            ▼                      ║
║              LOCAL        DOCKER       REMOTE                    ║
║             Workspace    Workspace    Workspace                  ║
║                                                                  ║
╚══════════════════════════════╤═══════════════════════════════════╝
                               │
                               ▼
                     ┌──────────────────┐
                     │  DOCKER SANDBOX  │
                     │                  │
                     │ Source           │
                     │ Dependencies     │
                     │ Processes        │
                     │ Tests            │
                     │ Build            │
                     │ Services         │
                     │ Browser          │
                     └──────────────────┘
```

---

# 4. Technology Rules

Use:

```text
Node.js
TypeScript
React
Fastify
WebSocket
Zod
Docker
Git
LSP
Tree-sitter
```

Preferred architecture:

```text
Node.js + TypeScript
        ↓
Agent Engine
        ↓
Workspace API
        ↓
Docker
```

Do NOT introduce Go for v0.1.

Do NOT introduce Kubernetes for v0.1.

Do NOT introduce Kafka/NATS/Temporal for v0.1.

Do NOT introduce unnecessary infrastructure.

First prove the core Agentic Engine.

---

# 5. Agent Engine Core

Implement these core concepts:

```text
Agent
Task
Run
Session
Runner
Workflow
Context
Model
Tool
Workspace
Permission
Policy
Event
Checkpoint
```

These are the primary domain abstractions.

---

# 6. Agent

An Agent represents a reasoning identity.

```ts
interface Agent {
  id: string;
  name: string;

  instructions: string;

  model: ModelRef;

  tools: ToolRef[];

  contextPolicy: ContextPolicy;

  permissionPolicy: PermissionPolicy;
}
```

The Agent must not directly execute filesystem or shell operations.

It requests tools.

---

# 7. Model Abstraction

Create a provider-independent model interface.

```ts
interface Model {
  generate(
    request: ModelRequest
  ): Promise<ModelResponse>;

  stream(
    request: ModelRequest
  ): AsyncIterable<ModelEvent>;
}
```

Implement adapters:

```text
Ollama
OpenAI
Anthropic
Gemini
```

The core engine must not contain provider-specific logic.

Example:

```text
ModelRouter
     │
     ├── OllamaAdapter
     ├── OpenAIAdapter
     ├── AnthropicAdapter
     └── GeminiAdapter
```

The model should be replaceable without changing:

* Agent
* Workflow
* Tools
* Context
* Workspace
* State

---

# 8. Agent Runner

The Runner owns the agent loop.

The basic loop is:

```text
Build Context
      ↓
Call Model
      ↓
Inspect Response
      ↓
Tool Call?
 ┌────┴─────┐
NO         YES
 │           │
 ▼           ▼
DONE     Permission
             ↓
        Execute Tool
             ↓
        Tool Result
             ↓
        Update State
             ↓
        Update Context
             ↓
          Model
```

Implement the loop independently from any model provider.

Pseudo-architecture:

```ts
async function runAgent(run: AgentRun) {
  while (!run.isFinished()) {

    const context =
      await contextEngine.build(run);

    const response =
      await model.generate({
        context,
        tools: toolRegistry.getAvailable(run)
      });

    if (response.isFinal()) {
      return completeRun(response);
    }

    for (const toolCall of response.toolCalls) {

      await permissionEngine.check(toolCall);

      const result =
        await toolRegistry.execute(
          toolCall,
          run
        );

      await stateStore.append(result);
    }
  }
}
```

---

# 9. Workflow Engine

Separate autonomous reasoning from deterministic engineering flow.

The workflow controls:

```text
Understand
Plan
Implement
Test
Debug
Review
Complete
```

Example:

```text
UNDERSTAND
     ↓
PLAN
     ↓
IMPLEMENT
     ↓
TEST
     │
 ┌───┴────┐
 │        │
FAIL     PASS
 │        │
 ▼        ▼
DEBUG   REVIEW
 │        │
 └───┐    ▼
     └──> DONE
```

The Agent controls decisions inside a workflow node.

The Workflow controls the overall engineering lifecycle.

Do NOT make every workflow decision an LLM decision.

---

# 10. Context Engine

The Context Engine is responsible for providing relevant engineering information to the model.

It must support:

```text
Repository Map
Files
Directories
Symbols
AST
LSP
References
Dependencies
Git Changes
Git History
Documentation
Project Rules
Test Results
Compiler Errors
Runtime Errors
Previous Tool Results
Task State
Agent Memory
```

Architecture:

```text
Context Engine
│
├── Repository Scanner
├── Repository Map
├── File Retriever
├── Symbol Index
├── AST Index
├── LSP Integration
├── Dependency Graph
├── Git Context
├── Error Context
├── Test Context
├── Memory
└── Context Compaction
```

Do NOT blindly send the entire repository to the model.

Retrieve relevant context dynamically.

---

# 11. Tool System

Tools must be first-class objects.

```ts
interface Tool {
  name: string;

  description: string;

  inputSchema: ZodSchema;

  permissions: Permission[];

  execute(
    input: unknown,
    context: ToolContext
  ): Promise<ToolResult>;
}
```

Create a Tool Registry.

Initial tools:

```text
CODE
├── read_file
├── write_file
├── apply_patch
├── search_code
├── find_symbol
├── find_reference
└── list_directory

EXECUTION
├── run_command
├── run_process
├── run_test
├── run_lint
└── run_typecheck

GIT
├── git_status
├── git_diff
├── git_log
├── git_branch
└── git_commit

PROJECT
├── package_info
├── dependency_info
├── environment_info
└── project_info
```

Browser tools can be added later.

---

# 12. Permission Engine

Every tool must have permissions.

Example:

```text
READ
WRITE
EXECUTE
NETWORK
GIT
SYSTEM
```

Example:

```text
read_file       → READ
search_code     → READ
write_file      → WRITE
apply_patch     → WRITE
run_command     → EXECUTE
npm_install     → EXECUTE + NETWORK
git_commit      → GIT
```

Permission flow:

```text
Agent
  ↓
Tool Request
  ↓
Permission Engine
  ↓
┌────────┬────────┬─────────┐
│ ALLOW  │  DENY  │ APPROVE │
└────────┴────────┴─────────┘
```

Never allow tools to bypass the permission engine.

---

# 13. Middleware

Create a lightweight middleware pipeline.

```ts
interface Middleware {
  execute(
    context: RunContext,
    next: () => Promise<Result>
  ): Promise<Result>;
}
```

Initial middleware:

```text
Authentication
Authorization
Permission
Context
Budget
Retry
Logging
Telemetry
Error Handling
```

Middleware must be able to observe and/or intercept:

```text
Agent
Model
Tool
Workflow
Workspace
```

---

# 14. Workspace Abstraction

The Agent Engine must never directly depend on Docker.

Create:

```ts
interface Workspace {
  create(): Promise<void>;

  readFile(
    path: string
  ): Promise<string>;

  writeFile(
    path: string,
    content: string
  ): Promise<void>;

  search(
    query: string
  ): Promise<SearchResult[]>;

  execute(
    command: Command
  ): AsyncIterable<ExecutionEvent>;

  gitDiff(): Promise<GitDiff>;

  destroy(): Promise<void>;
}
```

Implement:

```text
LocalWorkspace
DockerWorkspace
RemoteWorkspace
```

Initially implement:

```text
LocalWorkspace
DockerWorkspace
```

RemoteWorkspace is future functionality.

---

# 15. Docker

Docker is the initial isolation boundary.

The Agent Engine should communicate with Docker through the Workspace interface.

```text
Agent
 ↓
Tool
 ↓
Workspace
 ↓
Docker
 ↓
Container
```

The container should contain:

```text
Source Code
Dependencies
Runtime
Build Tools
Tests
Services
Environment
```

Support:

```text
CPU limits
Memory limits
Network policy
Timeouts
Workspace mounts
Environment variables
Process cleanup
Container lifecycle
```

Do not expose unrestricted host access.

---

# 16. State System

Persist:

```text
Task
Session
Run
Workflow State
Agent State
Tool Calls
Tool Results
Model Responses
Context State
Checkpoint
Errors
Approvals
```

The engine must support:

```text
Pause
Resume
Retry
Recover
Replay
Cancel
```

---

# 17. Event System

Everything important must generate events.

Examples:

```text
task.created

run.started
run.completed
run.failed
run.cancelled

agent.started
agent.completed

model.requested
model.streaming
model.completed
model.failed

tool.requested
tool.approval_required
tool.started
tool.output
tool.completed
tool.failed

file.read
file.changed

command.started
command.stdout
command.stderr
command.completed

test.started
test.passed
test.failed

workflow.started
workflow.transitioned
workflow.completed

checkpoint.created
run.paused
run.resumed
```

Event structure:

```ts
interface AgentEvent {
  id: string;

  type: string;

  timestamp: number;

  taskId: string;

  runId: string;

  source: string;

  data: unknown;
}
```

The OpenVSCode UI should consume these events rather than directly depending on internal engine implementation.

---

# 18. OpenVSCode Integration

OpenVSCode is the user interface.

It should communicate with the Agent Engine through:

```text
HTTP
WebSocket
```

The UI should display:

```text
Task
Agent Status
Current Workflow Step
Model Activity
Tool Calls
File Changes
Terminal Output
Tests
Errors
Approvals
Diff
Timeline
```

The UI must not contain core agent logic.

---

# 19. Engineering Loop

The complete system should support:

```text
USER TASK
    ↓
CREATE RUN
    ↓
UNDERSTAND REPOSITORY
    ↓
BUILD CONTEXT
    ↓
PLAN
    ↓
USER APPROVAL (optional)
    ↓
IMPLEMENT
    ↓
RUN TESTS
    ↓
    ┌───────────────┐
    │ TEST RESULT   │
    └───────┬───────┘
            │
       ┌────┴────┐
       ▼         ▼
     FAIL       PASS
       │         │
       ▼         ▼
     DEBUG     REVIEW
       │         │
       └────┐    │
            ▼    ▼
           TEST DONE
                ↓
             SUMMARY
                ↓
              DIFF
                ↓
             COMPLETE
```

The system must support automatic repair loops with configurable limits.

Example:

```text
maxIterations: 20
maxToolCalls: 100
maxExecutionTime: 30m
maxModelCost: configurable
```

---

# 20. Multi-Agent Architecture

Do not start with many agents.

The initial architecture should be:

```text
One Agent
+
Workflow
+
Tools
+
Context
+
Workspace
```

Later support:

```text
Lead Agent
│
├── Coding Agent
├── Testing Agent
├── Review Agent
└── Research Agent
```

Agents should be composable as:

```text
Workflow Nodes
```

or:

```text
Agent-as-Tool
```

Do not create unrestricted agent-to-agent communication.

---

# 21. Model Routing

The Model Router should eventually select models based on task requirements.

Example:

```text
Autocomplete
    → Fast Local Model

Simple Edit
    → Local Qwen

Repository Analysis
    → Strong Coding Model

Complex Debugging
    → Strong Reasoning Model

Architecture
    → Strongest Available Model
```

Do not hard-code model selection inside Agents.

---

# 22. Repository Structure

Use a monorepo:

```text
zcode/
│
├── apps/
│   ├── agent-api/
│   └── openvscode/
│
├── packages/
│   │
│   ├── agent-core/
│   │   ├── agent/
│   │   ├── runner/
│   │   ├── task/
│   │   └── session/
│   │
│   ├── workflow/
│   │   ├── graph/
│   │   ├── executor/
│   │   └── state/
│   │
│   ├── models/
│   │   ├── core/
│   │   ├── ollama/
│   │   ├── openai/
│   │   └── anthropic/
│   │
│   ├── tools/
│   │   ├── core/
│   │   ├── filesystem/
│   │   ├── terminal/
│   │   ├── git/
│   │   └── code/
│   │
│   ├── context/
│   │   ├── repository/
│   │   ├── symbols/
│   │   ├── ast/
│   │   ├── lsp/
│   │   └── memory/
│   │
│   ├── workspace/
│   │   ├── core/
│   │   ├── local/
│   │   └── docker/
│   │
│   ├── permissions/
│   ├── middleware/
│   ├── events/
│   ├── state/
│   └── protocol/
│
├── docker/
│   ├── base/
│   ├── node/
│   ├── python/
│   └── browser/
│
├── schemas/
│
├── tests/
│
└── package.json
```

Adapt this structure to the existing ZCode repository instead of blindly replacing the existing project structure.

---

# 23. v0.1 Scope

Do NOT implement everything at once.

The first working milestone must support:

```text
1. Create Task
2. Create Run
3. Select Model
4. Scan Repository
5. Build Context
6. Read Files
7. Search Code
8. Edit Files
9. Run Commands
10. Run Tests
11. Receive Errors
12. Repair Code
13. Generate Git Diff
14. Show Timeline
15. Complete Task
```

The first successful example should be:

```text
User:
"Fix the failing login test."

Agent:

Understand repository
        ↓
Locate login code
        ↓
Locate failing test
        ↓
Read relevant files
        ↓
Plan fix
        ↓
Modify code
        ↓
Run test
        ↓
Read failure
        ↓
Repair
        ↓
Run test again
        ↓
PASS
        ↓
Review diff
        ↓
Complete
```

---

# 24. Architectural Rules

Follow these rules throughout implementation:

### Rule 1

The Agent Engine must be model-independent.

### Rule 2

The Agent must never directly depend on Docker.

### Rule 3

Tools must be registered, typed and permission-controlled.

### Rule 4

Workflow and Agent reasoning must remain separate.

### Rule 5

Context must be dynamically constructed.

### Rule 6

All meaningful execution must produce events.

### Rule 7

Long-running tasks must be resumable.

### Rule 8

OpenVSCode must remain a client of the engine, not the engine itself.

### Rule 9

External model providers must be adapters.

### Rule 10

Docker must be replaceable through the Workspace abstraction.

### Rule 11

Do not introduce infrastructure that is not required for v0.1.

### Rule 12

Prefer simple TypeScript implementations before adding external frameworks.

### Rule 13

Keep interfaces stable and implementations replaceable.

### Rule 14

Security boundaries must exist before autonomous execution is enabled.

### Rule 15

Every autonomous loop must have configurable limits.

---

# 25. Final Design Philosophy

Build ZCode as:

```text
                  MODEL
              "What should I do?"
                    │
                    ▼
                  AGENT
              "How should I reason?"
                    │
                    ▼
                 RUNNER
              "Execute the loop"
                    │
                    ▼
                WORKFLOW
             "What stage are we in?"
                    │
                    ▼
                 CONTEXT
             "What do we know?"
                    │
                    ▼
                  TOOLS
             "What can we do?"
                    │
                    ▼
                POLICY
            "Are we allowed?"
                    │
                    ▼
               WORKSPACE
              "Where do we act?"
                    │
                    ▼
                 DOCKER
             "Execute safely"
                    │
                    ▼
                  STATE
             "What happened?"
                    │
                    ▼
                 EVENTS
             "What should UI see?"
```

It is a **model-independent Agentic Software-Engineering Engine built natively inside ZCode**, with OpenVSCode as the development environment and Workspace/Docker as the execution boundary.
