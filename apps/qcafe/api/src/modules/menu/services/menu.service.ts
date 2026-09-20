import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  CreateMenuCategory, CreateMenuItem, CreateMenuVariant, CreatePriceBook, MenuCatalog, SetMenuPrice,
} from "../contracts/menu.contract.js";
import { MenuRepository } from "../repository/menu.repository.js";

export class MenuConflictError extends Error {}

export class MenuService {
  constructor(
    private readonly repository: MenuRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(businessId: string): Promise<MenuCatalog> { return this.repository.list(businessId); }

  async createCategory(input: CreateMenuCategory, context: CommandContext): Promise<MenuCatalog> {
    return this.run(input.businessId, context, "qcafe.menu.category.created", "menu-category", () =>
      this.repository.createCategory(input, this.now().toISOString()));
  }
  async createItem(input: CreateMenuItem, context: CommandContext): Promise<MenuCatalog> {
    return this.run(input.businessId, context, "qcafe.menu.item.created", "menu-item", () =>
      this.repository.createItem(input, this.now().toISOString()));
  }
  async createVariant(input: CreateMenuVariant, businessId: string, context: CommandContext): Promise<MenuCatalog> {
    return this.run(businessId, context, "qcafe.menu.variant.created", "menu-variant", () =>
      this.repository.createVariant(input, this.now().toISOString()));
  }
  async createPriceBook(input: CreatePriceBook, context: CommandContext): Promise<MenuCatalog> {
    return this.run(input.businessId, context, "qcafe.menu.price-book.created", "price-book", () =>
      this.repository.createPriceBook(input, this.now().toISOString()));
  }
  async setPrice(input: SetMenuPrice, businessId: string, context: CommandContext): Promise<MenuCatalog> {
    if (input.validTo && input.validTo < input.validFrom) throw new MenuConflictError("Valid to must be on or after valid from.");
    return this.run(businessId, context, "qcafe.menu.price.created", "menu-price", () =>
      this.repository.setPrice(input, this.now().toISOString()));
  }
  findEffectivePrice(input: Parameters<MenuRepository["findEffectivePrice"]>[0]) {
    return this.repository.findEffectivePrice(input);
  }

  private async run(
    businessId: string,
    context: CommandContext,
    eventType: string,
    subjectType: string,
    command: () => Promise<string>,
  ): Promise<MenuCatalog> {
    try {
      const subjectId = await command();
      await this.activity.record(context, { eventType, subjectId, subjectType });
      return await this.read(businessId);
    } catch (error) {
      if (error instanceof MenuConflictError) throw error;
      throw new MenuConflictError("The menu record conflicts with existing setup or references.");
    }
  }
}
