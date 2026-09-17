import type {
  OrchestrationAttempt,
  OrchestrationState,
  RecordedOrchestrationAttempt,
  VerificationCheck,
} from "../contracts/orchestration.contract.js";
import type { OrchestrationAttemptRepository } from "../repository/orchestration-attempt.repository.js";

const nextStates: Readonly<Record<OrchestrationState, readonly OrchestrationState[]>> = {
  draft: ["development-ready"],
  "development-ready": ["preview-requested", "verification-running"],
  "preview-requested": ["preview-ready", "verification-failed"],
  "preview-ready": ["verification-running"],
  "verification-running": ["verification-passed", "verification-failed"],
  "verification-passed": ["approval-requested"],
  "approval-requested": ["approved", "rejected"],
  approved: ["production-queued"],
  "production-queued": ["deploying", "deployment-failed"],
  deploying: ["live-verified", "deployment-failed"],
  "live-verified": [],
  "verification-failed": [],
  rejected: [],
  "deployment-failed": ["rolled-back"],
  "rolled-back": [],
};

export class OrchestrationService {
  constructor(private readonly repository: OrchestrationAttemptRepository) {}

  async create(attempt: Omit<OrchestrationAttempt, "state">): Promise<RecordedOrchestrationAttempt> {
    if (await this.repository.find(attempt.id)) throw new Error(`Orchestration attempt already exists: ${attempt.id}`);
    const record = { ...attempt, state: "development-ready" as const, checks: [] };
    await this.repository.save(record);
    return record;
  }

  async get(id: string): Promise<RecordedOrchestrationAttempt | undefined> {
    return this.repository.find(id);
  }

  async list(): Promise<RecordedOrchestrationAttempt[]> {
    return this.repository.list();
  }

  async recordCheck(id: string, check: VerificationCheck): Promise<RecordedOrchestrationAttempt> {
    const attempt = await this.requireAttempt(id);
    const checks = [...attempt.checks.filter((candidate) => candidate.id !== check.id), check];
    const state = this.resolveCheckState(attempt.state, checks);
    const updated = { ...attempt, checks, state };
    await this.repository.save(updated);
    return updated;
  }

  async requestApproval(id: string): Promise<RecordedOrchestrationAttempt> {
    const attempt = await this.requireAttempt(id);
    if (!this.canRequestApproval(attempt)) throw new Error("Required verification checks have not passed.");
    const updated = { ...attempt, state: "approval-requested" as const };
    await this.repository.save(updated);
    return updated;
  }

  canTransition(from: OrchestrationState, to: OrchestrationState): boolean {
    return nextStates[from].includes(to);
  }

  transition(attempt: OrchestrationAttempt, nextState: OrchestrationState): OrchestrationAttempt {
    if (!this.canTransition(attempt.state, nextState)) {
      throw new Error(`Cannot transition orchestration attempt from ${attempt.state} to ${nextState}.`);
    }

    return { ...attempt, state: nextState };
  }

  canRequestApproval(attempt: RecordedOrchestrationAttempt): boolean {
    return (
      attempt.state === "verification-passed" &&
      attempt.checks.some((check) => check.required) &&
      attempt.checks.every((check) => !check.required || check.outcome === "passed")
    );
  }

  private async requireAttempt(id: string): Promise<RecordedOrchestrationAttempt> {
    const attempt = await this.repository.find(id);
    if (!attempt) throw new Error(`Orchestration attempt was not found: ${id}`);
    return attempt;
  }

  private resolveCheckState(current: OrchestrationState, checks: readonly VerificationCheck[]): OrchestrationState {
    if (checks.some((check) => check.required && check.outcome === "failed")) return "verification-failed";
    if (
      checks.some((check) => check.required) &&
      checks.every((check) => !check.required || check.outcome === "passed")
    ) {
      return "verification-passed";
    }
    return current === "development-ready" ? "verification-running" : current;
  }
}
