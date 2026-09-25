import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class ChattyModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "chatty.module",
    owner: "packages/addons/chatty/modules/chatty",
    version: "1.0.0",
    dependencies: ["chatty.provider"],
    contracts: ["chatty.v1"],
    events: { published: ["chatty.message.created"], consumed: ["chatty.channel.created"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
