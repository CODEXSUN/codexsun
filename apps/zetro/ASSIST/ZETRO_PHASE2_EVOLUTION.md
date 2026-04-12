# Zetro Phase 2: Evolution Plan

## Executive Summary

You've built a **governance framework**. Phase 2 transforms it into a **controlled AI workforce** with memory, intelligence, and tiered autonomy.

## Current State Assessment

| Component             | Status      | Notes                                  |
| --------------------- | ----------- | -------------------------------------- |
| Governance            | ✅ Complete | Runtime lock, approvals, audit         |
| Execution             | ⚠️ Manual   | CLI runner exists, disabled by default |
| Loop Control          | ✅ Complete | Max iterations, timeout, cancel        |
| Review                | ✅ Complete | 8 lanes, parsing, severity mapping     |
| Memory                | ❌ None     | Runs are history, no semantic search   |
| Task Intelligence     | ❌ None     | No decomposition, no planning          |
| Multi-Model Routing   | ❌ None     | All tasks go to one provider           |
| Agent Specialization  | ❌ None     | Single mode for everything             |
| External Integrations | ❌ None     | No GitHub, Slack, etc.                 |

## Phase 2 Roadmap

### 2.1.0 — Semantic Memory Layer

**Goal:** Give Zetro long-term memory beyond raw history.

**Deliverables:**

1. Embedding service (configurable: pgvector, chroma, or simple TF-IDF fallback)
2. Memory table: `zetro_memory_vectors`
3. `storeFindingEmbedding(finding)` — embed finding and store
4. `searchSimilarFindings(query)` — semantic search
5. Link findings to memory for "have we seen this?" queries
6. Dashboard memory panel showing related findings

**Key Design Decisions:**

- Embedding provider configurable (local Ollama, OpenAI, or Anthropic)
- Fallback to keyword search if embeddings unavailable
- Memory linked to `runId` + `findingId` for traceability

**Files to Create/Modify:**

```
- apps/zetro/database/table-names.ts         (add: memoryVectors)
- apps/zetro/database/migration/12-zetro-memory.ts
- apps/zetro/src/services/memory-service.ts  (NEW)
- apps/zetro/src/services/index.ts          (export memory-service)
- apps/zetro/src/terminal.ts               (add: memory, search commands)
- apps/api/src/internal/zetro-routes.ts     (add: /zetro/memory/* routes)
- apps/zetro/web/src/api/zetro-api.ts      (add: memory hooks)
- apps/zetro/web/src/pages/memory-page.tsx  (NEW)
```

**Verification:**

```powershell
npm.cmd run typecheck
npm.cmd run zetro -- doctor
# Test: create finding, verify embedding stored
```

---

### 2.2.0 — Smart Playbooks with Conditional Logic

**Goal:** Playbooks that adapt based on context, not just static phases.

**Deliverables:**

1. Extend `ZetroPlaybookPhase`:
   - `conditions: ZetroPhaseCondition[]` (when to skip/go-to)
   - `dynamicCommands: ZetroDynamicCommand[]` (AI-generated steps)
   - `onFailure: "stop" | "skip" | "retry"`

2. New playbook kind: `"smart"`
   - Can generate steps dynamically from LLM
   - Conditional branching based on results

3. Execution engine for smart phases:
   - `evaluateCondition(condition, context)` → boolean
   - `generateDynamicSteps(prompt, context)` → Command[]
   - `handleFailure(phase, error)` → Action

4. Dashboard: Smart playbook editor with condition builder

**Condition Types:**

```typescript
type ZetroPhaseCondition = {
  field:
    | "severity"
    | "findingCount"
    | "outputContains"
    | "commandSuccess"
    | "timeElapsed";
  operator: "eq" | "ne" | "gt" | "lt" | "contains" | "notContains";
  value: string | number;
};
```

**Files to Create/Modify:**

```
- apps/zetro/shared/playbook-contracts.ts   (extend ZetroPlaybookPhase)
- apps/zetro/shared/static-playbooks.ts     (add smart playbook examples)
- apps/zetro/src/services/playbook-service.ts (add: evaluateCondition, generateDynamicSteps)
- apps/zetro/src/services/run-service.ts     (add: executeSmartPhase)
- apps/zetro/src/terminal.ts               (add: create-playbook, smart commands)
```

**Verification:**

```powershell
# Create smart playbook
npm.cmd run zetro -- create-playbook --kind smart --name "Adaptive Code Review"
# Verify conditional phases execute correctly
```

---

### 2.3.0 — Multi-Model Task Router

**Goal:** Route tasks to optimal model based on task type.

**Deliverables:**

1. Task type taxonomy:
   - `reasoning` (deep analysis, planning)
   - `coding` (code generation, refactoring)
   - `review` (code review, security scan)
   - `creative` (documentation, explanations)
   - `fast` (simple queries, quick fixes)

2. Router service:
   - `classifyTask(input)` → TaskType
   - `routeToModel(taskType, input)` → ModelResponse
   - `fallbackModel(taskType)` → Model (if primary fails)

3. Model routing map (configurable):

   ```
   reasoning  → anthropic (claude)
   coding     → openai (gpt-4)
   review     → anthropic (claude)
   creative   → openai (gpt-4)
   fast       → ollama (llama3.2)
   local      → ollama
   ```

4. Cost tracking per task type
5. Dashboard: Model routing analytics

**Files to Create/Modify:**

```
- apps/zetro/src/services/task-router-types.ts     (NEW: TaskType enum, routing rules)
- apps/zetro/src/services/task-router-service.ts   (NEW: classify, route, fallback)
- apps/zetro/src/services/model-provider-service.ts (extend: route method)
- apps/zetro/src/services/settings-service.ts      (add: routing map to settings)
- apps/zetro/src/terminal.ts                     (add: router-info, router-test)
- apps/api/src/internal/zetro-routes.ts           (add: /zetro/router/* routes)
```

**Verification:**

```
# Route "explain this architecture" → claude
# Route "write a React component" → gpt-4
# Route "scan for SQL injection" → claude
# Verify correct model used in each case
```

---

### 2.4.0 — Agent Role Specialization

**Goal:** Multiple specialized agents working under Zetro governance.

**Deliverables:**

1. Agent roles:
   - `PlannerAgent` — Decomposes tasks, creates execution plans
   - `ExecutorAgent` — Runs approved commands, reports results
   - `ReviewerAgent` — Reviews output, generates findings
   - `CoordinatorAgent` — Orchestrates other agents (future)

2. Agent service:
   - `createAgent(role, config)` → Agent
   - `runAgent(agent, input)` → AgentResult
   - Each agent has its own output mode and provider

3. Integrate with existing:
   - Loop service (agents run in controlled loops)
   - Review lanes (ReviewerAgent outputs to lanes)
   - Command proposals (ExecutorAgent submits proposals)

4. Dashboard: Agent activity monitor

**Agent Communication:**

```
User → Coordinator (if exists) or Planner
Planner → Executor (via approved commands)
Executor → Reviewer (output)
Reviewer → Findings (to Zetro)
Zetro → User (governed results)
```

**Files to Create/Modify:**

```
- apps/zetro/src/services/agent-types.ts           (NEW: AgentRole, AgentConfig, AgentResult)
- apps/zetro/src/services/agent-service.ts         (NEW: createAgent, runAgent, agent registry)
- apps/zetro/src/services/planner-agent.ts         (NEW: PlannerAgent implementation)
- apps/zetro/src/services/executor-agent.ts         (NEW: ExecutorAgent implementation)
- apps/zetro/src/services/reviewer-agent.ts         (NEW: ReviewerAgent implementation)
- apps/zetro/src/services/loop-service.ts          (extend: agent loop mode)
- apps/zetro/database/table-names.ts              (add: agentStates, agentLogs)
- apps/zetro/database/migration/13-zetro-agents.ts
- apps/zetro/src/terminal.ts                      (add: agent commands)
- apps/zetro/web/src/pages/agents-page.tsx        (NEW)
```

**Verification:**

```
# Create code review run
# Planner decomposes into: scan files → run tests → review output
# Executor runs each step
# Reviewer generates findings
# All governed by Zetro policies
```

---

### 2.5.0 — Tiered Autonomy System

**Goal:** Scale from fully manual to semi-autonomous based on risk.

**Deliverables:**

1. Autonomy levels:
   - `manual` (current): All commands require approval
   - `assisted`: Low-risk auto-approved, high-risk needs approval
   - `supervised`: Auto-run with live operator monitoring
   - `autonomous`: Auto-run with post-run review

2. Risk classification:
   - read-only commands (`ls`, `cat`, `git status`) → auto
   - build/test commands → assisted
   - file modifications → supervised
   - destructive commands (`rm`, `DROP TABLE`) → manual
   - git push/merge → manual

3. Autonomy service:
   - `classifyRisk(command)` → RiskLevel
   - `getAutonomyLevel(runId)` → AutonomyLevel
   - `shouldAutoApprove(command)` → boolean
   - `logAutonomyDecision(command, decision, reason)`

4. Dashboard:
   - Autonomy level selector per run
   - Auto-approval log
   - Risk override controls

**Auto-Approval Rules:**

```typescript
const autoApproveRules = [
  { pattern: /^git (status|log|diff|show)/, level: "auto" },
  { pattern: /^npm (run )?(build|test|lint|typecheck)/, level: "assisted" },
  { pattern: /^ls|cd|cat|head|tail|grep/, level: "auto" },
  { pattern: /^rm (-rf)?/, level: "manual" },
  { pattern: /^DROP|DELETE FROM.*WHERE.*=/, level: "manual" },
];
```

**Files to Create/Modify:**

```
- apps/zetro/src/services/autonomy-types.ts           (NEW: AutonomyLevel, RiskLevel, AutoApproveRule)
- apps/zetro/src/services/autonomy-service.ts         (NEW: classifyRisk, shouldAutoApprove, logDecision)
- apps/zetro/src/services/command-proposal-service.ts (extend: auto-approve logic)
- apps/zetro/src/services/settings-service.ts          (add: autonomy level to settings)
- apps/zetro/src/services/run-service.ts              (extend: run with autonomy level)
- apps/zetro/database/table-names.ts                 (add: autonomyLogs)
- apps/zetro/database/migration/14-zetro-autonomy.ts
- apps/zetro/src/terminal.ts                         (add: autonomy commands)
- apps/zetro/web/src/pages/runs-page.tsx             (add: autonomy selector)
```

**Verification:**

```
# Run with autonomy=assisted
# git status → auto-approved
# npm run build → auto-approved
# rm -rf src → blocked
# npm run db:migrate → needs approval
```

---

### 2.6.0 — Task Integration Layer

**Goal:** Connect findings to actionable tasks in the existing Task app.

**Deliverables:**

1. Task integration service:
   - `createTaskFromFinding(finding)` → taskId
   - `linkFindingToTask(findingId, taskId)`
   - `getTasksForRun(runId)` → Task[]
   - `syncFindingStatusWithTask(finding, task)`

2. Auto-task creation rules:
   - critical finding → auto-create task
   - high finding → suggest task
   - medium/low → manual option

3. Task templates for findings:
   - Security Fix template
   - Performance Optimization template
   - Test Coverage template
   - Documentation Update template

4. Dashboard:
   - "Create Task" button on findings
   - Task link badge on finding cards
   - Run → Tasks view

**Integration with existing task app:**

```
zetro/finding-service.ts → calls → task/instantiateTaskTemplate()
zetro/review-service.ts → creates → task/entity_links
```

**Files to Create/Modify:**

```
- apps/zetro/src/services/task-integration-service.ts  (NEW)
- apps/zetro/src/services/finding-service.ts           (extend: linkToTask)
- apps/zetro/src/services/review-service.ts            (extend: createTaskFromReview)
- apps/zetro/src/terminal.ts                          (add: create-task-from-finding, link-task)
- apps/api/src/internal/zetro-routes.ts               (add: /zetro/task/* routes)
- apps/zetro/web/src/api/zetro-api.ts                (add: task integration hooks)
- apps/zetro/web/src/pages/findings-page.tsx         (add: Create Task button)
```

**Verification:**

```
# Create critical security finding
# Click "Create Task" → Security Fix task created in Task app
# Task linked to finding
# Complete task → finding status auto-updates to "fixed"
```

---

### 2.7.0 — External Integration Layer

**Goal:** Connect Zetro to external systems for notifications and sync.

**Deliverables:**

1. Webhook system:
   - `triggerWebhook(event, payload)`
   - Webhook table: `zetro_webhooks`
   - Supported events:
     - `finding.created`
     - `finding.critical`
     - `run.completed`
     - `run.failed`
     - `proposal.approved`
     - `proposal.rejected`

2. GitHub integration:
   - `createGitHubIssue(finding)` → issueUrl
   - `linkRunToPR(runId, prNumber)`
   - `postRunSummaryToPR(run, summary)`

3. Slack/notification integration:
   - `sendSlackAlert(message, channel)`
   - Digest mode (batch notifications)

4. API triggers:
   - `POST /zetro/webhooks/trigger` → manual webhook
   - `GET /zetro/run/<id>/export` → export run summary

5. Dashboard:
   - Webhook configuration panel
   - Integration status monitor
   - Test webhook button

**Files to Create/Modify:**

```
- apps/zetro/src/services/webhook-types.ts          (NEW: WebhookEvent, WebhookConfig)
- apps/zetro/src/services/webhook-service.ts        (NEW: trigger, register, list)
- apps/zetro/src/services/github-service.ts          (NEW: createIssue, postComment)
- apps/zetro/src/services/slack-service.ts          (NEW: sendAlert, sendDigest)
- apps/zetro/database/table-names.ts               (add: webhooks)
- apps/zetro/database/migration/15-zetro-webhooks.ts
- apps/zetro/src/services/run-service.ts            (extend: trigger webhooks on events)
- apps/zetro/src/services/finding-service.ts        (extend: trigger on critical findings)
- apps/zetro/src/terminal.ts                       (add: webhook commands)
- apps/zetro/web/src/pages/settings-page.tsx        (add: webhook config)
```

**Verification:**

```
# Create critical finding
# Webhook fires → Slack notification
# GitHub issue created
# Run completed → PR comment posted
```

---

## Implementation Order

```
2.1.0  Memory Layer          ← Priority: HIGH (foundation)
2.2.0  Smart Playbooks       ← Priority: HIGH (enables intelligence)
2.3.0  Multi-Model Router    ← Priority: MEDIUM (optimization)
2.4.0  Agent Roles           ← Priority: MEDIUM (specialization)
2.5.0  Tiered Autonomy       ← Priority: HIGH (scale)
2.6.0  Task Integration      ← Priority: MEDIUM (leverage existing)
2.7.0  External Integration  ← Priority: LOW (nice-to-have)
```

## Questions for You

1. **Memory Backend**: Which embedding provider do you want?
   - Ollama (local, free) — simplest setup
   - OpenAI (best quality, costs money)
   - pgvector (self-hosted, good balance)

2. **Autonomy Default**: What should the default autonomy level be?
   - `manual` (current) — safest
   - `assisted` — balanced
   - `supervised` — most productive

3. **Agent Roles**: Start with which role?
   - PlannerAgent (decomposition)
   - ExecutorAgent (command execution)
   - ReviewerAgent (finding generation)

4. **External Integration Priority**: Which first?
   - GitHub (issues + PR comments)
   - Slack (notifications)
   - Both

---

## What's NOT in Phase 2

- Full autonomous loop (needs all safety layers first)
- Vector DB cluster (simple memory first)
- Multi-agent coordination (single agents first)
- Real-time streaming (batch first)

---

## Commit Strategy

Each sub-phase commits independently:

```
feat(zetro): memory-layer-embeddings
feat(zetro): smart-playbooks-conditional-logic
feat(zetro): multi-model-task-router
feat(zetro): agent-role-planner
feat(zetro): tiered-autonomy-system
feat(zetro): task-integration
feat(zetro): external-webhooks
```

---

## Summary: New Files to Create

```
apps/zetro/
├── src/services/
│   ├── memory-service.ts           # 2.1.0
│   ├── task-router-types.ts        # 2.3.0
│   ├── task-router-service.ts      # 2.3.0
│   ├── agent-types.ts             # 2.4.0
│   ├── agent-service.ts            # 2.4.0
│   ├── planner-agent.ts            # 2.4.0
│   ├── executor-agent.ts            # 2.4.0
│   ├── reviewer-agent.ts            # 2.4.0
│   ├── autonomy-types.ts           # 2.5.0
│   ├── autonomy-service.ts          # 2.5.0
│   ├── task-integration-service.ts  # 2.6.0
│   ├── webhook-types.ts            # 2.7.0
│   ├── webhook-service.ts           # 2.7.0
│   ├── github-service.ts            # 2.7.0
│   └── slack-service.ts             # 2.7.0
├── database/migration/
│   ├── 12-zetro-memory.ts         # 2.1.0
│   ├── 13-zetro-agents.ts         # 2.4.0
│   ├── 14-zetro-autonomy.ts        # 2.5.0
│   └── 15-zetro-webhooks.ts        # 2.7.0
└── web/src/pages/
    ├── memory-page.tsx              # 2.1.0
    └── agents-page.tsx              # 2.4.0
```

## Summary: Existing Files to Modify

```
apps/zetro/
├── database/table-names.ts         # 2.1, 2.4, 2.5, 2.7
├── shared/playbook-contracts.ts   # 2.2
├── shared/static-playbooks.ts      # 2.2
├── src/services/
│   ├── index.ts                    # export new services
│   ├── playbook-service.ts         # 2.2
│   ├── run-service.ts              # 2.2, 2.5, 2.7
│   ├── finding-service.ts          # 2.6, 2.7
│   ├── review-service.ts           # 2.6
│   ├── model-provider-service.ts   # 2.3
│   ├── command-proposal-service.ts # 2.5
│   └── settings-service.ts        # 2.3, 2.5
├── src/terminal.ts                 # 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
└── web/src/
    ├── api/zetro-api.ts            # 2.1, 2.3, 2.4, 2.5, 2.6, 2.7
    ├── pages/
    │   ├── findings-page.tsx        # 2.6
    │   └── runs-page.tsx           # 2.5
    └── workspace-sections.tsx       # 2.1, 2.4

apps/api/src/internal/zetro-routes.ts # 2.1, 2.3, 2.6
```

---

**Ready to execute?** Tell me which sub-phase to start with and I'll begin implementation.
