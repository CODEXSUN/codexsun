import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDependencies } from "../../cloud/runtime.js";
import { MenuRepository } from "./menu.repository.js";
import type { MenuSave } from "./menu.types.js";

export class MenuService {
  constructor(private readonly dependencies: QCafeDependencies) {}

  async list(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    return new MenuRepository(context.database).list();
  }

  async save(request: FastifyRequest, input: MenuSave, uuid?: string) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.manage");
    try {
      const item = await new MenuRepository(context.database).save(
        { ...input, code: input.code.trim().toUpperCase() },
        context.actorEmail,
        uuid
      );
      if (!item) throw AppError.notFound("Menu item was not found.");
      return item;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
        throw AppError.conflict("This menu code already exists. Choose a different code.");
      }
      throw error;
    }
  }
}
