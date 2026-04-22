# Zetro Quick Start

Get Zetro up and running in 3 steps.

## Prerequisites

1. **Orexso running locally**
   ```bash
   curl http://localhost:6005/health
   ```
   If not running, start it with Docker or local installation.

2. **Node.js and npm installed**
   ```bash
   node --version
   npm --version
   ```

## Step 1: Initialize Zetro

```bash
npx tsx apps/zetro/src/init.ts
```

### Run The Zetro IDE

```bash
# Watch mode for the standalone server and frontend
npm run zetro:dev

# One-shot start
npm run zetro:start
```

Then open `http://localhost:4211`.

This will:
- Create `.ai/` folder structure for memory
- Scan and index your codebase
- Generate architecture quick-reference
- Validate Orexso connection
- Create initialization report

**Output:**
```
🚀 Initializing Zetro...

📁 Setting up memory boundary (.ai/)...
   ✓ Memory folders created

💾 Initializing project memory...
   ✓ Project memory initialized

🔍 Analyzing codebase...
   ✓ Found 15 apps
   ✓ Indexed 2500 files
   ✓ Languages: typescript, javascript, python
   ✓ Frameworks: react, express, node

...

✅ Zetro initialized: SUCCESS
```

Report saved to: `.ai/init-report.json`

## Step 2: Use in VS Code

1. Open VS Code
2. Access Zetro commands:
   - **Zetro: Chat** - Ask questions about your codebase
   - **Zetro: Plan** - Analyze code before changes
   - **Zetro: Write** - Generate code preview
   - **Zetro: Execute** - Apply code changes
   - **Zetro: Fix** - Find and fix errors
   - **Zetro: Memory Status** - View memory/cache

## Step 3: Use in Code

```typescript
import { createAgentWithMemory } from "./apps/zetro/src/agentic-tools-memory";

// Initialize agent
const agent = await createAgentWithMemory(process.cwd());

// Use workflows
const plan = await agent.plan("Create authentication service");
console.log("Plan:", plan.plan.steps);

const code = await agent.write("Implement the service");
console.log("Code:", code.generatedCode);

// Access memory
const recent = await agent.memory.getRecentExecutions(5);
console.log("Recent tasks:", recent);

// Query codebase
console.log("Architecture:", agent.quickRef);
const apps = agent.index.apps;
```

## Common Tasks

### Chat with Your Codebase

```bash
npm run zetro:chat "Explain the authentication flow"
```

### Check Memory Status

```bash
npm run zetro:memory
```

### Run Tests

```bash
npm run zetro:test
```

### Regenerate Quick Reference

```bash
npm run zetro:index
```

## Configuration

Edit `.ai/config.json`:

```json
{
  "projectId": "default",
  "autoIndex": true,
  "indexIntervalMinutes": 60,
  "maxFilesForContext": 50,
  "quickRefTTLMinutes": 60,
  "sessionPersistence": true
}
```

## Troubleshooting

### Orexso Not Found

```bash
# Check if running
curl http://localhost:6005/health

# Set custom URL
export OREXSO_API_URL=http://your-server:6005
npx tsx apps/zetro/src/init.ts
```

### Memory Issues

```bash
# Clear memory
rm -rf .ai/memory

# Reinitialize
npx tsx apps/zetro/src/init.ts
```

### Cache Issues

```bash
# Clear cache
npm run zetro:cache-clear
```

## Next Steps

1. ✅ Initialize: `npx tsx apps/zetro/src/init.ts`
2. 💬 Chat: Try asking questions in VS Code
3. 📋 Plan: Use Zetro: Plan for refactoring tasks
4. 💾 Track: Check memory with Zetro: Memory Status
5. 🚀 Build: Use Zetro: Execute for confident changes

## Documentation

- [Complete Architecture](./COMPLETE_ARCHITECTURE.md)
- [Agent Configuration](../.agent.md)
- [API Examples](./src/examples.ts)
- [Test Suite](./tests/agentic-tools.test.ts)

## Support

- **Issue with Orexso?** Check `apps/zetro/AI_GUIDANCE.md`
- **Architecture questions?** See `ASSIST/AI_RULES.md`
- **More examples?** Run `npx tsx apps/zetro/src/examples.ts`

---

**Questions?** Start with `npx tsx apps/zetro/src/init.ts` and check the initialization report.
