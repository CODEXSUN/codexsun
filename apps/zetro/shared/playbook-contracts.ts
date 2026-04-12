import type { ZetroOutputModeId } from "./output-modes.js"

export type ZetroPlaybookKind =
  | "workflow"
  | "command"
  | "agent"
  | "skill"
  | "hook"
  | "mcp"
  | "output-style"
  | "review"
  | "guardrail"

export type ZetroRiskLevel = "low" | "medium" | "high" | "critical"

export type ZetroPlaybookStatus = "draft" | "active" | "paused" | "retired"

export type ZetroPlaybookPhase = {
  id: string
  name: string
  objective: string
  expectedOutput: string
  approvalGate: boolean
}

export type ZetroPlaybook = {
  id: string
  name: string
  kind: ZetroPlaybookKind
  family: string
  summary: string
  description: string
  defaultOutputMode: ZetroOutputModeId
  riskLevel: ZetroRiskLevel
  requiresApproval: boolean
  status: ZetroPlaybookStatus
  phases: ZetroPlaybookPhase[]
  reviewLanes: string[]
}

export type ZetroGuardrailTemplate = {
  id: string
  name: string
  event: "session-start" | "before-plan" | "before-command" | "before-write" | "before-review" | "before-complete" | "stop"
  severity: "info" | "warning" | "blocking"
  summary: string
}

export type ZetroSampleRun = {
  id: string
  title: string
  playbookId: string
  status: "draft" | "queued" | "awaiting-approval" | "running" | "blocked" | "completed" | "failed" | "cancelled"
  outputMode: ZetroOutputModeId
  summary: string
}

export type ZetroSampleFinding = {
  id: string
  runId?: string
  title: string
  category: "bug" | "test" | "security" | "type-design" | "simplification" | "convention" | "ui" | "architecture"
  severity: "critical" | "high" | "medium" | "low" | "info"
  confidence: number
  status: "open" | "accepted" | "dismissed" | "fixed" | "task-created"
  summary: string
}
