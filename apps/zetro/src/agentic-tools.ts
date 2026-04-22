/**
 * Agentic Tools for Code Assistance
 *
 * Provides plan, write, and execute workflows using Orexso API.
 * Implements the discover-plan-execute-verify loop for code assistance.
 */

import {
  OrexsoClient,
  type ChatRequest,
  type AgentTaskRequest,
  createOrexsoClient,
} from "./orexso-client.js";

export interface ToolContext {
  projectId?: string;
  sessionId?: string;
  activeFile?: string;
  selection?: string;
  useModel?: boolean;
}

export interface PlanResult {
  taskId: string;
  summary: string;
  plan: {
    summary: string;
    assumptions: string[];
    steps: Array<{ id?: string; description: string }>;
    generatedBy: string;
  };
  discoveredFiles: string[];
  message: string;
}

export interface WriteResult {
  taskId: string;
  summary: string;
  generatedCode: string;
  discoveredFiles: string[];
  plan: Array<{ id?: string; description: string }>;
  message: string;
  rollbackActions: Array<unknown>;
}

export interface ExecuteResult {
  taskId: string;
  summary: string;
  successMessage: string;
  discoveredFiles: string[];
  appliedChanges: boolean;
  verificationStatus?: string;
  message: string;
  rollbackActions: Array<unknown>;
}

export interface StreamingPlan {
  taskId: string;
  summary: string;
  plan: {
    summary: string;
    assumptions: string[];
    steps: Array<{ id?: string; description: string }>;
    generatedBy: string;
  };
  chunks: string[];
}

/**
 * AgenticTools provides workflow functions for code planning, writing, and execution.
 */
export class AgenticTools {
  private client: OrexsoClient;
  private context: ToolContext;

  constructor(client?: OrexsoClient, context: ToolContext = {}) {
    this.client = client || createOrexsoClient();
    this.context = {
      projectId: context.projectId || "default",
      useModel: context.useModel !== false,
      ...context,
    };
  }

  /**
   * Plan phase: Analyze code and create an execution plan
   */
  async plan(instruction: string): Promise<PlanResult> {
    const request: AgentTaskRequest = {
      instruction,
      mode: "explain",
      active_file: this.context.activeFile,
      selection: this.context.selection,
      project_id: this.context.projectId,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      apply_changes: false,
      max_files: 4,
    };

    const response = await this.client.executeTask(request);

    return {
      taskId: response.task_id,
      summary: response.summary,
      plan: {
        summary: response.plan.summary,
        assumptions: response.plan.assumptions,
        steps: response.plan.steps,
        generatedBy: response.plan.generated_by,
      },
      discoveredFiles: response.discovered_files,
      message: response.assistant_message,
    };
  }

  /**
   * Write phase: Generate code based on the plan
   */
  async write(instruction: string): Promise<WriteResult> {
    const request: AgentTaskRequest = {
      instruction,
      mode: "edit",
      active_file: this.context.activeFile,
      selection: this.context.selection,
      project_id: this.context.projectId,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      apply_changes: false,
      max_files: 4,
    };

    const response = await this.client.executeTask(request);

    return {
      taskId: response.task_id,
      summary: response.summary,
      generatedCode: response.assistant_message,
      discoveredFiles: response.discovered_files,
      plan: response.plan.steps,
      message: response.assistant_message,
      rollbackActions: response.rollback_actions,
    };
  }

  /**
   * Execute phase: Apply changes to the codebase
   */
  async execute(instruction: string): Promise<ExecuteResult> {
    const request: AgentTaskRequest = {
      instruction,
      mode: "edit",
      active_file: this.context.activeFile,
      selection: this.context.selection,
      project_id: this.context.projectId,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      apply_changes: true,
      max_files: 4,
    };

    const response = await this.client.executeTask(request);

    return {
      taskId: response.task_id,
      summary: response.summary,
      successMessage: response.assistant_message,
      discoveredFiles: response.discovered_files,
      appliedChanges: true,
      verificationStatus: response.verification?.length
        ? "verified"
        : "pending",
      message: response.assistant_message,
      rollbackActions: response.rollback_actions,
    };
  }

  /**
   * Fix phase: Analyze and fix errors in code
   */
  async fix(instruction: string): Promise<WriteResult> {
    const request: AgentTaskRequest = {
      instruction,
      mode: "fix",
      active_file: this.context.activeFile,
      selection: this.context.selection,
      project_id: this.context.projectId,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      apply_changes: false,
      max_files: 4,
    };

    const response = await this.client.executeTask(request);

    return {
      taskId: response.task_id,
      summary: response.summary,
      generatedCode: response.assistant_message,
      discoveredFiles: response.discovered_files,
      plan: response.plan.steps,
      message: response.assistant_message,
      rollbackActions: response.rollback_actions,
    };
  }

  /**
   * Streaming plan: Stream planning with partial chunks
   */
  async *planStream(instruction: string): AsyncGenerator<StreamingPlan> {
    const request: ChatRequest = {
      message: instruction,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      history: [],
    };

    let taskId = "";
    let summary = "";
    let plan = {
      summary: "",
      assumptions: [] as string[],
      steps: [] as Array<{ id?: string; description: string }>,
      generatedBy: "ollama",
    };
    let chunks: string[] = [];

    for await (const event of this.client.stream(request)) {
      if (event.type === "metadata") {
        const meta = event.data as Record<string, unknown>;
        taskId = (meta.task_id as string) || "";
      }

      if (event.type === "chunk") {
        const chunk = event.data as Record<string, unknown>;
        const content = (chunk.content as string) || "";
        chunks.push(content);
        summary = chunks.join("");
      }

      if (event.type === "done") {
        const done = event.data as Record<string, unknown>;
        summary = (done.reply as string) || summary;
        plan.summary = summary;
        plan.generatedBy = (done.generated_by as string) || "ollama";
      }

      yield {
        taskId,
        summary,
        plan,
        chunks,
      };
    }
  }

  /**
   * Chat with streaming support
   */
  async *chat(message: string): AsyncGenerator<string> {
    const request: ChatRequest = {
      message,
      session_id: this.context.sessionId,
      use_model: this.context.useModel,
      history: [],
    };

    for await (const event of this.client.stream(request)) {
      if (event.type === "chunk") {
        const chunk = event.data as Record<string, unknown>;
        const content = (chunk.content as string) || "";
        if (content) {
          yield content;
        }
      }
    }
  }

  /**
   * Interrupt a running task
   */
  async interrupt(taskId: string): Promise<void> {
    await this.client.interruptTask(taskId);
  }

  /**
   * Rollback changes from a task
   */
  async rollback(options: {
    taskId?: string;
    snapshotId?: string;
    gitStashRef?: string;
  }): Promise<void> {
    await this.client.rollback({
      taskId: options.taskId,
      sessionId: this.context.sessionId,
      snapshotId: options.snapshotId,
      gitStashRef: options.gitStashRef,
    });
  }

  /**
   * Complete discover-plan-execute-verify workflow
   */
  async fullWorkflow(instruction: string): Promise<{
    plan: PlanResult;
    write: WriteResult;
    execute: ExecuteResult;
  }> {
    const planResult = await this.plan(instruction);
    const writeResult = await this.write(instruction);
    const executeResult = await this.execute(instruction);

    return {
      plan: planResult,
      write: writeResult,
      execute: executeResult,
    };
  }

  /**
   * Set the active context
   */
  setContext(context: Partial<ToolContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get the current context
   */
  getContext(): ToolContext {
    return { ...this.context };
  }

  /**
   * Create a new session
   */
  createSession(sessionId: string): void {
    this.context.sessionId = sessionId;
  }

  /**
   * Health check with retry
   */
  async healthCheck(maxRetries: number = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const health = await this.client.getHealth();
        return health.status === "ok" && health.warmup_ready;
      } catch (e) {
        if (i === maxRetries - 1) throw e;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return false;
  }
}

/**
 * Create agentic tools with context
 */
export function createAgenticTools(
  client?: OrexsoClient,
  context: ToolContext = {}
): AgenticTools {
  return new AgenticTools(client, context);
}

/**
 * Execute a simple plan-write-execute workflow
 */
export async function quickWorkflow(
  instruction: string,
  context?: ToolContext
): Promise<ExecuteResult> {
  const tools = createAgenticTools(undefined, context);
  return tools.execute(instruction);
}

/**
 * Stream planning with callback
 */
export async function streamPlanning(
  instruction: string,
  onChunk: (chunk: string) => void,
  context?: ToolContext
): Promise<PlanResult> {
  const tools = createAgenticTools(undefined, context);
  let lastPlan: StreamingPlan | undefined;

  for await (const plan of tools.planStream(instruction)) {
    lastPlan = plan;
    onChunk(plan.summary);
  }

  if (!lastPlan) {
    throw new Error("No planning result");
  }

  return {
    taskId: lastPlan.taskId,
    summary: lastPlan.summary,
    plan: lastPlan.plan,
    discoveredFiles: [],
    message: lastPlan.summary,
  };
}
