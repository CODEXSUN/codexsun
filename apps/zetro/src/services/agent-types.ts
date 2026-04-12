import type { ZetroTaskType } from "./task-router-types.js";

export type ZetroAgentRole =
  | "planner"
  | "executor"
  | "reviewer"
  | "coordinator";

export type ZetroAgentStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type ZetroAgentOutputModeId =
  | "brief"
  | "normal"
  | "detailed"
  | "maximum"
  | "audit";

export type ZetroAgentTaskInput = {
  id: string;
  type: "plan" | "execute" | "review";
  description: string;
  context?: Record<string, unknown>;
};

export type ZetroAgentTaskOutput = {
  id: string;
  agentId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
  tokens?: number;
  cost?: number;
};

export type ZetroAgentConfig = {
  id: string;
  role: ZetroAgentRole;
  name: string;
  description: string;
  outputMode: ZetroAgentOutputModeId;
  provider:
    | "ollama-local"
    | "openai"
    | "anthropic"
    | "custom-openai-compatible"
    | "none";
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  taskTypes?: ZetroTaskType[];
};

export type ZetroAgentState = {
  id: string;
  role: ZetroAgentRole;
  name: string;
  status: ZetroAgentStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  currentTaskId?: string;
  lastError?: string;
};

export type ZetroAgentLogEntry = {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type ZetroAgentResult = {
  success: boolean;
  taskId: string;
  agentId: string;
  output?: unknown;
  findings?: Array<{
    title: string;
    severity: string;
    category: string;
    summary: string;
  }>;
  commands?: Array<{
    command: string;
    args: string[];
    summary: string;
  }>;
  error?: string;
  durationMs: number;
};

export type ZetroAgentPlanStep = {
  id: string;
  order: number;
  description: string;
  estimatedTokens?: number;
  dependsOn?: string[];
  status: "pending" | "in-progress" | "completed" | "skipped" | "failed";
};

export type ZetroAgentPlan = {
  id: string;
  taskDescription: string;
  steps: ZetroAgentPlanStep[];
  createdAt: string;
  status: "draft" | "approved" | "rejected" | "completed";
};

export const ZETRO_AGENT_ROLE_SUMMARY: Record<ZetroAgentRole, string> = {
  planner: "Decomposes tasks, creates execution plans",
  executor: "Runs approved commands, reports results",
  reviewer: "Reviews output, generates findings",
  coordinator: "Orchestrates other agents",
};

export const DEFAULT_AGENT_CONFIGS: ZetroAgentConfig[] = [
  {
    id: "planner-default",
    role: "planner",
    name: "Planner Agent",
    description: "Decomposes complex tasks into executable steps",
    outputMode: "maximum",
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    temperature: 0.7,
    taskTypes: ["reasoning", "coding"],
  },
  {
    id: "executor-default",
    role: "executor",
    name: "Executor Agent",
    description: "Executes approved commands and captures output",
    outputMode: "audit",
    provider: "ollama-local",
    model: "llama3.2",
    temperature: 0.3,
    taskTypes: ["coding", "fast"],
  },
  {
    id: "reviewer-default",
    role: "reviewer",
    name: "Reviewer Agent",
    description: "Reviews output and generates structured findings",
    outputMode: "audit",
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    temperature: 0.5,
    taskTypes: ["review", "reasoning"],
  },
];
