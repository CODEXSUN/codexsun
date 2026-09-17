import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import { ChatService } from "./chat-service.js";
import { ChatStore } from "./chat-store.js";

export class ZetroChatProvider implements ModuleProvider {
  private readonly service: ChatService;

  constructor(databasePath: string) {
    this.service = new ChatService(new ChatStore(databasePath));
  }

  readonly manifest = {
    id: "zetro.chat",
    owner: "apps/zetro/api/modules/chat",
    version: "1.0.17",
    dependencies: ["platform.core", "zetro.storage"],
    contracts: ["zetro.chat"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("zetro.chat", this.service);
  }

  stop(): void {
    this.service.close();
  }
}
