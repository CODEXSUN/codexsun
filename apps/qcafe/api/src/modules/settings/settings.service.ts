import type { FastifyRequest } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import type { CafeSettings } from "./settings.types.js";
import { SettingsRepository } from "./settings.repository.js";
export class SettingsService {
  constructor(private readonly dependencies: QCafeDependencies) {}
  async get(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    return new SettingsRepository(context.database).get();
  }
  async save(request: FastifyRequest, input: CafeSettings) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.manage");
    return new SettingsRepository(context.database).save(input, context.actorEmail);
  }
}
