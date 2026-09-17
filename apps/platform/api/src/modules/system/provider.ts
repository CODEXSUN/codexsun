import type { ModuleProvider, ProviderEngine } from "@codexsun/framework";
export class SystemModuleProvider implements ModuleProvider {
  readonly id = "platform.system";
  register(engine: ProviderEngine): void {
    engine.provide("platform.system", { name: "Platform System" });
  }
}
