import type { FastifyRequest } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { MenuDependencies } from "./menu.types.js";
import { MenuRepository } from "./menu.repository.js";
import type { MenuSave } from "./menu.types.js";
import { priceQCafeMenu } from "./menu.pricing.js";
import { MenuImages } from "./menu.images.js";

export class MenuService {
  constructor(private readonly dependencies: MenuDependencies) {}

  async list(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    return new MenuRepository(context.database).list();
  }

  async posMenu(request: FastifyRequest) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.view");
    return priceQCafeMenu(
      await new MenuRepository(context.database).list(),
      await this.dependencies.specialPolicy(context.database)
    );
  }

  async save(request: FastifyRequest, input: MenuSave, uuid?: string) {
    const context = await this.dependencies.resolveContext(request);
    await context.authorize("qcafe.menu.manage");
    if (uuid && (await this.dependencies.settingsPolicy(context.database)).imageWriteProtection) {
      const existing = (await new MenuRepository(context.database).list()).find(
        (item) => item.uuid === uuid
      );
      if (existing && (existing.imageUrl ?? "") !== (input.imageUrl ?? ""))
        throw AppError.forbidden("Menu images are write-protected in Settings.");
    }
    await new MenuImages(this.dependencies).validateReference(context.tenantId, input.imageUrl);
    if (input.specialPrices) {
      const policy = await this.dependencies.specialPolicy(context.database);
      const prefixes = input.specialPrices.map((item) => item.prefix);
      if (new Set(prefixes).size !== prefixes.length)
        throw AppError.validation("Choose each special only once.");
      if (
        prefixes.some(
          (prefix) => !policy.definitions.some((definition) => definition.prefix === prefix)
        )
      )
        throw AppError.validation(
          "Configure the Today Special in Settings before setting its price."
        );
    }
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
