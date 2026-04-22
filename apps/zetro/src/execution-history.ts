/**
 * Execution History Tracker
 *
 * Provides helper functions to record and query execution lifecycle in project memory.
 */

import { createProjectMemory, ProjectMemoryManager } from "./project-memory.js";

export class ExecutionHistory {
  private manager: ProjectMemoryManager;

  constructor(manager: ProjectMemoryManager) {
    this.manager = manager;
  }

  static async create(projectPath: string, projectId: string = "default") {
    const manager = await createProjectMemory(projectPath, projectId);
    return new ExecutionHistory(manager);
  }

  async recordStart(options: {
    taskType: "plan" | "write" | "execute" | "fix" | "chat";
    instruction: string;
    files?: string[];
    session?: string;
  }): Promise<string> {
    const start = Date.now();
    const id = await this.manager.recordExecution({
      timestamp: new Date(start).toISOString(),
      taskType: options.taskType,
      instruction: options.instruction,
      status: "pending",
      duration: 0,
      files: options.files || [],
      session: options.session || "default",
    });

    return id;
  }

  async recordComplete(id: string, result: unknown, startTimestamp: number) {
    const duration = Date.now() - startTimestamp;

    // Update execution file
    const executions = await this.manager.getRecentExecutions(50);
    const exec = executions.find((entry) => entry.id === id);
    if (!exec) return;

    exec.status = "completed";
    exec.result = result;
    exec.duration = duration;

    // Write back
    await this.manager.recordExecution({
      timestamp: exec.timestamp,
      taskType: exec.taskType,
      instruction: exec.instruction,
      status: exec.status,
      result: exec.result,
      duration: exec.duration,
      files: exec.files,
      taskId: exec.taskId,
      session: exec.session,
    });
  }

  async recordFailure(id: string, err: Error) {
    const executions = await this.manager.getRecentExecutions(50);
    const exec = executions.find((entry) => entry.id === id);
    if (!exec) return;

    exec.status = "failed";
    exec.error = err.message;

    await this.manager.recordExecution({
      timestamp: exec.timestamp,
      taskType: exec.taskType,
      instruction: exec.instruction,
      status: exec.status,
      result: exec.result,
      error: exec.error,
      duration: exec.duration,
      files: exec.files,
      taskId: exec.taskId,
      session: exec.session,
    });
  }

  async queryRecent(limit: number = 10) {
    return this.manager.getRecentExecutions(limit);
  }
}
