import assert from "node:assert/strict";
import test from "node:test";
import type { RecordedOrchestrationAttempt, VerificationCheck } from "../contracts/orchestration.contract.js";
import type { OrchestrationAttemptRepository } from "../repository/orchestration-attempt.repository.js";
import { OrchestrationService } from "../service/orchestration.service.js";

test("the orchestration service accepts the reviewed delivery sequence", () => {
  const service = new OrchestrationService(new InMemoryAttemptRepository());
  assert.equal(service.canTransition("approval-requested", "approved"), true);
  assert.deepEqual(
    service.transition(
      { id: "attempt-1", revision: "3b8a6c1", targetId: "preview", state: "approval-requested" },
      "approved",
    ),
    { id: "attempt-1", revision: "3b8a6c1", targetId: "preview", state: "approved" },
  );
});

test("the orchestration service rejects a production bypass", () => {
  const service = new OrchestrationService(new InMemoryAttemptRepository());
  assert.throws(
    () => service.transition({ id: "attempt-1", revision: "3b8a6c1", targetId: "live", state: "draft" }, "deploying"),
    /Cannot transition/,
  );
});

test("a failed required check blocks an approval request", async () => {
  const service = new OrchestrationService(new InMemoryAttemptRepository());
  await service.create({ id: "attempt-2", revision: "4c8a6c1", targetId: "preview" });
  const attempt = await service.recordCheck("attempt-2", failedRequiredCheck);

  assert.equal(attempt.state, "verification-failed");
  await assert.rejects(() => service.requestApproval("attempt-2"), /Required verification checks have not passed/);
});

const failedRequiredCheck: VerificationCheck = {
  id: "check-1",
  kind: "static",
  required: true,
  outcome: "failed",
  reference: "npm.cmd:run:check",
  evidenceReference: "evidence/check-1",
  completedAt: "2026-09-17T09:00:00.000Z",
};

class InMemoryAttemptRepository implements OrchestrationAttemptRepository {
  private readonly attempts = new Map<string, RecordedOrchestrationAttempt>();

  async find(id: string): Promise<RecordedOrchestrationAttempt | undefined> {
    return this.attempts.get(id);
  }

  async list(): Promise<RecordedOrchestrationAttempt[]> {
    return [...this.attempts.values()];
  }

  async save(attempt: RecordedOrchestrationAttempt): Promise<void> {
    this.attempts.set(attempt.id, attempt);
  }
}
