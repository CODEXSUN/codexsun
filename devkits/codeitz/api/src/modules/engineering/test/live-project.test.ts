import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { findWorkspaceRoot } from "../service/workspace-root.js";
import { CodeitzEngineeringProvider } from "../provider.js";
import { MemoryBankService } from "../../memory/service/memory-bank.service.js";
import { SkillOrganiserService } from "../../skills/service/skill-organiser.service.js";

test("Codeitz live project end-to-end test against codexsun workspace", async () => {
  const workspaceRoot = findWorkspaceRoot();
  assert.ok(existsSync(resolve(workspaceRoot, "package.json")), "Workspace root must contain package.json");
  assert.ok(existsSync(resolve(workspaceRoot, "turbo.json")), "Workspace root must contain turbo.json");

  // 1. Initialize live providers
  const engineering = new CodeitzEngineeringProvider();
  const memoryBank = new MemoryBankService();
  const skillOrganiser = new SkillOrganiserService();

  // Wire memory bank and skill organiser into engineering runner
  engineering.setMemoryAndSkills(memoryBank, skillOrganiser);

  // 2. Verify Live Project Discovery
  const projects = engineering.projects.listProjects();
  const liveProject = projects.find((p) => p.id === "codexsun");
  assert.ok(liveProject, "Live project 'codexsun' must be present");
  assert.equal(liveProject.isWorktree, false);
  assert.equal(liveProject.worktreeStatus, "active");

  // 3. Verify Live Codebase Graph Mapping
  const graph = engineering.codebaseGraph.buildGraph();
  assert.ok(graph.nodes.length >= 10, "Graph must map multiple packages/modules in codexsun");
  assert.ok(graph.clusters.includes("Developer Kits"), "Developer Kits cluster must be detected");
  assert.ok(graph.clusters.includes("Platform Packages"), "Platform Packages cluster must be detected");

  // 4. Verify Live GitOps Confinement & Status
  const gitStatus = engineering.gitOps.getStatus();
  assert.equal(typeof gitStatus.branch, "string");
  assert.ok(gitStatus.branch.length > 0, "Current branch must be detected");
  assert.ok(Array.isArray(gitStatus.files), "Tracked/untracked files must be listed");

  // 5. Verify Live Skill Organiser indexing of real .agents/skills
  const skills = skillOrganiser.listSkills();
  assert.ok(skills.length > 0, "Must index skills from .agents/skills");
  const sweSkill = skills.find((s) => s.name === "agentic-swe-pipeline");
  assert.ok(sweSkill, "Must index agentic-swe-pipeline skill");
  assert.ok(sweSkill.workflow.length > 0, "agentic-swe-pipeline must have workflow steps");
  assert.ok(sweSkill.exclusions.length > 0, "agentic-swe-pipeline must have exclusions");
  assert.ok(sweSkill.verificationCriteria.length > 0, "agentic-swe-pipeline must have verification criteria");

  // 6. Verify Live Memory Bank Tri-Format State
  const memoryState = memoryBank.getMemoryBank("global");
  assert.ok(memoryState.activeContext.length > 0, "activeContext must have content");
  assert.ok(memoryState.systemPatterns.length > 0, "systemPatterns must have content");
  assert.ok(memoryState.productContext.length > 0, "productContext must have content");
  assert.ok(memoryState.stats.totalEntries > 0, "SQLite memory entries must be present");

  // 7. Execute Live SWE Task on codexsun project
  const task = engineering.orchestrator.createTask({
    title: "Verify live project health and memory bank integration",
    prompt: "Execute live verification of agentic-swe-pipeline and codebase graph integrity on codexsun",
    targetPaths: ["devkits/codeitz/api", "devkits/codeitz/web"],
  });

  const enqueued = engineering.runner.enqueue({
    taskId: task.id,
    priority: "high",
    projectId: "codexsun",
  });
  assert.equal(enqueued.status, "queued");

  // Phase 1: Intake -> Grounding (synthesizes memory & recommends skills)
  const step1 = engineering.runner.step();
  assert.equal(step1.currentPhase, "grounding");
  assert.ok(step1.message.includes("Memory Bank"), "Must include Memory Bank grounding in evidence");
  assert.ok(step1.message.includes("Recommended Skills"), "Must recommend skills for task");

  // Phase 2: Grounding -> Planning (applies skill workflow & invariant guardrails)
  const step2 = engineering.runner.step();
  assert.equal(step2.currentPhase, "planning");
  assert.ok(step2.message.includes("Applied skill"), "Must apply recommended skill in planning");

  // Phase 3: Planning -> Execution (prepares minimal diff and git status)
  const step3 = engineering.runner.step();
  assert.equal(step3.currentPhase, "execution");

  // Phase 4: Execution -> Verification (runs 4+ checks including skill checklist)
  const step4 = engineering.runner.step();
  assert.equal(step4.currentPhase, "verification");
  const verifiedTask = engineering.orchestrator.getTask(task.id);
  assert.ok(verifiedTask.verificationChecks.length >= 3, "Verification checks must include boundary, typecheck, tests");

  // Phase 5: Verification -> Review (checks non-regression)
  const step5 = engineering.runner.step();
  assert.equal(step5.currentPhase, "review");

  // Phase 6: Review -> Completed (records progress memory & skill usage)
  const step6 = engineering.runner.step();
  assert.equal(step6.currentPhase, "completed");
  assert.equal(step6.completed, true);

  // 8. Verify Post-Execution State in Memory Bank
  const postMemories = memoryBank.queryEntries({
    search: "Verify live project health",
  });
  assert.ok(postMemories.length > 0, "Completed task must be automatically indexed in Memory Bank");
  assert.equal(postMemories[0].category, "progress");

  // Cleanup runner
  engineering.runner.dispose();
  skillOrganiser.close();
});
