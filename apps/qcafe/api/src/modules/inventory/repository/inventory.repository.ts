import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { CreateStockItem, CreateStockUnit, InventoryScope } from "../contracts/inventory.contract.js";
import type { QcafeInventoryDatabase } from "../persistence/inventory.database.js";

export class InventoryRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  location(scope: InventoryScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  unit(id: string) {
    return this.db.selectFrom("qcafe_stock_units").selectAll().where("id", "=", id).executeTakeFirst();
  }

  menuItem(id: string) {
    return this.db.selectFrom("qcafe_menu_items").selectAll().where("id", "=", id).executeTakeFirst();
  }

  menuVariant(id: string) {
    return this.db.selectFrom("qcafe_menu_variants").selectAll().where("id", "=", id).executeTakeFirst();
  }

  private recipesDb() {
    return this.db as unknown as Kysely<QcafeInventoryDatabase>;
  }

  recipe(id: string) {
    return this.recipesDb().selectFrom("qcafe_recipes").selectAll().where("id", "=", id).executeTakeFirst();
  }

  recipeComponents(recipeId: string) {
    return this.recipesDb()
      .selectFrom("qcafe_recipe_components")
      .selectAll()
      .where("recipe_id", "=", recipeId)
      .execute();
  }

  async latestRevision(businessId: string, code: string) {    return this.recipesDb()
      .selectFrom("qcafe_recipes")
      .selectAll()
      .where("business_id", "=", businessId)
      .where("code", "=", code)
      .orderBy("revision_no", "desc")
      .executeTakeFirst();
  }

  item(id: string) {
    return this.db.selectFrom("qcafe_stock_items").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async workspace(scope: InventoryScope) {
    const units = await this.db
      .selectFrom("qcafe_stock_units")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("code")
      .execute();
    const items = await this.db
      .selectFrom("qcafe_stock_items")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("code")
      .execute();
    const adjustments = await this.db
      .selectFrom("qcafe_stock_adjustments")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("occurred_at", "desc")
      .execute();
    const movements = await this.db
      .selectFrom("qcafe_stock_movements")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("occurred_at", "desc")
      .execute();
    const totals = new Map<string, number>();
    for (const movement of movements) {
      totals.set(movement.stock_item_id, (totals.get(movement.stock_item_id) ?? 0) + movement.quantity_milli);
    }
    const recipes = await this.recipesDb()
      .selectFrom("qcafe_recipes")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("code")
      .orderBy("revision_no", "desc")
      .execute();
    const recipeIds = recipes.map((recipe) => recipe.id);
    const plans = await this.recipesDb()
      .selectFrom("qcafe_daily_plans")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("plan_date", "desc")
      .execute();
    const planIds = plans.map((plan) => plan.id);
    return {
      adjustments,
      balances: [...totals].map(([stockItemId, quantityMilli]) => ({ quantityMilli, stockItemId })),
      items,
      movements,
      planLines: planIds.length
        ? await this.recipesDb()
            .selectFrom("qcafe_daily_plan_lines")
            .selectAll()
            .where("plan_id", "in", planIds)
            .execute()
        : [],
      plans,
      recipeComponents: recipeIds.length
        ? await this.recipesDb()
            .selectFrom("qcafe_recipe_components")
            .selectAll()
            .where("recipe_id", "in", recipeIds)
            .execute()
        : [],
      recipes,
      units,
    };
  }

  async createUnit(input: CreateStockUnit, now: string) {
    const existing = await this.db
      .selectFrom("qcafe_stock_units")
      .select("id")
      .where("business_id", "=", input.businessId)
      .where("code", "=", input.code)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_stock_units")
      .values({
        active: 1,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        id,
        name: input.name,
        symbol: input.symbol ?? null,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async createItem(input: CreateStockItem, now: string) {
    const existing = await this.db
      .selectFrom("qcafe_stock_items")
      .select("id")
      .where("business_id", "=", input.businessId)
      .where("code", "=", input.code)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.db
      .insertInto("qcafe_stock_items")
      .values({
        active: 1,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        id,
        name: input.name,
        reorder_level_milli: input.reorderLevelMilli,
        track_stock: input.trackStock ? 1 : 0,
        unit_id: input.unitId,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async recordAdjustment(
    scope: InventoryScope,
    lines: ReadonlyArray<{ quantityMilli: number; stockItemId: string }>,
    reason: string,
    actor: string,
    approvedBy: string | undefined,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const adjustmentId = randomUUID();
      await tx
        .insertInto("qcafe_stock_adjustments")
        .values({
          approved_by: approvedBy ?? null,
          business_id: scope.businessId,
          created_by: actor,
          id: adjustmentId,
          location_id: scope.locationId,
          occurred_at: now,
          reason,
        })
        .execute();
      await tx
        .insertInto("qcafe_stock_movements")
        .values(
          lines.map((line) => ({
            actor_ref: actor,
            business_id: scope.businessId,
            id: randomUUID(),
            location_id: scope.locationId,
            movement_type: (line.quantityMilli > 0 ? "adjustment_in" : "adjustment_out") as
              "adjustment_in" | "adjustment_out",
            occurred_at: now,
            quantity_milli: line.quantityMilli,
            reason,
            source_id: adjustmentId,
            source_type: "adjustment" as const,
            stock_item_id: line.stockItemId,
          })),
        )
        .execute();
      return adjustmentId;
    });
  }

  async createRecipe(
    input: {
      businessId: string;
      changeReason?: string;
      code: string;
      components: ReadonlyArray<{ note?: string; quantityMilli: number; stockItemId: string }>;
      effectiveFrom: string;
      effectiveTo?: string;
      menuItemId: string;
      menuVariantId?: string;
      name: string;
    },
    revisionNo: number,
    sourceRecipeId: string | null,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const recipes = tx as unknown as Kysely<QcafeInventoryDatabase>;
      const id = randomUUID();
      await recipes
        .insertInto("qcafe_recipes")
        .values({
          business_id: input.businessId,
          change_reason: input.changeReason ?? null,
          code: input.code,
          created_at: now,
          created_by: actor,
          effective_from: input.effectiveFrom,
          effective_to: input.effectiveTo ?? null,
          id,
          menu_item_id: input.menuItemId,
          menu_variant_id: input.menuVariantId ?? null,
          name: input.name,
          revision_no: revisionNo,
          source_recipe_id: sourceRecipeId,
          status: "active",
          updated_at: now,
        })
        .execute();
      await recipes
        .insertInto("qcafe_recipe_components")
        .values(
          input.components.map((component) => ({
            created_at: now,
            id: randomUUID(),
            note: component.note ?? null,
            quantity_milli: component.quantityMilli,
            recipe_id: id,
            stock_item_id: component.stockItemId,
          })),
        )
        .execute();
      if (sourceRecipeId) {
        await recipes
          .updateTable("qcafe_recipes")
          .set({ status: "superseded", updated_at: now })
          .where("id", "=", sourceRecipeId)
          .execute();
      }
      return id;
    });
  }

  dailyPlan(id: string) {
    return this.recipesDb().selectFrom("qcafe_daily_plans").selectAll().where("id", "=", id).executeTakeFirst();
  }

  planForDate(locationId: string, planDate: string) {
    return this.recipesDb()
      .selectFrom("qcafe_daily_plans")
      .select("id")
      .where("location_id", "=", locationId)
      .where("plan_date", "=", planDate)
      .executeTakeFirst();
  }

  async createDailyPlan(scope: InventoryScope, planDate: string, note: string | undefined, actor: string, now: string) {
    const id = randomUUID();
    await this.recipesDb()
      .insertInto("qcafe_daily_plans")
      .values({
        business_id: scope.businessId,
        created_at: now,
        created_by: actor,
        id,
        location_id: scope.locationId,
        note: note ?? null,
        plan_date: planDate,
        status: "draft",
        updated_at: now,
      })
      .execute();
    return id;
  }

  async addDailyPlanLine(
    planId: string,
    line: { demandRef?: string; demandSource: "regular" | "special" | "booking" | "event"; menuItemId: string; menuVariantId?: string; note?: string; quantityMilli: number },
    now: string,
  ) {
    const id = randomUUID();
    await this.recipesDb()
      .insertInto("qcafe_daily_plan_lines")
      .values({
        created_at: now,
        demand_ref: line.demandRef ?? null,
        demand_source: line.demandSource,
        id,
        menu_item_id: line.menuItemId,
        menu_variant_id: line.menuVariantId ?? null,
        note: line.note ?? null,
        plan_id: planId,
        quantity_milli: line.quantityMilli,
      })
      .execute();
    return id;
  }

  async confirmDailyPlan(planId: string, now: string) {
    await this.recipesDb()
      .updateTable("qcafe_daily_plans")
      .set({ status: "confirmed", updated_at: now })
      .where("id", "=", planId)
      .execute();
  }
}
