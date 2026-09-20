import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  AssignItemAllergen, AssignItemModifierGroup, CreateAllergenTag, CreateModifierGroup, CreateModifierOption,
} from "../contracts/menu.contract.js";

export class MenuCustomizationRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async modifierGroupExists(businessId: string, groupId: string): Promise<boolean> {
    return Boolean(await this.database.selectFrom("qcafe_modifier_groups").select("id")
      .where("id", "=", groupId).where("business_id", "=", businessId).executeTakeFirst());
  }

  async allergenTagExists(businessId: string, allergenTagId: string): Promise<boolean> {
    return Boolean(await this.database.selectFrom("qcafe_allergen_tags").select("id")
      .where("id", "=", allergenTagId).where("business_id", "=", businessId).executeTakeFirst());
  }

  async itemTargetExists(businessId: string, itemId: string, variantId?: string): Promise<boolean> {
    const item = await this.database.selectFrom("qcafe_menu_items").select("id")
      .where("id", "=", itemId).where("business_id", "=", businessId).executeTakeFirst();
    if (!item) return false;
    if (!variantId) return true;
    return Boolean(await this.database.selectFrom("qcafe_menu_variants").select("id")
      .where("id", "=", variantId).where("item_id", "=", itemId).executeTakeFirst());
  }

  async createModifierGroup(input: CreateModifierGroup, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_modifier_groups").values({
      active: 1, business_id: input.businessId, code: input.code, created_at: now, id,
      max_selections: input.maxSelections, min_selections: input.minSelections, name: input.name,
      updated_at: now, version: 1,
    }).execute();
    return id;
  }

  async createModifierOption(input: CreateModifierOption, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_modifier_options").values({
      active: 1, code: input.code, created_at: now, group_id: input.groupId, id, name: input.name,
      price_adjustment_minor: input.priceAdjustmentMinor, stock_item_ref: input.stockItemRef ?? null,
      updated_at: now, version: 1,
    }).execute();
    return id;
  }

  async assignModifierGroup(input: AssignItemModifierGroup, now: string): Promise<string> {
    let existingQuery = this.database.selectFrom("qcafe_item_modifier_groups").select("id")
      .where("item_id", "=", input.itemId).where("group_id", "=", input.groupId);
    existingQuery = input.variantId
      ? existingQuery.where("variant_id", "=", input.variantId)
      : existingQuery.where("variant_id", "is", null);
    const existing = await existingQuery.executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.database.insertInto("qcafe_item_modifier_groups").values({
      created_at: now, group_id: input.groupId, id, item_id: input.itemId, sort_order: input.sortOrder,
      updated_at: now, variant_id: input.variantId ?? null, version: 1,
    }).execute();
    return id;
  }

  async createAllergenTag(input: CreateAllergenTag, now: string): Promise<string> {
    const id = randomUUID();
    await this.database.insertInto("qcafe_allergen_tags").values({
      business_id: input.businessId, code: input.code, created_at: now, id, name: input.name,
      severity: input.severity, updated_at: now, version: 1,
    }).execute();
    return id;
  }

  async assignAllergen(input: AssignItemAllergen, now: string): Promise<string> {
    let existingQuery = this.database.selectFrom("qcafe_item_allergens").select("id")
      .where("item_id", "=", input.itemId).where("allergen_tag_id", "=", input.allergenTagId);
    existingQuery = input.variantId
      ? existingQuery.where("variant_id", "=", input.variantId)
      : existingQuery.where("variant_id", "is", null);
    const existing = await existingQuery.executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.database.insertInto("qcafe_item_allergens").values({
      allergen_tag_id: input.allergenTagId, created_at: now, id, item_id: input.itemId,
      note: input.note ?? null, updated_at: now, variant_id: input.variantId ?? null, version: 1,
    }).execute();
    return id;
  }
}
