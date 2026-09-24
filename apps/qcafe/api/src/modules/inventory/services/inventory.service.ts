import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  AddDailyPlanLine,
  CreateDailyPlan,
  CreateRecipe,
  CreateStockItem,
  CreateStockUnit,
  InventoryScope,
  PostStockAdjustment,
  ReviseRecipe,
} from "../contracts/inventory.contract.js";
import { InventoryRepository } from "../repository/inventory.repository.js";

export class InventoryConflictError extends Error {}

export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: InventoryScope) {
    return this.repo.workspace(scope);
  }

  async createUnit(input: CreateStockUnit, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new InventoryConflictError("The inventory outlet scope is invalid.");
    }
    const id = await this.repo.createUnit(input, this.timestamp());
    await this.record(context, "stock-unit.created", id, "stock-unit", { code: input.code });
    return { id };
  }

  async createItem(input: CreateStockItem, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new InventoryConflictError("The inventory outlet scope is invalid.");
    }
    const unit = await this.repo.unit(input.unitId);
    if (!unit || unit.business_id !== input.businessId || !unit.active) {
      throw new InventoryConflictError("The stock unit is invalid.");
    }
    const id = await this.repo.createItem(input, this.timestamp());
    await this.record(context, "stock-item.created", id, "stock-item", { code: input.code });
    return { id };
  }

  async adjust(input: PostStockAdjustment, context: CommandContext) {
    if (!input.lines.length) {
      throw new InventoryConflictError("A stock adjustment requires at least one line.");
    }
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new InventoryConflictError("The inventory outlet scope is invalid.");
    }
    const hasOutward = input.lines.some((line) => line.quantityMilli < 0);
    if (hasOutward && !input.approvedBy) {
      throw new InventoryConflictError("A stock reduction requires an approver.");
    }
    for (const line of input.lines) {
      const item = await this.repo.item(line.stockItemId);
      if (!item || item.business_id !== input.businessId || !item.active) {
        throw new InventoryConflictError("A stock item is invalid.");
      }
      if (!item.track_stock) {
        throw new InventoryConflictError("The stock item is not tracked.");
      }
    }
    const id = await this.repo.recordAdjustment(
      { businessId: input.businessId, locationId: input.locationId },
      input.lines,
      input.reason,
      context.actorId,
      input.approvedBy,
      this.timestamp(),
    );
    await this.record(context, "stock.adjusted", id, "stock-adjustment", {
      lines: input.lines.length,
      reason: input.reason,
    });
    return this.read({ businessId: input.businessId, locationId: input.locationId });
  }

  async createRecipe(input: CreateRecipe, context: CommandContext) {
    await this.assertRecipeTarget(input.businessId, input.locationId, input.menuItemId, input.menuVariantId);
    this.assertEffectiveRange(input.effectiveFrom, input.effectiveTo);
    await this.assertRecipeComponents(input.businessId, input.components);
    const existing = await this.repo.latestRevision(input.businessId, input.code);
    if (existing) throw new InventoryConflictError("The recipe code already exists. Revise it instead.");
    const id = await this.repo.createRecipe(input, 1, null, context.actorId, this.timestamp());
    await this.record(context, "recipe.created", id, "recipe", {
      code: input.code,
      effectiveFrom: input.effectiveFrom,
    });
    return { id };
  }

  async reviseRecipe(recipeId: string, input: ReviseRecipe, context: CommandContext) {
    const current = await this.repo.recipe(recipeId);
    if (!current) throw new InventoryConflictError("The recipe is invalid.");
    if (current.status !== "active") throw new InventoryConflictError("Only the active revision can be revised.");
    this.assertEffectiveRange(input.effectiveFrom, input.effectiveTo);
    if (input.effectiveFrom <= current.effective_from) {
      throw new InventoryConflictError("A revision requires a later effective date.");
    }
    const components =
      input.components ??
      (await this.repo.recipeComponents(recipeId)).map((row) => ({
        note: row.note ?? undefined,
        quantityMilli: row.quantity_milli,
        stockItemId: row.stock_item_id,
      }));
    if (!components.length) throw new InventoryConflictError("A recipe revision requires at least one component.");
    await this.assertRecipeComponents(
      current.business_id,
      components.map((component) => ({ ...component, note: component.note ?? undefined })),
    );
    const id = await this.repo.createRecipe(
      {
        businessId: current.business_id,
        changeReason: input.changeReason,
        code: current.code,
        components: components.map((component) => ({ ...component, note: component.note ?? undefined })),
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
        menuItemId: current.menu_item_id,
        menuVariantId: current.menu_variant_id ?? undefined,
        name: current.name,
      },
      current.revision_no + 1,
      recipeId,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "recipe.revised", id, "recipe", {
      changeReason: input.changeReason,
      effectiveFrom: input.effectiveFrom,
      sourceRecipeId: recipeId,
    });
    return { id };
  }

  async createDailyPlan(input: CreateDailyPlan, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new InventoryConflictError("The inventory outlet scope is invalid.");
    }
    if (await this.repo.planForDate(input.locationId, input.planDate)) {
      throw new InventoryConflictError("A daily plan already exists for this date.");
    }
    const id = await this.repo.createDailyPlan(
      { businessId: input.businessId, locationId: input.locationId },
      input.planDate,
      input.note,
      context.actorId,
      this.timestamp(),
    );
    await this.record(context, "daily-plan.created", id, "daily-plan", { planDate: input.planDate });
    return { id };
  }

  async addDailyPlanLine(planId: string, input: AddDailyPlanLine, context: CommandContext) {
    const plan = await this.repo.dailyPlan(planId);
    if (!plan) throw new InventoryConflictError("The daily plan is invalid.");
    if (plan.status !== "draft") throw new InventoryConflictError("Only a draft plan accepts new lines.");
    const item = await this.repo.menuItem(input.menuItemId);
    if (!item || item.business_id !== plan.business_id || !item.active) {
      throw new InventoryConflictError("The plan menu item is invalid.");
    }
    if (input.menuVariantId) {
      const variant = await this.repo.menuVariant(input.menuVariantId);
      if (!variant || variant.item_id !== input.menuItemId || !variant.active) {
        throw new InventoryConflictError("The plan menu variant is invalid.");
      }
    }
    const id = await this.repo.addDailyPlanLine(planId, input, this.timestamp());
    await this.record(context, "daily-plan-line.added", id, "daily-plan-line", {
      demandSource: input.demandSource,
      planId,
    });
    return this.read({ businessId: plan.business_id, locationId: plan.location_id });
  }

  async confirmDailyPlan(planId: string, context: CommandContext) {
    const plan = await this.repo.dailyPlan(planId);
    if (!plan || plan.status !== "draft") throw new InventoryConflictError("Only a draft plan can be confirmed.");
    await this.repo.confirmDailyPlan(planId, this.timestamp());
    await this.record(context, "daily-plan.confirmed", planId, "daily-plan", { planDate: plan.plan_date });
    return this.read({ businessId: plan.business_id, locationId: plan.location_id });
  }

  private async assertRecipeTarget(businessId: string, locationId: string, menuItemId: string, menuVariantId?: string) {
    if (!(await this.repo.location({ businessId, locationId }))) {
      throw new InventoryConflictError("The inventory outlet scope is invalid.");
    }
    const item = await this.repo.menuItem(menuItemId);
    if (!item || item.business_id !== businessId || !item.active) {
      throw new InventoryConflictError("The recipe menu item is invalid.");
    }
    if (menuVariantId) {
      const variant = await this.repo.menuVariant(menuVariantId);
      if (!variant || variant.item_id !== menuItemId || !variant.active) {
        throw new InventoryConflictError("The recipe menu variant is invalid.");
      }
    }
  }

  private async assertRecipeComponents(
    businessId: string,
    components: ReadonlyArray<{ quantityMilli: number; stockItemId: string }>,
  ) {
    if (!components.length) throw new InventoryConflictError("A recipe requires at least one component.");
    const seen = new Set<string>();
    for (const component of components) {
      if (seen.has(component.stockItemId)) throw new InventoryConflictError("A recipe component is duplicated.");
      seen.add(component.stockItemId);
      const item = await this.repo.item(component.stockItemId);
      if (!item || item.business_id !== businessId || !item.active || !item.track_stock) {
        throw new InventoryConflictError("A recipe component stock item is invalid.");
      }
    }
  }

  private assertEffectiveRange(effectiveFrom: string, effectiveTo?: string) {
    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new InventoryConflictError("The recipe effective range is invalid.");
    }
  }

  private timestamp() {
    return this.now().toISOString();
  }

  private record(
    context: CommandContext,
    event: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, {
      eventType: `qcafe.inventory.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
