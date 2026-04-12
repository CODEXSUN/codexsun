import type { Kysely } from "kysely";

import type {
  ZetroAgentConfig,
  ZetroAgentLogEntry,
  ZetroAgentPlan,
  ZetroAgentPlanStep,
  ZetroAgentResult,
  ZetroAgentRole,
  ZetroAgentState,
  ZetroAgentStatus,
  ZetroAgentTaskInput,
} from "./agent-types.js";
import {
  DEFAULT_AGENT_CONFIGS,
  ZETRO_AGENT_ROLE_SUMMARY,
} from "./agent-types.js";
import { buildPromptFromMessages } from "./prompt-builder.js";
import {
  completeModelRequest,
  buildZetroModelSettings,
} from "./model-provider-service.js";
import { getProviderAdapter } from "./model-provider-adapters.js";
import { parseFindings } from "./prompt-builder.js";

export type ZetroAgentRegistry = Map<string, ZetroAgentConfig>;

const agentRegistry: ZetroAgentRegistry = new Map();
const agentStates: Map<string, ZetroAgentState> = new Map();
const agentLogs: Map<string, ZetroAgentLogEntry[]> = new Map();

export function getAgentRegistry(): ZetroAgentRegistry {
  if (agentRegistry.size === 0) {
    for (const config of DEFAULT_AGENT_CONFIGS) {
      agentRegistry.set(config.id, config);
    }
  }
  return agentRegistry;
}

export function registerAgent(config: ZetroAgentConfig): void {
  agentRegistry.set(config.id, config);
}

export function getAgentConfig(agentId: string): ZetroAgentConfig | undefined {
  return getAgentRegistry().get(agentId);
}

export function listAgentConfigs(): ZetroAgentConfig[] {
  return Array.from(getAgentRegistry().values());
}

export function createAgentState(
  agentId: string,
  config: ZetroAgentConfig,
): ZetroAgentState {
  const state: ZetroAgentState = {
    id: agentId,
    role: config.role,
    name: config.name,
    status: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  agentStates.set(agentId, state);
  return state;
}

export function getAgentState(agentId: string): ZetroAgentState | undefined {
  return agentStates.get(agentId);
}

export function updateAgentState(
  agentId: string,
  updates: Partial<ZetroAgentState>,
): ZetroAgentState | undefined {
  const state = agentStates.get(agentId);
  if (!state) return undefined;

  const updated: ZetroAgentState = {
    ...state,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  agentStates.set(agentId, updated);
  return updated;
}

export function listAgentStates(): ZetroAgentState[] {
  return Array.from(agentStates.values());
}

export function logAgentEvent(
  agentId: string,
  level: "info" | "warn" | "error",
  message: string,
  details?: Record<string, unknown>,
): void {
  const logs = agentLogs.get(agentId) ?? [];
  const entry: ZetroAgentLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    agentId,
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  logs.push(entry);
  agentLogs.set(agentId, logs);
}

export function getAgentLogs(agentId: string): ZetroAgentLogEntry[] {
  return agentLogs.get(agentId) ?? [];
}

export async function runAgent(
  agentId: string,
  input: ZetroAgentTaskInput,
): Promise<ZetroAgentResult> {
  const startTime = Date.now();
  const config = getAgentConfig(agentId);

  if (!config) {
    return {
      success: false,
      taskId: input.id,
      agentId,
      error: `Agent ${agentId} not found`,
      durationMs: Date.now() - startTime,
    };
  }

  updateAgentState(agentId, {
    status: "running",
    currentTaskId: input.id,
    startedAt: new Date().toISOString(),
  });

  logAgentEvent(agentId, "info", `Starting task ${input.id}`, { input });

  try {
    let result: unknown;

    switch (config.role) {
      case "planner":
        result = await runPlannerAgent(config, input);
        break;
      case "executor":
        result = await runExecutorAgent(config, input);
        break;
      case "reviewer":
        result = await runReviewerAgent(config, input);
        break;
      default:
        throw new Error(`Unknown agent role: ${config.role}`);
    }

    updateAgentState(agentId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      lastError: undefined,
    });

    logAgentEvent(agentId, "info", `Task ${input.id} completed`, { result });

    return {
      success: true,
      taskId: input.id,
      agentId,
      output: result,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    updateAgentState(agentId, {
      status: "failed",
      lastError: errorMessage,
    });

    logAgentEvent(agentId, "error", `Task ${input.id} failed`, {
      error: errorMessage,
    });

    return {
      success: false,
      taskId: input.id,
      agentId,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    };
  }
}

export async function runPlannerAgent(
  config: ZetroAgentConfig,
  input: ZetroAgentTaskInput,
): Promise<ZetroAgentPlan> {
  const settings = buildZetroModelSettings();
  const modelConfig = settings.providerConfigs[config.provider] ?? {
    providerId: config.provider,
    enabled: true,
  };

  const systemPrompt = config.systemPrompt ?? buildPlannerSystemPrompt();
  const userPrompt = buildPlannerUserPrompt(input.description);

  const messages = buildPromptFromMessages([], config.outputMode);
  messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const response = await completeModelRequest(
    config.provider,
    modelConfig,
    messages,
    {
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
    },
  );

  const plan = parseAgentPlan(response.content, input.description);

  logAgentEvent(config.id, "info", "Plan generated", {
    steps: plan.steps.length,
  });

  return plan;
}

export async function runExecutorAgent(
  config: ZetroAgentConfig,
  input: ZetroAgentTaskInput,
): Promise<{ executed: string[]; skipped: string[] }> {
  const commands = (input.context?.commands as string[] | undefined) ?? [];

  logAgentEvent(
    config.id,
    "info",
    `Executor received ${commands.length} commands`,
    { commands },
  );

  return {
    executed: [],
    skipped: commands,
  };
}

export async function runReviewerAgent(
  config: ZetroAgentConfig,
  input: ZetroAgentTaskInput,
): Promise<ZetroAgentResult["findings"]> {
  const settings = buildZetroModelSettings();
  const modelConfig = settings.providerConfigs[config.provider] ?? {
    providerId: config.provider,
    enabled: true,
  };

  const systemPrompt = config.systemPrompt ?? buildReviewerSystemPrompt();
  const content = (input.context?.content as string | undefined) ?? "";
  const userPrompt = buildReviewerUserPrompt(content);

  const messages = buildPromptFromMessages([], config.outputMode);
  messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const response = await completeModelRequest(
    config.provider,
    modelConfig,
    messages,
    {
      temperature: config.temperature ?? 0.5,
      maxTokens: config.maxTokens ?? 4096,
    },
  );

  const findings = parseFindings(response.content);

  logAgentEvent(config.id, "info", "Review completed", {
    findings: findings.length,
  });

  return findings.map((f) => ({
    title: f.title,
    severity: f.severity,
    category: f.category ?? "general",
    summary: f.summary,
  }));
}

function buildPlannerSystemPrompt(): string {
  return `You are a Planner Agent that decomposes complex tasks into executable steps.
Given a task description, break it down into clear, ordered steps that can be executed sequentially.
Each step should be atomic, meaning it can be completed in one pass without additional clarification.
Consider dependencies between steps and order them appropriately.
Output a JSON plan with steps array.`;
}

function buildPlannerUserPrompt(taskDescription: string): string {
  return `Decompose this task into ordered steps:\n\n${taskDescription}\n\nOutput format:\n{\n  "id": "plan-xxx",\n  "taskDescription": "...",\n  "steps": [\n    {"id": "step-1", "order": 1, "description": "...", "status": "pending"},\n    ...\n  ],\n  "status": "draft"\n}`;
}

function buildReviewerSystemPrompt(): string {
  return `You are a Reviewer Agent that reviews code or output and generates structured findings.
Analyze the provided content and identify issues such as bugs, security vulnerabilities, performance problems, code quality issues, or missing tests.
For each finding, provide a title, severity (critical/high/medium/low), category, and summary.
Output findings in a structured format.`;
}

function buildReviewerUserPrompt(content: string): string {
  return `Review this content and generate findings:\n\n${content}\n\nOutput any findings with title, severity, category, and summary.`;
}

function parseAgentPlan(
  content: string,
  taskDescription: string,
): ZetroAgentPlan {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]!);
      return {
        id: parsed.id ?? `plan-${Date.now()}`,
        taskDescription: parsed.taskDescription ?? taskDescription,
        steps: parsed.steps ?? [],
        createdAt: new Date().toISOString(),
        status: parsed.status ?? "draft",
      };
    }
  } catch {
    // Fall through to default
  }

  const steps: ZetroAgentPlanStep[] = content
    .split(/\n/)
    .filter((line) => line.trim().match(/^\d+\./))
    .map((line, index) => ({
      id: `step-${index + 1}`,
      order: index + 1,
      description: line.replace(/^\d+\.\s*/, "").trim(),
      status: "pending" as const,
    }));

  return {
    id: `plan-${Date.now()}`,
    taskDescription,
    steps,
    createdAt: new Date().toISOString(),
    status: "draft",
  };
}

export function cancelAgent(agentId: string): boolean {
  const state = getAgentState(agentId);
  if (!state) return false;

  if (state.status === "running") {
    updateAgentState(agentId, {
      status: "cancelled",
      completedAt: new Date().toISOString(),
    });
    logAgentEvent(agentId, "warn", "Agent cancelled");
    return true;
  }

  return false;
}

export function pauseAgent(agentId: string): boolean {
  const state = getAgentState(agentId);
  if (!state || state.status !== "running") return false;

  updateAgentState(agentId, { status: "paused" });
  logAgentEvent(agentId, "info", "Agent paused");
  return true;
}

export function resumeAgent(agentId: string): boolean {
  const state = getAgentState(agentId);
  if (!state || state.status !== "paused") return false;

  updateAgentState(agentId, { status: "running" });
  logAgentEvent(agentId, "info", "Agent resumed");
  return true;
}

export function resetAgent(agentId: string): boolean {
  const config = getAgentConfig(agentId);
  if (!config) return false;

  const newState = createAgentState(agentId, config);
  agentStates.set(agentId, newState);
  agentLogs.delete(agentId);
  return true;
}
