import type { ModuleProvider } from "@codexsun/framework";
import { ExperienceRepository } from "./repository/experience.repository.js";
import { SelfLearningService } from "./service/self-learning.service.js";

export class CodeitzLearningProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.learning",
    owner: "devkits/codeitz/api/modules/learning",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.learning.memory"],
    events: {
      published: [
        "codeitz.learning.experience_indexed",
        "codeitz.learning.heuristic_synthesized",
      ],
      consumed: ["codeitz.swe.verified"],
    },
  };

  readonly repository = new ExperienceRepository();
  readonly learningService = new SelfLearningService(this.repository);

  register(): void {}
}
