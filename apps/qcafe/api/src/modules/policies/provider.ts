import type { ModuleProvider } from "@codexsun/framework";

export class QcafePoliciesProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.policies",
    owner: "apps/qcafe/api/modules/policies",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["operational role policies"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
