import type { ModuleProvider } from "@codexsun/framework";
import { SweTaskRepository } from "./repository/swe-task.repository.js";
import { SweOrchestratorService } from "./service/swe-orchestrator.service.js";
import { SweTaskRunnerService } from "./service/swe-task-runner.service.js";

import { CodebaseGraphService } from "./service/codebase-graph.service.js";
import { GitOpsService } from "./service/git-ops.service.js";
import { ProjectsService } from "./service/projects.service.js";
import { CodePatcherService } from "./service/code-patcher.service.js";
import { SweStateGraphService } from "./service/swe-state-graph.service.js";

import type { MemoryBankService } from "../memory/service/memory-bank.service.js";
import type { SkillOrganiserService } from "../skills/service/skill-organiser.service.js";

export class CodeitzEngineeringProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.engineering",
    owner: "devkits/codeitz/api/modules/engineering",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.swe.orchestrator", "codeitz.swe.runner", "codeitz.swe.codebase_graph", "codeitz.swe.git_ops", "codeitz.swe.projects", "codeitz.swe.patcher", "codeitz.swe.state_graph"],
    events: {
      published: [
        "codeitz.swe.task_created",
        "codeitz.swe.task_queued",
        "codeitz.swe.phase_completed",
        "codeitz.swe.verified",
        "codeitz.swe.runner_stepped",
        "codeitz.swe.auto_committed",
        "codeitz.swe.changes_undone",
      ],
      consumed: ["codeitz.learning.experience_indexed"],
    },
  };

  readonly repository = new SweTaskRepository();
  readonly orchestrator = new SweOrchestratorService(this.repository);
  readonly gitOps = new GitOpsService();
  readonly stateGraph = new SweStateGraphService();
  readonly runner = new SweTaskRunnerService(this.orchestrator, this.gitOps, {
    stateGraph: this.stateGraph,
  });
  readonly codebaseGraph = new CodebaseGraphService();
  readonly projects = new ProjectsService();
  readonly patcher = new CodePatcherService();

  setMemoryAndSkills(memoryBank: MemoryBankService, skillOrganiser: SkillOrganiserService): void {
    this.runner.setMemoryBank(memoryBank);
    this.runner.setSkillOrganiser(skillOrganiser);
  }

  register(): void {}
}

