import assert from "node:assert/strict";
import test from "node:test";
import { CodeitzEngineeringProvider } from "../provider.js";
import { SweTaskRepository } from "../repository/swe-task.repository.js";
import { SweOrchestratorService } from "../service/swe-orchestrator.service.js";

test("CodeitzEngineeringProvider declares manifest and event contracts", () => {
  const provider = new CodeitzEngineeringProvider();
  assert.equal(provider.manifest.id, "codeitz.engineering");
  assert.equal(provider.manifest.owner, "devkits/codeitz/api/modules/engineering");
  assert.ok(provider.manifest.events.published.includes("codeitz.swe.task_created"));
  assert.ok(provider.manifest.events.consumed.includes("codeitz.learning.experience_indexed"));
});

test("SweOrchestratorService manages phased SWE lifecycle and verification gate", () => {
  const repo = new SweTaskRepository();
  const service = new SweOrchestratorService(repo);

  // 1. Create Task
  const task = service.createTask({
    title: "Implement auth token refresh",
    prompt: "Add token refresh rotation to identity provider",
    targetPaths: ["src/modules/auth/refresh.ts"],
  });
  assert.equal(task.phase, "intake");
  assert.equal(task.status, "queued");

  // 2. Advance to grounding
  const grounded = service.advancePhase(task.id, {
    targetPhase: "grounding",
    evidence: "Found auth contracts in packages/platform-core",
  });
  assert.equal(grounded.phase, "grounding");
  assert.equal(grounded.status, "in_progress");

  // 3. Advance to planning
  const planned = service.advancePhase(task.id, {
    targetPhase: "planning",
    evidence: "Plan created with 2 unit tests and token expiry check",
  });
  assert.equal(planned.phase, "planning");

  // 4. Advance to execution
  const executed = service.advancePhase(task.id, {
    targetPhase: "execution",
    changeSummary: "Added rotateRefreshToken function",
  });
  assert.equal(executed.phase, "execution");

  // 5. Verification gate - failure case
  const failingCheck = service.runVerificationGate(task.id, {
    checks: [
      { name: "typecheck", passed: true, durationMs: 120, output: "No errors" },
      { name: "unit_test", passed: false, durationMs: 400, output: "AssertionError: expected 200 got 401" },
    ],
  });
  assert.equal(failingCheck.passed, false);
  assert.equal(failingCheck.task.status, "rejected");

  // Attempting to advance to review then complete while rejected must throw
  service.advancePhase(task.id, {
    targetPhase: "review",
    evidence: "Reviewing failing check",
  });
  assert.throws(
    () => service.advancePhase(task.id, { targetPhase: "completed" }),
    /verification checks must be run and passing/u,
  );

  // 6. Verification gate - passing case
  const passingCheck = service.runVerificationGate(task.id, {
    checks: [
      { name: "typecheck", passed: true, durationMs: 120, output: "No errors" },
      { name: "unit_test", passed: true, durationMs: 380, output: "All tests passed" },
    ],
  });
  assert.equal(passingCheck.passed, true);
  assert.equal(passingCheck.task.status, "verified");

  // 7. Advance to review then completed
  const reviewed = service.advancePhase(task.id, {
    targetPhase: "review",
    evidence: "Changes reviewed and passed acceptance criteria",
  });
  assert.equal(reviewed.phase, "review");

  const completed = service.advancePhase(task.id, {
    targetPhase: "completed",
  });
  assert.equal(completed.phase, "completed");
  assert.equal(completed.status, "completed");
});
