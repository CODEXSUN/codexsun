import type { ModuleProvider, ProviderLifecycleContext, ProviderRegistrationContext } from "@codexsun/framework";
import { ZunoHandoffService } from "./handoff-service.js";
import { ZunoHandoffStore } from "./handoff-store.js";

export class ZunoHandoffProvider implements ModuleProvider {
  constructor(private readonly databasePath: string) {}

  readonly manifest = { id: "zuno.handoff", owner: "apps/devkits/zuno/api/modules/handoff", version: "1.0.0", dependencies: ["zuno.foundation"], contracts: ["zuno.handoff"], events: { published: [], consumed: [] } };

  register(context: ProviderRegistrationContext): void {
    context.provide("zuno.handoff", new ZunoHandoffService(new ZunoHandoffStore(this.databasePath)));
  }

  stop(context: ProviderLifecycleContext): void {
    context.require<ZunoHandoffService>("zuno.handoff").close();
  }
}
