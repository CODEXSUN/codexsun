import type { ZetroOutputModeId } from "./output-modes.js";

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
  | "smart";

export type ZetroRiskLevel = "low" | "medium" | "high" | "critical";

export type ZetroPlaybookStatus = "draft" | "active" | "paused" | "retired";

export type ZetroConditionField =
  | "severity"
  | "findingCount"
  | "criticalFindingCount"
  | "outputContains"
  | "outputNotContains"
  | "commandSuccess"
  | "commandFailed"
  | "timeElapsed"
  | "iterationNumber"
  | "riskLevel";

export type ZetroConditionOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith";

export type ZetroPhaseCondition = {
  id: string;
  field: ZetroConditionField;
  operator: ZetroConditionOperator;
  value: string | number | boolean;
};

export type ZetroConditionLogic = "AND" | "OR";

export type ZetroConditionGroup = {
  id: string;
  conditions: ZetroPhaseCondition[];
  logic: ZetroConditionLogic;
};

export type ZetroPhaseConditionConfig = {
  skipIf?: ZetroConditionGroup;
  requireIf?: ZetroConditionGroup;
  gotoIf?: {
    condition: ZetroConditionGroup;
    targetPhaseId: string;
  };
};

export type ZetroDynamicCommandTemplate = {
  id: string;
  prompt: string;
  provider?: "ollama" | "openai" | "anthropic";
  model?: string;
  outputParsing?: "json" | "lines" | "single";
};

export type ZetroPhaseFailureAction = "stop" | "skip" | "retry" | "fallback";

export type ZetroPhaseRetryConfig = {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
};

export type ZetroPlaybookPhase = {
  id: string;
  name: string;
  objective: string;
  expectedOutput: string;
  approvalGate: boolean;
  isConditional?: boolean;
  conditionConfig?: ZetroPhaseConditionConfig;
  dynamicCommands?: ZetroDynamicCommandTemplate[];
  onFailure?: ZetroPhaseFailureAction;
  retryConfig?: ZetroPhaseRetryConfig;
};

export type ZetroPlaybook = {
  id: string;
  name: string;
  kind: ZetroPlaybookKind;
  family: string;
  summary: string;
  description: string;
  defaultOutputMode: ZetroOutputModeId;
  riskLevel: ZetroRiskLevel;
  requiresApproval: boolean;
  status: ZetroPlaybookStatus;
  phases: ZetroPlaybookPhase[];
  reviewLanes: string[];
  isSmart?: boolean;
  smartConfig?: {
    enableDynamicSteps: boolean;
    maxDynamicSteps: number;
    adaptiveBranching: boolean;
  };
};

export type ZetroGuardrailTemplate = {
  id: string;
  name: string;
  event:
    | "session-start"
    | "before-plan"
    | "before-command"
    | "before-write"
    | "before-review"
    | "before-complete"
    | "stop";
  severity: "info" | "warning" | "blocking";
  summary: string;
};

export type ZetroSampleRun = {
  id: string;
  title: string;
  playbookId: string;
  status:
    | "draft"
    | "queued"
    | "awaiting-approval"
    | "running"
    | "blocked"
    | "completed"
    | "failed"
    | "cancelled";
  outputMode: ZetroOutputModeId;
  summary: string;
};

export type ZetroSampleFinding = {
  id: string;
  runId?: string;
  title: string;
  category:
    | "bug"
    | "test"
    | "security"
    | "type-design"
    | "simplification"
    | "convention"
    | "ui"
    | "architecture";
  severity: "critical" | "high" | "medium" | "low" | "info";
  confidence: number;
  status: "open" | "accepted" | "dismissed" | "fixed" | "task-created";
  summary: string;
};

export type ZetroSmartPhaseContext = {
  runId: string;
  iteration: number;
  previousOutput?: string;
  previousCommandSuccess?: boolean;
  severityCounts?: Record<string, number>;
  elapsedMs?: number;
  findings?: Array<{ severity: string; title: string }>;
};

export type ZetroPhaseEvaluationResult = {
  phaseId: string;
  shouldExecute: boolean;
  shouldSkip: boolean;
  shouldGoto?: string;
  reason: string;
  evaluatedConditions: Array<{
    conditionId: string;
    passed: boolean;
    actual: string | number | boolean;
    expected: string | number | boolean;
  }>;
};
