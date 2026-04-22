# Zetro Complete Architecture

## Ownership and Boundaries

All Zetro components are owned by `apps/zetro/` and follow standard app shape rules from `ASSIST/AI_RULES.md`.

### Zetro App Structure (Complete)

```
apps/zetro/                          # Zetro app root (owned boundary)
│
├── src/                             # Backend and runtime
│   ├── orexso-client.ts             # Orexso API client with all endpoints
│   ├── agentic-tools.ts             # Core workflow engine (plan/write/execute/fix/chat)
│   ├── agentic-tools-memory.ts      # Memory integration factory
│   ├── project-memory.ts            # Persistent memory manager
│   ├── codebase-analyzer.ts         # Repository indexer and learner
│   ├── execution-history.ts         # Execution tracking helpers
│   ├── context-cache.ts             # In-memory + disk cache layer
│   ├── quick-reference.ts           # Quick-ref generator
│   ├── memory-boundary.ts           # .ai folder setup helper
│   └── examples.ts                  # Usage examples (10 patterns)
│
├── tests/                           # Test suite
│   └── agentic-tools.test.ts       # Core API tests
│
├── .agent.md                        # VS Code agent manifest
├── .instructions.md                 # User-facing instructions
├── AI_GUIDANCE.md                   # Orexso API documentation
└── README.md                        # Complete documentation
```

### External Memory Boundary (Project Root)

```
.ai/                                 # AI-only folder (runtime generated)
├── memory/
│   ├── projects/                    # Project metadata
│   ├── executions/                  # Execution history records
│   ├── patterns/                    # Learned patterns
│   └── context/                     # Session/task context
├── cache/
│   └── cache.json                   # Persistent cache
├── config.json                      # Memory configuration
└── quick-ref.md                     # Generated architecture reference
```

The `.ai/` folder is:
- **Added to `.gitignore`** to prevent committing AI memory
- **Created automatically** by `memory-boundary.ts` on first run
- **Isolated from code** to keep product code clean
- **Persistent across sessions** for continuity

## Component Layers

### Layer 1: API Client (`orexso-client.ts`)

Direct bindings to Orexso REST API:

```typescript
- getHealth()              // Health check
- getAuthStatus()          // Auth info
- chat(request)            // Single chat
- stream(request)          // Streaming chat (SSE)
- executeTask(request)     // Structured agent task
- interruptTask(taskId)    // Interrupt running task
- rollback(options)        // Rollback changes
- readFile(path)           // Read file
- writeFile(request)       // Write file
- indexMemory(request)     // Index for vector search
- callMcpMethod(...)       // MCP integration
```

### Layer 2: Workflow Engine (`agentic-tools.ts`)

High-level discover-plan-execute-verify loop:

```typescript
- plan(instruction)        // Analyze code, no changes
- write(instruction)       // Generate code, preview only
- execute(instruction)     // Apply changes with snapshots
- fix(instruction)         // Identify and fix errors
- chat(message)            // Stream-based conversation
- planStream(...)          // Streaming planning updates
- fullWorkflow(...)        // All 3 phases together
- interrupt/rollback()     // Task management
```

### Layer 3: Memory System

#### ProjectMemory (`project-memory.ts`)

Persistent context across sessions:

```typescript
- recordExecution()        // Track execution lifecycle
- recordPattern()          // Store learned patterns
- setContext()             // Store key-value (scoped)
- getContext()             // Retrieve key-value
- getRecentExecutions()    // Query history
- updateMetadata()         // Update learning status
```

#### CodebaseAnalyzer (`codebase-analyzer.ts`)

Learn from repository structure:

```typescript
- analyze()                // Full codebase scan
- getApp(name)             // Get app info
- getFilesByPattern()      // Find files
- getFilesByLanguage()     // Filter by language
- getOwningApp()           // Who owns a file
- getArchitectureSummary() // Generate overview
```

#### ContextCache (`context-cache.ts`)

Fast lookups with persistence:

```typescript
- set/get/delete           // In-memory cache
- TTL support              // Expiration
- Autosave to disk         // Survives restarts
- Stop/flush()             // Explicit control
```

#### QuickReference (`quick-reference.ts`)

Auto-generated codebase summary:

```typescript
- generateQuickReference() // Scan and create markdown
- loadQuickReference()     // Load from disk
```

### Layer 4: Integration Factory (`agentic-tools-memory.ts`)

Create fully integrated agent:

```typescript
const agent = await createAgentWithMemory(projectPath);

// Unified agent with all systems:
agent.plan()               // Full workflow
agent.memory               // Project memory
agent.cache                // Context cache
agent.quickRef             // Codebase summary string
agent.index                // Repository index object
```

## Data Flow

### Execution Flow

```
User Request
  ↓
Agent Command (plan/write/execute/fix/chat)
  ↓
AgenticTools (workflow engine)
  ↓
ProjectMemory.recordExecution() → .ai/memory/executions/
  ↓
CodebaseAnalyzer (if needed)
  ↓
ContextCache (check recent context)
  ↓
OrexsoClient.executeTask() / .chat() / .stream()
  ↓
Orexso API (http://localhost:6005)
  ↓
Result → Memory Record → Cache → Response to User
```

### Learning Flow

```
Codebase Scan (periodic or on-demand)
  ↓
CodebaseAnalyzer.analyze()
  ↓
RepositoryIndex → QuickReference (.ai/quick-ref.md)
  ↓
ProjectMetadata.learningStatus = "learning" → "learned"
  ↓
Available for context on next request
```

### Memory Persistence

```
Session Start
  ↓
Load .ai/memory/projects/{projectId}.json
  ↓
Load .ai/cache.json
  ↓
Create ContextCache with loaded data
  ↓
User Interactions (record to .ai/memory/...)
  ↓
Autosave to disk every 5s
  ↓
Session End (final flush)
```

## Configuration

### Agent Manifest (`apps/zetro/.agent.md`)

VS Code agent registration:
- Commands: plan, write, execute, fix, chat, memory-status
- Modes: plan, write, execute, chat
- Memory tracking: enabled
- Auto-indexing: enabled

### Instructions (`apps/zetro/.instructions.md`)

User-facing guide:
- Quick start
- Workflow examples
- Configuration options
- Troubleshooting

### Memory Config (`.ai/config.json`)

Runtime memory settings:
- `autoIndex`: Enable background indexing
- `indexIntervalMinutes`: Refresh frequency
- `maxFilesForContext`: Limit context files
- `quickRefTTL`: Cache validity
- `sessionPersistence`: Keep state across runs

## Integration with Repository

### ASSIST Compliance

Zetro respects all repository rules:

- **Task Tracking**: Logged in `ASSIST/Execution/TASK.md` (#207, #208)
- **Architecture Rules**: Follow `ASSIST/AI_RULES.md`
- **Ownership**: Owns AI learning and assistance only
- **Boundaries**: Respects app ownership from rules
- **Pattern Learning**: Learns Node, TypeScript, React patterns
- **Documentation**: Complete docs in `apps/zetro/`

### App Ownership Integration

Zetro can learn from any app:

```typescript
const index = await analyzeCodebase(projectPath);
// Returns info about all apps under apps/
index.appsByName.get("cxapp")      // Get cxapp info
index.ownership.get("file-path")   // Who owns this file
index.getFilesByLanguage("typescript")  // Find TS files
```

## Getting Started

### 1. First-Time Setup

```typescript
import { createAgentWithMemory } from "apps/zetro/src/agentic-tools-memory";

const agent = await createAgentWithMemory(process.cwd());
// Creates .ai/ folder, initializes memory, indexes codebase
```

### 2. Use in Tasks

```typescript
// Plan a refactoring
const plan = await agent.plan("Refactor auth service");
console.log(plan.plan.steps);

// Write preview
const code = await agent.write("Implement new auth flow");
console.log(code.generatedCode);

// Execute when ready
const result = await agent.execute("Apply auth changes");
```

### 3. Check Memory

```typescript
const recent = await agent.memory.getRecentExecutions(5);
console.log("Recent tasks:", recent);

const patterns = await agent.memory.getPatterns();
console.log("Learned patterns:", patterns);
```

### 4. Query Context

```typescript
const quickRef = agent.quickRef;  // Architecture summary
const index = agent.index;        // Full repo analysis

// Find related code
const related = index.getFilesByPattern(/auth/);
const owningApp = index.getOwningApp("src/auth.ts");
```

## Performance Characteristics

- **Cold start**: 5-10s (model warmup, initial index)
- **Warm cached**: < 2s
- **Small tasks**: 5-15s
- **Large codebase**: 30-120s
- **Cache hits**: < 100ms
- **Memory per session**: ~50-200MB

## Future Extensions

Potential enhancements within `apps/zetro/` boundaries:

1. **Vector Embeddings** - Qdrant integration for semantic search
2. **Pattern Mining** - Auto-discover anti-patterns and code smells
3. **Dependency Analysis** - Build dep graphs for impact analysis
4. **Performance Profiling** - Suggest optimizations
5. **Test Generation** - Auto-generate unit tests
6. **Documentation** - Keep docs in sync with code
7. **Team Memory** - Shared patterns across team sessions

All within app boundaries, respecting ASSIST rules.

## See Also

- [Zetro README](./README.md)
- [Agent Manifest](./apps/zetro/.agent.md)
- [User Instructions](./apps/zetro/.instructions.md)
- [API Examples](./apps/zetro/src/examples.ts)
- [Test Suite](./apps/zetro/tests/agentic-tools.test.ts)
- [Repository Rules](../../ASSIST/AI_RULES.md)
