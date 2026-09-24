import type { ModuleProvider } from "@codexsun/framework";
import { SkillRepository } from "./repository/skill.repository.js";
import { SkillDistillerService } from "./service/skill-distiller.service.js";

export class CodeitzSkillsProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.skills",
    owner: "devkits/codeitz/api/modules/skills",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.skills.registry"],
    events: {
      published: [
        "codeitz.skills.skill_registered",
        "codeitz.skills.skill_synthesized",
      ],
      consumed: ["codeitz.learning.heuristic_synthesized"],
    },
  };

  readonly repository = new SkillRepository();
  readonly skillService = new SkillDistillerService(this.repository);

  register(): void {}
}
