import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import type { CafeTableSave } from "./table.types.js";
import { TableRepository } from "./table.repository.js";
export class TableService {
  constructor(private readonly dependencies: QCafeDependencies) {}
  async list(request: FastifyRequest) {
    const ctx = await this.dependencies.resolveContext(request);
    await ctx.authorize("qcafe.pos.view");
    return new TableRepository(ctx.database).list();
  }
  async save(request: FastifyRequest, input: CafeTableSave, uuid?: string) {
    const ctx = await this.dependencies.resolveContext(request);
    await ctx.authorize("qcafe.table.manage");
    try {
      const item = await new TableRepository(ctx.database).save(input, ctx.actorEmail, uuid);
      if (!item) throw AppError.notFound("Table was not found.");
      return item;
    } catch (error) {
      if (error instanceof Error && error.message.includes("capacity"))
        throw AppError.conflict(error.message);
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.conflict("This table name already exists.");
      throw error;
    }
  }
}
