import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { WaiterRepository } from "./waiter.repository.js";
import type { WaiterSave } from "./waiter.types.js";
export class WaiterService {
  constructor(private readonly deps: QCafeDependencies) {}
  async list(request: FastifyRequest) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new WaiterRepository(ctx.database).list();
  }
  async save(request: FastifyRequest, input: WaiterSave, uuid?: string) {
    const ctx = await this.deps.resolveContext(request);
    await ctx.authorize("qcafe.waiter.manage");
    try {
      const result = await new WaiterRepository(ctx.database).save(input, ctx.actorEmail, uuid);
      if (!result) throw AppError.notFound("Waiter was not found.");
      return result;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.conflict("Waiter code already exists.");
      throw error;
    }
  }
}
