import type { ModuleProvider } from "@codexsun/framework";
import { SweTaskRepository } from "./repository/swe-task.repository.js";
import { SweOrchestratorService } from "./service/swe-orchestrator.service.js";

export class CodeitzEngineeringProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.engineering",
    owner: "devkits/codeitz/api/modules/engineering",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.swe.orchestrator"],
    events: {
      published: [
        "codeitz.swe.task_created",
        "codeitz.swe.phase_completed",
        "codeitz.swe.verified",
      ],
      consumed: ["codeitz.learning.experience_indexed"],
    },
  };

  readonly repository = new SweTaskRepository();
  readonly orchestrator = new SweOrchestratorService(this.repository);

  register(): void {}
}
