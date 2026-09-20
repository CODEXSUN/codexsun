import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  AssignItemAllergen, AssignItemModifierGroup, CreateAllergenTag, CreateModifierGroup, CreateModifierOption,
} from "../contracts/menu.contract.js";
import { MenuCustomizationRepository } from "../repository/menu-customization.repository.js";
import { MenuConflictError, MenuService } from "./menu.service.js";

export class MenuCustomizationService {
  constructor(
    private readonly repository: MenuCustomizationRepository,
    private readonly menu: MenuService,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async createModifierGroup(input: CreateModifierGroup, context: CommandContext) {
    if (input.minSelections > input.maxSelections) throw new MenuConflictError("Minimum selections cannot exceed maximum selections.");
    return this.run(input.businessId, context, "qcafe.menu.modifier-group.created", "modifier-group", () =>
      this.repository.createModifierGroup(input, this.now().toISOString()));
  }

  async createModifierOption(input: CreateModifierOption, context: CommandContext) {
    if (!(await this.repository.modifierGroupExists(input.businessId, input.groupId))) throw new MenuConflictError("The modifier group does not belong to this business.");
    return this.run(input.businessId, context, "qcafe.menu.modifier-option.created", "modifier-option", () =>
      this.repository.createModifierOption(input, this.now().toISOString()));
  }

  async assignModifierGroup(input: AssignItemModifierGroup, context: CommandContext) {
    const [group, item] = await Promise.all([
      this.repository.modifierGroupExists(input.businessId, input.groupId),
      this.repository.itemTargetExists(input.businessId, input.itemId, input.variantId),
    ]);
    if (!group || !item) throw new MenuConflictError("The modifier group, item, or variant is invalid.");
    return this.run(input.businessId, context, "qcafe.menu.modifier-group.assigned", "item-modifier-group", () =>
      this.repository.assignModifierGroup(input, this.now().toISOString()));
  }

  async createAllergenTag(input: CreateAllergenTag, context: CommandContext) {
    return this.run(input.businessId, context, "qcafe.menu.allergen-tag.created", "allergen-tag", () =>
      this.repository.createAllergenTag(input, this.now().toISOString()));
  }

  async assignAllergen(input: AssignItemAllergen, context: CommandContext) {
    const [tag, item] = await Promise.all([
      this.repository.allergenTagExists(input.businessId, input.allergenTagId),
      this.repository.itemTargetExists(input.businessId, input.itemId, input.variantId),
    ]);
    if (!tag || !item) throw new MenuConflictError("The allergen tag, item, or variant is invalid.");
    return this.run(input.businessId, context, "qcafe.menu.allergen.assigned", "item-allergen", () =>
      this.repository.assignAllergen(input, this.now().toISOString()));
  }

  private async run(
    businessId: string,
    context: CommandContext,
    eventType: string,
    subjectType: string,
    command: () => Promise<string>,
  ) {
    try {
      const subjectId = await command();
      await this.activity.record(context, { eventType, subjectId, subjectType });
      return await this.menu.read(businessId);
    } catch (error) {
      if (error instanceof MenuConflictError) throw error;
      throw new MenuConflictError("The menu customization conflicts with existing setup or references.");
    }
  }
}
