import type { ModuleProvider } from "@codexsun/framework";
import { SkillRepository } from "./repository/skill.repository.js";
import { SkillDistillerService } from "./service/skill-distiller.service.js";
import { SkillReaderService } from "./service/skill-reader.service.js";
import { SkillOrganiserService } from "./service/skill-organiser.service.js";

export class CodeitzSkillsProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.skills",
    owner: "devkits/codeitz/api/modules/skills",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.skills.registry", "codeitz.skills.organiser"],
    events: {
      published: [
        "codeitz.skills.skill_registered",
        "codeitz.skills.skill_synthesized",
        "codeitz.skills.skill_organized",
      ],
      consumed: ["codeitz.learning.heuristic_synthesized"],
    },
  };

  readonly repository = new SkillRepository();
  readonly skillService = new SkillDistillerService(this.repository);
  readonly reader = new SkillReaderService();
  readonly organiser = new SkillOrganiserService({ reader: this.reader });

  register(): void {}
}
