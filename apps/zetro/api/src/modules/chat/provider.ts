import type { ModuleProvider, ProviderLifecycleContext, ProviderRegistrationContext } from "@codexsun/framework";
import type { StorageProvider } from "@codexsun/platform-core";
import { ChatAttachmentStore } from "./chat-attachment-store.js";
import { ChatService } from "./chat-service.js";
import { ChatStore } from "./chat-store.js";

export class ZetroChatProvider implements ModuleProvider {
  constructor(private readonly databasePath: string) {}

  readonly manifest = {
    id: "zetro.chat",
    owner: "apps/zetro/api/modules/chat",
    version: "1.0.22",
    dependencies: ["platform.core", "zetro.storage"],
    contracts: ["zetro.chat"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    const storage = context.require<StorageProvider>("storage").forModule("zetro", "chat");
    context.provide("zetro.chat", new ChatService(new ChatStore(this.databasePath), new ChatAttachmentStore(storage)));
  }

  stop(context: ProviderLifecycleContext): void {
    context.require<ChatService>("zetro.chat").close();
  }
}
