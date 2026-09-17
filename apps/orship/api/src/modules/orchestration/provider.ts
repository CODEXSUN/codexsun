import { type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";
import { type StorageProvider } from "@codexsun/platform-core";
import { StorageOrchestrationAttemptRepository } from "./repository/orchestration-attempt.repository.js";
import { OrchestrationService } from "./service/orchestration.service.js";

export class OrshipOrchestrationProvider implements ModuleProvider {
  readonly manifest = {
    id: "orship.orchestration",
    owner: "apps/orship/api/modules/orchestration",
    version: "1.0.9",
    dependencies: ["platform.core"],
    contracts: ["orship.orchestration.attempt", "orship.orchestration.state"],
  };

  register(context: ProviderRegistrationContext): void {
    const storage = context.require<StorageProvider>("storage");
    const repository = new StorageOrchestrationAttemptRepository(storage.forModule("orship", "change-intake"));
    context.provide("orship.orchestration.service", new OrchestrationService(repository));
  }
}
