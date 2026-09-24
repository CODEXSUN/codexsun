import { randomUUID } from "node:crypto";
import {
  type AdvancePhaseInput,
  type CreateSweTaskInput,
  type RunVerificationInput,
  type SweTask,
  type SweTaskPhase,
  type SweVerificationCheck,
} from "../contracts/swe-contracts.js";
import { SweTaskRepository } from "../repository/swe-task.repository.js";

const PHASE_SEQUENCE: readonly SweTaskPhase[] = [
  "intake",
  "grounding",
  "planning",
  "execution",
  "verification",
  "review",
  "completed",
] as const;

export class SweOrchestratorService {
  constructor(private readonly repository: SweTaskRepository = new SweTaskRepository()) {}

  createTask(input: CreateSweTaskInput): SweTask {
    const now = new Date().toISOString();
    const task: SweTask = {
      id: randomUUID(),
      title: input.title.trim(),
      prompt: input.prompt.trim(),
      phase: "intake",
      status: "queued",
      targetPaths: input.targetPaths ?? [],
      changeSummary: "",
      verificationChecks: [],
      reviewNotes: "",
      createdAt: now,
      updatedAt: now,
    };
    return this.repository.save(task);
  }

  getTask(id: string): SweTask {
    const task = this.repository.findById(id);
    if (!task) {
      throw new Error(`SWE task ${id} was not found.`);
    }
    return task;
  }

  listTasks(): SweTask[] {
    return this.repository.list();
  }

  advancePhase(taskId: string, input: AdvancePhaseInput): SweTask {
    const task = this.getTask(taskId);

    if (task.status === "completed" || task.status === "failed") {
      throw new Error(`Cannot advance task ${taskId} from terminal state ${task.status}.`);
    }

    if (input.targetPhase === "failed") {
      task.phase = "failed";
      task.status = "failed";
      task.reviewNotes = input.evidence || "Task execution failed.";
      task.updatedAt = new Date().toISOString();
      return this.repository.save(task);
    }

    const currentIndex = PHASE_SEQUENCE.indexOf(task.phase);
    const targetIndex = PHASE_SEQUENCE.indexOf(input.targetPhase);

    if (targetIndex === -1) {
      throw new Error(`Unknown target phase: ${input.targetPhase}`);
    }

    if (targetIndex > currentIndex + 1) {
      throw new Error(
        `Cannot advance phase from ${task.phase} directly to ${input.targetPhase}; must complete ${PHASE_SEQUENCE[currentIndex + 1]} first.`,
      );
    }

    if (input.targetPhase === "completed") {
      const allPassed =
        task.verificationChecks.length > 0 &&
        task.verificationChecks.every((check) => check.passed);
      if (!allPassed) {
        throw new Error(
          `Cannot complete task ${taskId}: verification checks must be run and passing before completion.`,
        );
      }
      task.status = "completed";
    } else {
      task.status = "in_progress";
    }

    task.phase = input.targetPhase;
    if (input.targetPaths) {
      task.targetPaths = Array.from(new Set([...task.targetPaths, ...input.targetPaths]));
    }
    if (input.changeSummary) {
      task.changeSummary = input.changeSummary;
    }
    if (input.evidence) {
      task.reviewNotes = input.evidence;
    }
    task.updatedAt = new Date().toISOString();
    return this.repository.save(task);
  }

  runVerificationGate(taskId: string, input: RunVerificationInput): {
    task: SweTask;
    passed: boolean;
  } {
    const task = this.getTask(taskId);
    task.verificationChecks = input.checks;
    const passed = input.checks.length > 0 && input.checks.every((c) => c.passed);
    task.phase = "verification";
    task.status = passed ? "verified" : "rejected";
    task.updatedAt = new Date().toISOString();
    return {
      task: this.repository.save(task),
      passed,
    };
  }
}
