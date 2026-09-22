import type { ModuleProvider, ProviderLifecycleContext, ProviderRegistrationContext } from "@codexsun/framework";
import type { ZetroChatConversationReader } from "@codexsun/zetro-contracts";
import { BriefService } from "./brief-service.js";
import { BriefStore } from "./brief-store.js";

export class ZetroBriefProvider implements ModuleProvider {
  constructor(private readonly databasePath: string) {}

  readonly manifest = {
    id: "zetro.brief",
    owner: "apps/devkits/zetro/api/modules/brief",
    version: "1.0.22",
    dependencies: ["zetro.chat"],
    contracts: ["zetro.brief"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("zetro.brief", new BriefService(new BriefStore(this.databasePath), context.require<ZetroChatConversationReader>("zetro.chat")));
  }

  stop(context: ProviderLifecycleContext): void {
    context.require<BriefService>("zetro.brief").close();
  }
}
