import type { MemoryTools } from "../memory/memory-tools.js";

export type AgentTaskStatus = "planned" | "running" | "validating" | "retrying" | "awaiting_approval" | "completed" | "failed" | "rolled_back";
export type AgentTaskValidation = { success: boolean; stages?: Record<string, string>; errors?: readonly unknown[]; [key: string]: unknown };
export type AgentTask = { id: string; ownerId: string; title: string; prompt: string; status: AgentTaskStatus; attempt: number; maxAttempts: number; checkpointId?: string; validation?: AgentTaskValidation; error?: string; createdAt: string; updatedAt: string };
export type AgentTaskInput = { id?: string; title: string; prompt: string; maxAttempts?: number };
export type TaskCheckpointService = { createCheckpoint(confirm: boolean): { id: string }; rollback(id: string, confirm: boolean): { rolledBack: boolean } };
export type TaskValidationRunner = () => Promise<AgentTaskValidation>;

export class AgentTaskError extends Error {
  constructor(readonly statusCode: 400 | 404 | 409 | 500, message: string) { super(message); this.name = "AgentTaskError"; }
}

export class AgentTaskController {
  constructor(private readonly memory: MemoryTools, private readonly checkpoints: TaskCheckpointService) {}

  create(ownerId: string, input: AgentTaskInput): AgentTask {
    const now = new Date().toISOString();
    const task: AgentTask = { id: input.id?.trim() || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId, title: requireText(input.title, "Task title"), prompt: requireText(input.prompt, "Task prompt"), status: "planned", attempt: 0, maxAttempts: clampAttempts(input.maxAttempts), createdAt: now, updatedAt: now };
    return this.save(task);
  }

  get(ownerId: string, taskId: string): AgentTask | null {
    const state = this.memory.taskState(ownerId, taskId);
    return state ? parseTask(state.value, ownerId, taskId) : null;
  }

  start(ownerId: string, taskId: string): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (!["planned", "retrying", "awaiting_approval"].includes(task.status)) throw new AgentTaskError(409, `Task cannot start from ${task.status}.`);
    let checkpointId = task.checkpointId;
    if (!checkpointId) {
      try { checkpointId = this.checkpoints.createCheckpoint(true).id; }
      catch (error) { return this.save({ ...task, status: "failed", error: error instanceof Error ? error.message : "Checkpoint creation failed.", updatedAt: new Date().toISOString() }); }
    }
    return this.save({ ...task, checkpointId, status: "running", error: undefined, updatedAt: new Date().toISOString() });
  }

  requestApproval(ownerId: string, taskId: string, reason: string): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (!["planned", "running", "retrying"].includes(task.status)) throw new AgentTaskError(409, `Task cannot await approval from ${task.status}.`);
    return this.save({ ...task, status: "awaiting_approval", error: requireText(reason, "Approval reason"), updatedAt: new Date().toISOString() });
  }

  beginValidation(ownerId: string, taskId: string): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (task.status !== "running") throw new AgentTaskError(409, `Task cannot validate from ${task.status}.`);
    return this.save({ ...task, status: "validating", updatedAt: new Date().toISOString() });
  }

  recordValidation(ownerId: string, taskId: string, validation: AgentTaskValidation): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (task.status !== "validating") throw new AgentTaskError(409, `Task cannot record validation from ${task.status}.`);
    const nextAttempt = task.attempt + 1;
    const nextStatus: AgentTaskStatus = validation.success ? "completed" : nextAttempt < task.maxAttempts ? "retrying" : "failed";
    return this.save({ ...task, status: nextStatus, attempt: nextAttempt, validation, error: validation.success ? undefined : "Validation failed.", updatedAt: new Date().toISOString() });
  }

  async validateAndTransition(ownerId: string, taskId: string, runner: TaskValidationRunner): Promise<{ task: AgentTask; validation: AgentTaskValidation }> {
    this.beginValidation(ownerId, taskId);
    let validation: AgentTaskValidation;
    try { validation = await runner(); }
    catch (error) { validation = { success: false, errors: [error instanceof Error ? error.message : "Validation failed."] }; }
    let task = this.recordValidation(ownerId, taskId, validation);
    if (task.status === "failed" && task.checkpointId) task = this.rollback(ownerId, taskId);
    return { task, validation };
  }

  rollback(ownerId: string, taskId: string): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (!task.checkpointId) throw new AgentTaskError(409, "Task has no checkpoint to roll back.");
    try { this.checkpoints.rollback(task.checkpointId, true); }
    catch (error) { throw new AgentTaskError(500, error instanceof Error ? error.message : "Rollback failed."); }
    return this.save({ ...task, status: "rolled_back", error: undefined, updatedAt: new Date().toISOString() });
  }

  fail(ownerId: string, taskId: string, error: string): AgentTask {
    const task = this.requireTask(ownerId, taskId);
    if (["completed", "rolled_back"].includes(task.status)) throw new AgentTaskError(409, `Task cannot fail from ${task.status}.`);
    return this.save({ ...task, status: "failed", error: requireText(error, "Task error"), updatedAt: new Date().toISOString() });
  }

  private save(task: AgentTask): AgentTask { this.memory.taskState(task.ownerId, task.id, task as unknown as Record<string, unknown>); return task; }
  private requireTask(ownerId: string, taskId: string): AgentTask { const task = this.get(ownerId, taskId); if (!task) throw new AgentTaskError(404, "Task not found."); return task; }
}

function parseTask(value: Record<string, unknown>, ownerId: string, taskId: string): AgentTask {
  return { id: String(value.id ?? taskId), ownerId: String(value.ownerId ?? ownerId), title: String(value.title ?? ""), prompt: String(value.prompt ?? ""), status: value.status as AgentTaskStatus, attempt: Number(value.attempt ?? 0), maxAttempts: Number(value.maxAttempts ?? 3), checkpointId: optionalString(value.checkpointId), validation: value.validation as AgentTaskValidation | undefined, error: optionalString(value.error), createdAt: String(value.createdAt ?? ""), updatedAt: String(value.updatedAt ?? "") };
}

function requireText(value: string, label: string): string { if (!value?.trim()) throw new AgentTaskError(400, `${label} is required.`); return value.trim(); }
function optionalString(value: unknown): string | undefined { return typeof value === "string" && value ? value : undefined; }
function clampAttempts(value: number | undefined): number { return Math.min(Math.max(Number.isFinite(value) ? Number(value) : 3, 1), 3); }
