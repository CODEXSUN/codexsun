import { type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";
import type { StorageProvider } from "@codexsun/platform-core";
import { OperationsService } from "./service/operations.service.js";

export class OperationsModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "platform.operations",
    owner: "apps/platform/api/modules/operations",
    version: "1.0.9",
    dependencies: ["platform.core"],
    contracts: ["platform.operations.audit", "platform.operations.storage", "platform.operations.outbox", "platform.operations.jobs", "platform.operations.notifications"],
    events: { published: ["platform.operation-recorded.v1"], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("operations.service", new OperationsService(context.require<StorageProvider>("storage")));
  }
}
