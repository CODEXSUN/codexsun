import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class MailerModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "mailer.module",
    owner: "packages/addons/mailer/modules/mailer",
    version: "1.0.0",
    dependencies: ["mailer.provider"],
    contracts: ["mailer.v1"],
    events: { published: ["mailer.email.sent"], consumed: ["mailer.email.failed"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
