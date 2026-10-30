import type { FastifyRequest } from "fastify";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import type { SpecialSettings } from "./special.types.js";
import { SpecialRepository } from "./special.repository.js";
export class SpecialService {
  constructor(private readonly dependencies: QCafeDependencies) {}
  async get(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    return new SpecialRepository(context.database).get();
  }
  async save(request: FastifyRequest, input: SpecialSettings) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.manage");
    return new SpecialRepository(context.database).save(input, context.actorEmail);
  }
}
