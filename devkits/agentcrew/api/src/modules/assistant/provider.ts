import type { ModuleProvider } from "@codexsun/framework";

export class AssistantProvider implements ModuleProvider {
  readonly manifest = {
    id: "agentcrew.assistant",
    owner: "devkits/agentcrew/api/modules/assistant",
    version: "1.0.0",
    dependencies: ["platform.core"],
    contracts: ["agentcrew.assistant.v1"],
    events: { published: [], consumed: [] },
  };
  register(): void {}
}
