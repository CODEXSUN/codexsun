import type { ModuleProvider } from "@codexsun/framework";
import { CapabilitiesService } from "./service/capabilities.service.js";

export class CodeitzCapabilitiesProvider implements ModuleProvider {
  readonly manifest = {
    id: "codeitz.capabilities",
    owner: "devkits/codeitz/api/modules/capabilities",
    version: "1.0.0",
    dependencies: ["platform.core", "codeitz.foundation"],
    contracts: ["codeitz.capabilities.registry"],
    events: {
      published: [
        "codeitz.capabilities.capability_invoked",
        "codeitz.capabilities.multimodal_processed",
      ],
      consumed: ["codeitz.engineering.task_created"],
    },
  };

  readonly service = new CapabilitiesService();

  register(): void {}
}
