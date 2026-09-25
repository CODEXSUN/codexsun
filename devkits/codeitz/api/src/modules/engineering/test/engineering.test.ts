import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CodeitzEngineeringProvider } from "../provider.js";
import { SweTaskRepository } from "../repository/swe-task.repository.js";
import { CodePatcherService } from "../service/code-patcher.service.js";
import { SweOrchestratorService } from "../service/swe-orchestrator.service.js";
import { SweStateGraphService } from "../service/swe-state-graph.service.js";
import { SweTaskRunnerService } from "../service/swe-task-runner.service.js";
import { MemoryBankService } from "../../memory/service/memory-bank.service.js";
import { SkillOrganiserService } from "../../skills/service/skill-organiser.service.js";

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

test("SweTaskRunnerService manages prioritized queue and continuous phased progression", () => {
  const repo = new SweTaskRepository();
  const orchestrator = new SweOrchestratorService(repo);
  const runner = new SweTaskRunnerService(orchestrator);

  // Create two tasks with different priorities
  const task1 = orchestrator.createTask({
    title: "Low priority docs",
    prompt: "Update documentation for plugins",
  });
  const task2 = orchestrator.createTask({
    title: "Critical security patch",
    prompt: "Fix timing attack in secret compare",
  });

  // Enqueue low then critical
  runner.enqueue({ taskId: task1.id, priority: "low" });
  runner.enqueue({ taskId: task2.id, priority: "critical" });

  const queue = runner.getQueue();
  assert.equal(queue.length, 2);
  // task2 must be first due to "critical" priority
  assert.equal(queue[0].taskId, task2.id);
  assert.equal(queue[1].taskId, task1.id);

  // Start runner
  const started = runner.start({ autoProgress: true });
  assert.equal(started.status, "running");

  // Step 1: critical task moves from intake -> grounding
  const step1 = runner.step();
  assert.equal(step1.success, true);
  assert.equal(step1.taskId, task2.id);
  assert.equal(step1.currentPhase, "grounding");

  // Step 2: grounding -> planning
  const step2 = runner.step();
  assert.equal(step2.currentPhase, "planning");

  // Step 3: planning -> execution
  const step3 = runner.step();
  assert.equal(step3.currentPhase, "execution");

  // Step 4: execution -> verification (runs verification gate)
  const step4 = runner.step();
  assert.equal(step4.currentPhase, "verification");

  // Step 5: verification -> review
  const step5 = runner.step();
  assert.equal(step5.currentPhase, "review");

  // Step 6: review -> completed
  const step6 = runner.step();
  assert.equal(step6.currentPhase, "completed");
  assert.equal(step6.completed, true);

  // Check state and queue
  const queueAfter = runner.getQueue();
  const task2Item = queueAfter.find((q) => q.taskId === task2.id);
  assert.equal(task2Item?.status, "completed");

  // Next step should pick up task1
  const step7 = runner.step();
  assert.equal(step7.taskId, task1.id);
  assert.equal(step7.currentPhase, "grounding");

  // Check logs
  const logs = runner.getLogs();
  assert.ok(logs.length > 5);
  assert.ok(logs.some((l) => l.taskId === task2.id && l.level === "action"));

  // Pause runner
  const paused = runner.pause();
  assert.equal(paused.status, "paused");

  runner.dispose();
});

test("CodebaseGraphService builds structured knowledge graph with nodes and clusters", () => {
  const provider = new CodeitzEngineeringProvider();
  const graph = provider.codebaseGraph.buildGraph();
  assert.ok(graph.nodes.length > 0);
  assert.ok(graph.summary.totalNodes > 0);
  assert.ok(graph.clusters.length > 0);

  const codeitzNode = graph.nodes.find((n) => n.id.includes("codeitz"));
  assert.ok(codeitzNode);

  const deps = provider.codebaseGraph.findDependencies(codeitzNode.id);
  assert.ok(Array.isArray(deps.upstream));
  assert.ok(Array.isArray(deps.downstream));
});

test("GitOpsService provides status, diff, sensible commit message and undo", () => {
  const provider = new CodeitzEngineeringProvider();
  const status = provider.gitOps.getStatus();
  assert.equal(typeof status.branch, "string");
  assert.equal(typeof status.clean, "boolean");
  assert.ok(Array.isArray(status.files));

  const diff = provider.gitOps.getDiff();
  assert.ok(Array.isArray(diff.files));
  assert.equal(typeof diff.totalAdditions, "number");

  const commitMsg = provider.gitOps.generateSensibleCommitMessage({
    taskTitle: "Implement multi-model reasoning and codebase graph",
    prompt: "Add graph mapping and sensible git commit tools",
    targetPaths: ["devkits/codeitz/api", "devkits/codeitz/web"],
    verificationPassed: true,
    checksCount: 14,
  });
  assert.ok(commitMsg.startsWith("feat(codeitz): multi-model reasoning"));
  assert.ok(commitMsg.includes("Verification gate: passed"));

  const autoCommit = provider.gitOps.autoCommit({
    message: "feat(codeitz): automated test commit",
    stageAll: false,
  });
  assert.ok(autoCommit.success);

  const undo = provider.gitOps.undoChanges({ mode: "working_tree" });
  assert.ok(undo.success);
});

test("ProjectsService manages projects, conversations, and isolated worktree contexts", () => {
  const provider = new CodeitzEngineeringProvider();
  const projects = provider.projects.listProjects();
  assert.equal(projects.length, 2);

  const codexsun = projects.find((p) => p.id === "codexsun");
  assert.ok(codexsun);
  assert.equal(codexsun.isWorktree, false);
  assert.equal(codexsun.conversations.length, 3);
  assert.equal(codexsun.conversations[0].title, "Build Agentic Software Eng...");
  assert.equal(codexsun.conversations[0].active, true);

  const workspace = projects.find((p) => p.id === "workspace");
  assert.ok(workspace);
  assert.equal(workspace.isWorktree, true);
  assert.equal(workspace.worktreeStatus, "isolated");
  assert.equal(workspace.conversations.length, 0); // "No conversations yet"

  // Create isolated project
  const newProj = provider.projects.createProject({
    name: "Mobile Feature",
    worktreeBranch: "feat/mobile-chat",
    isWorktree: true,
  });
  assert.equal(newProj.name, "Mobile Feature");
  assert.equal(newProj.isWorktree, true);
  assert.equal(newProj.worktreeBranch, "feat/mobile-chat");

  // Create conversation under Workspace
  const newConv = provider.projects.createConversation("workspace", {
    title: "Feature branch worktree setup",
  });
  assert.equal(newConv.title, "Feature branch worktree setup");
  assert.equal(newConv.active, true);

  const workspaceConvs = provider.projects.listConversations("workspace");
  assert.equal(workspaceConvs.length, 1);

  // Test updating basic settings on live project (codexsun)
  const updatedLive = provider.projects.updateProject("codexsun", {
    defaultModel: "Claude 3.5 Sonnet (Agentic SWE)",
    verificationRigor: "fast",
    runnerConcurrency: 4,
    autoRollback: false,
  });
  assert.equal(updatedLive.defaultModel, "Claude 3.5 Sonnet (Agentic SWE)");
  assert.equal(updatedLive.verificationRigor, "fast");
  assert.equal(updatedLive.runnerConcurrency, 4);
  assert.equal(updatedLive.autoRollback, false);

  // Test updating basic settings on new project
  const updatedNew = provider.projects.updateProject(newProj.id, {
    name: "Mobile Feature Pro",
    worktreeBranch: "feat/mobile-chat-v2",
    runnerConcurrency: 3,
  });
  assert.equal(updatedNew.name, "Mobile Feature Pro");
  assert.equal(updatedNew.worktreeBranch, "feat/mobile-chat-v2");
  assert.equal(updatedNew.runnerConcurrency, 3);
});

test("SweTaskRunnerService executes multiple runners in parallel with worker slots", () => {
  const repo = new SweTaskRepository();
  const orchestrator = new SweOrchestratorService(repo);
  const runner = new SweTaskRunnerService(orchestrator);

  const task1 = orchestrator.createTask({
    title: "Parallel Task A",
    prompt: "Step A",
  });
  const task2 = orchestrator.createTask({
    title: "Parallel Task B",
    prompt: "Step B",
  });

  runner.enqueue({ taskId: task1.id, priority: "high" });
  runner.enqueue({ taskId: task2.id, priority: "high" });

  runner.start({ maxConcurrency: 2 });
  const parallelStep = runner.stepParallel();
  assert.equal(parallelStep.length, 2);
  assert.equal(parallelStep[0].runnerId, "worker-1");
  assert.equal(parallelStep[1].runnerId, "worker-2");
  assert.equal(parallelStep[0].currentPhase, "grounding");
  assert.equal(parallelStep[1].currentPhase, "grounding");

  const state = runner.getRunnerState();
  assert.equal(state.activeRunners.length, 2);
  assert.equal(state.activeRunners[0].runnerId, "worker-1");
  assert.equal(state.activeRunners[1].runnerId, "worker-2");
  assert.equal(state.maxConcurrency, 2);

  runner.dispose();
});

test("GitOpsService withGitLock executes concurrent requests sequentially without collision", async () => {
  const provider = new CodeitzEngineeringProvider();
  const sequence: number[] = [];

  const task1 = provider.gitOps.withGitLock(async () => {
    sequence.push(1);
    await new Promise((r) => setTimeout(r, 15));
    sequence.push(2);
    return "done1";
  });

  const task2 = provider.gitOps.withGitLock(async () => {
    sequence.push(3);
    sequence.push(4);
    return "done2";
  });

  const [res1, res2] = await Promise.all([task1, task2]);
  assert.equal(res1, "done1");
  assert.equal(res2, "done2");
  assert.deepEqual(sequence, [1, 2, 3, 4]);
});

test("GitOpsService mergeWorktree executes safely", () => {
  const provider = new CodeitzEngineeringProvider();
  const mergeResult = provider.gitOps.mergeWorktree({
    sourceBranch: "non-existent-branch-for-test",
    targetBranch: "main",
  });
  // Since non-existent, it should report safe conflict or failure without crashing
  assert.equal(typeof mergeResult.success, "boolean");
  assert.ok(mergeResult.message.length > 0);
});

test("SweTaskRunnerService listener receives broadcasted events", () => {
  const repo = new SweTaskRepository();
  const orchestrator = new SweOrchestratorService(repo);
  const runner = new SweTaskRunnerService(orchestrator);

  const receivedEvents: string[] = [];
  const unsubscribe = runner.subscribe((evt) => {
    receivedEvents.push(evt.type);
  });

  const task = orchestrator.createTask({
    title: "Stream Test Task",
    prompt: "Verify SSE broadcast",
  });

  runner.enqueue({ taskId: task.id, priority: "high" });
  assert.ok(receivedEvents.includes("task_enqueued") || receivedEvents.includes("log_added"));

  unsubscribe();
  runner.dispose();
});

test("CodePatcherService applies targeted patch and supports rollback", () => {
  const testDir = resolve("storage/runtime/test-patcher");
  mkdirSync(testDir, { recursive: true });
  const patcher = new CodePatcherService(testDir);

  const testFile = "sample.ts";
  const absTestFile = resolve(testDir, testFile);
  writeFileSync(absTestFile, "function oldCode() {\n  return 1;\n}\n", "utf8");

  // Apply targeted patch
  const patchResult = patcher.applyPatch({
    filePath: testFile,
    targetContent: "return 1;",
    replacementContent: "return 2;",
    description: "Update return value to 2",
  });

  assert.equal(patchResult.success, true);
  assert.ok(patchResult.backupCreated);
  assert.equal(readFileSync(absTestFile, "utf8"), "function oldCode() {\n  return 2;\n}\n");

  // Rollback patch
  const rolledBack = patcher.rollback(testFile);
  assert.equal(rolledBack, true);
  assert.equal(readFileSync(absTestFile, "utf8"), "function oldCode() {\n  return 1;\n}\n");

  // Cleanup
  rmSync(testDir, { recursive: true, force: true });
});

test("CodePatcherService rejects path traversal outside workspace root", () => {
  const testDir = resolve("storage/runtime/test-patcher");
  mkdirSync(testDir, { recursive: true });
  const patcher = new CodePatcherService(testDir);

  assert.throws(() => {
    patcher.applyPatch({
      filePath: "../evil.ts",
      fullContent: "malicious code",
    });
  }, /Security Exception/);

  rmSync(testDir, { recursive: true, force: true });
});

test("SweStateGraphService provides phased graph with cyclical self-healing edges", () => {
  const stateGraph = new SweStateGraphService();
  const nodes = stateGraph.getNodes();
  const edges = stateGraph.getEdges();

  assert.ok(nodes.length >= 7);
  assert.ok(edges.some((e) => e.from === "verification" && e.to === "execution" && e.condition === "on_failed"));

  const taskId = "task-cyclical-test";

  // Intake -> Grounding
  const step1 = stateGraph.determineNextPhase("intake", "success", taskId);
  assert.equal(step1.nextPhase, "grounding");

  // Execution -> Verification
  const step2 = stateGraph.determineNextPhase("execution", "approved", taskId);
  assert.equal(step2.nextPhase, "verification");

  // Verification Failure (Cycle 1 -> back to Execution)
  const fail1 = stateGraph.determineNextPhase("verification", "failure", taskId);
  assert.equal(fail1.nextPhase, "execution");
  assert.equal(fail1.cycled, true);
  assert.equal(fail1.retriesRemaining, 2);

  // Verification Failure (Cycle 2 -> back to Execution)
  const fail2 = stateGraph.determineNextPhase("verification", "failure", taskId);
  assert.equal(fail2.nextPhase, "execution");
  assert.equal(fail2.cycled, true);
  assert.equal(fail2.retriesRemaining, 1);

  // Verification Failure (Cycle 3 -> back to Execution)
  const fail3 = stateGraph.determineNextPhase("verification", "failure", taskId);
  assert.equal(fail3.nextPhase, "execution");
  assert.equal(fail3.cycled, true);
  assert.equal(fail3.retriesRemaining, 0);

  // Verification Failure (Cycle 4 -> Terminal Failure)
  const fail4 = stateGraph.determineNextPhase("verification", "failure", taskId);
  assert.equal(fail4.nextPhase, "failed");
  assert.equal(fail4.cycled, false);

  // Successful verification resets and advances to review
  const taskId2 = "task-success-test";
  const successStep = stateGraph.determineNextPhase("verification", "success", taskId2);
  assert.equal(successStep.nextPhase, "review");
  assert.equal(successStep.cycled, false);
});

test("SweTaskRunnerService grounds tasks with synthesized memory and recommended skills", () => {
  const memoryTestDir = resolve("storage/runtime/test-swe-runner-memory");
  const memoryBank = new MemoryBankService({
    baseDir: memoryTestDir,
    inMemorySqlite: true,
    jsonPath: resolve(memoryTestDir, "test-memory.json"),
  });
  const skillOrganiser = new SkillOrganiserService({
    inMemorySqlite: true,
    jsonCatalogPath: resolve(memoryTestDir, "test-skills.json"),
  });

  // Index skills so organiser has skills available
  skillOrganiser.scanAndIndex();

  const repo = new SweTaskRepository();
  const orchestrator = new SweOrchestratorService(repo);
  const runner = new SweTaskRunnerService(orchestrator, undefined, {
    memoryBank,
    skillOrganiser,
  });

  const task = orchestrator.createTask({
    title: "Refactor git operations and agentic swe pipeline",
    prompt: "Apply agentic-swe-pipeline disciplined requirement decomposition and verification gate",
    targetPaths: ["devkits/codeitz/api"],
  });

  runner.enqueue({ taskId: task.id, priority: "high" });

  // 1. Intake -> Grounding
  const step1 = runner.step();
  assert.equal(step1.currentPhase, "grounding");
  assert.ok(step1.message.includes("Memory Bank"));
  assert.ok(step1.message.includes("Recommended Skills"));
  assert.ok(step1.message.includes("agentic-swe-pipeline"));

  // 2. Grounding -> Planning
  const step2 = runner.step();
  assert.equal(step2.currentPhase, "planning");
  assert.ok(step2.message.includes("Applied skill"));

  // 3. Planning -> Execution
  const step3 = runner.step();
  assert.equal(step3.currentPhase, "execution");

  // 4. Execution -> Verification
  const step4 = runner.step();
  assert.equal(step4.currentPhase, "verification");
  const updatedTask = orchestrator.getTask(task.id);
  assert.ok(updatedTask.verificationChecks.some((c) => c.name.startsWith("skill_verification_")));

  // 5. Verification -> Review
  const step5 = runner.step();
  assert.equal(step5.currentPhase, "review");

  // 6. Review -> Completed
  const step6 = runner.step();
  assert.equal(step6.currentPhase, "completed");
  assert.equal(step6.completed, true);

  // Check that completed task was recorded into Memory Bank
  const memories = memoryBank.queryEntries({ search: "agentic swe pipeline" });
  assert.ok(memories.length > 0);
  assert.equal(memories[0].category, "progress");

  // Clean up
  skillOrganiser.close();
  rmSync(memoryTestDir, { recursive: true, force: true });
});

test("SweTaskRunnerService triggers LangGraph cycle back to execution on verification failure", () => {
  const repo = new SweTaskRepository();
  const orchestrator = new SweOrchestratorService(repo);
  const stateGraph = new SweStateGraphService();
  const runner = new SweTaskRunnerService(orchestrator, undefined, {
    stateGraph,
  });

  const task = orchestrator.createTask({
    title: "Broken task needing self-healing",
    prompt: "Implement fix that fails verification initially",
  });

  runner.enqueue({ taskId: task.id, priority: "high" });

  // Intake -> Grounding
  runner.step();
  // Grounding -> Planning
  runner.step();
  // Planning -> Execution
  runner.step();

  // Mock verification failure by injecting a failing verification check
  const origRunVerificationGate = orchestrator.runVerificationGate.bind(orchestrator);
  orchestrator.runVerificationGate = (id, input) => {
    return origRunVerificationGate(id, {
      checks: [
        { name: "test_check", passed: false, durationMs: 10, output: "SyntaxError: Unexpected token" },
      ],
    });
  };

  // Execution -> Verification (which fails, and should cycle back to execution!)
  const cycledStep = runner.step();
  assert.equal(cycledStep.action, "cycle_to_execution");
  assert.equal(cycledStep.currentPhase, "execution");
  assert.equal(cycledStep.completed, false);
  assert.ok(cycledStep.message.includes("LangGraph cycle triggered self-healing"));

  const taskAfterCycle = orchestrator.getTask(task.id);
  assert.equal(taskAfterCycle.phase, "execution");

  // Restore
  orchestrator.runVerificationGate = origRunVerificationGate;
});






