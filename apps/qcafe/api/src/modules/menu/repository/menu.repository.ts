import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  CreateMenuCategory,
  CreateMenuItem,
  CreateMenuVariant,
  CreatePriceBook,
  MenuCatalog,
  MenuPrice,
  SetMenuPrice,
} from "../contracts/menu.contract.js";

export class MenuRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async list(businessId: string): Promise<MenuCatalog> {
    const [
      categories,
      items,
      variants,
      priceBooks,
      prices,
      media,
      availability,
      modifierGroups,
      modifierOptions,
      itemModifierGroups,
      allergenTags,
      itemAllergens,
      specialCampaigns,
      specialPrices,
    ] = await Promise.all([
      this.database
        .selectFrom("qcafe_menu_categories")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("sort_order")
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("qcafe_menu_items")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("qcafe_menu_variants")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_menu_variants.item_id")
        .select([
          "qcafe_menu_variants.id",
          "qcafe_menu_variants.item_id",
          "qcafe_menu_variants.code",
          "qcafe_menu_variants.name",
          "qcafe_menu_variants.active",
        ])
        .where("qcafe_menu_items.business_id", "=", businessId)
        .orderBy("qcafe_menu_variants.name")
        .execute(),
      this.database
        .selectFrom("qcafe_price_books")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("qcafe_menu_prices")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_menu_prices.item_id")
        .selectAll("qcafe_menu_prices")
        .where("qcafe_menu_items.business_id", "=", businessId)
        .orderBy("valid_from", "desc")
        .execute(),
      this.database
        .selectFrom("qcafe_menu_item_media")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_menu_item_media.item_id")
        .innerJoin("qcafe_media_assets", "qcafe_media_assets.id", "qcafe_menu_item_media.media_asset_id")
        .select([
          "qcafe_menu_item_media.id",
          "qcafe_menu_item_media.item_id",
          "qcafe_menu_item_media.variant_id",
          "qcafe_menu_item_media.usage",
          "qcafe_menu_item_media.sort_order",
          "qcafe_media_assets.id as asset_id",
          "qcafe_media_assets.checksum",
          "qcafe_media_assets.mime_type",
          "qcafe_media_assets.width",
          "qcafe_media_assets.height",
          "qcafe_media_assets.status",
        ])
        .where("qcafe_menu_items.business_id", "=", businessId)
        .orderBy("qcafe_menu_item_media.sort_order")
        .execute(),
      this.database
        .selectFrom("qcafe_item_availability")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_item_availability.item_id")
        .selectAll("qcafe_item_availability")
        .where("qcafe_menu_items.business_id", "=", businessId)
        .orderBy("qcafe_item_availability.starts_at", "desc")
        .execute(),
      this.database
        .selectFrom("qcafe_modifier_groups")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("qcafe_modifier_options")
        .innerJoin("qcafe_modifier_groups", "qcafe_modifier_groups.id", "qcafe_modifier_options.group_id")
        .selectAll("qcafe_modifier_options")
        .where("qcafe_modifier_groups.business_id", "=", businessId)
        .orderBy("qcafe_modifier_options.name")
        .execute(),
      this.database
        .selectFrom("qcafe_item_modifier_groups")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_item_modifier_groups.item_id")
        .selectAll("qcafe_item_modifier_groups")
        .where("qcafe_menu_items.business_id", "=", businessId)
        .orderBy("qcafe_item_modifier_groups.sort_order")
        .execute(),
      this.database
        .selectFrom("qcafe_allergen_tags")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("name")
        .execute(),
      this.database
        .selectFrom("qcafe_item_allergens")
        .innerJoin("qcafe_menu_items", "qcafe_menu_items.id", "qcafe_item_allergens.item_id")
        .selectAll("qcafe_item_allergens")
        .where("qcafe_menu_items.business_id", "=", businessId)
        .execute(),
      this.database
        .selectFrom("qcafe_special_campaigns")
        .selectAll()
        .where("business_id", "=", businessId)
        .orderBy("starts_at", "desc")
        .execute(),
      this.database
        .selectFrom("qcafe_special_prices")
        .innerJoin("qcafe_special_campaigns", "qcafe_special_campaigns.id", "qcafe_special_prices.campaign_id")
        .selectAll("qcafe_special_prices")
        .where("qcafe_special_campaigns.business_id", "=", businessId)
        .execute(),
    ]);
    return {
      allergenTags: allergenTags.map((row) => ({ code: row.code, id: row.id, name: row.name, severity: row.severity })),
      availability: availability.map((row) => ({
        endsAt: row.ends_at,
        id: row.id,
        itemId: row.item_id,
        locationId: row.location_id,
        reason: row.reason,
        serviceChannelId: row.service_channel_id,
        startsAt: row.starts_at,
        status: row.status,
        variantId: row.variant_id,
      })),
      categories: categories.map((row) => ({
        active: row.active === 1,
        code: row.code,
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
      })),
      items: items.map((row) => ({
        active: row.active === 1,
        businessId: row.business_id,
        categoryId: row.category_id,
        code: row.code,
        id: row.id,
        itemType: row.item_type,
        name: row.name,
        taxCode: row.tax_code,
        variants: variants
          .filter((variant) => variant.item_id === row.id)
          .map((variant) => ({ active: variant.active === 1, code: variant.code, id: variant.id, name: variant.name })),
      })),
      itemAllergens: itemAllergens.map((row) => ({
        allergenTagId: row.allergen_tag_id,
        id: row.id,
        itemId: row.item_id,
        note: row.note,
        variantId: row.variant_id,
      })),
      itemModifierGroups: itemModifierGroups.map((row) => ({
        groupId: row.group_id,
        id: row.id,
        itemId: row.item_id,
        sortOrder: row.sort_order,
        variantId: row.variant_id,
      })),
      media: media.map((row) => ({
        assetId: row.asset_id,
        checksum: row.checksum,
        height: row.height,
        id: row.id,
        itemId: row.item_id,
        mimeType: row.mime_type,
        sortOrder: row.sort_order,
        status: row.status,
        usage: row.usage,
        variantId: row.variant_id,
        width: row.width,
      })),
      modifierGroups: modifierGroups.map((row) => ({
        active: row.active === 1,
        code: row.code,
        id: row.id,
        maxSelections: row.max_selections,
        minSelections: row.min_selections,
        name: row.name,
        options: modifierOptions
          .filter((option) => option.group_id === row.id)
          .map((option) => ({
            active: option.active === 1,
            code: option.code,
            groupId: option.group_id,
            id: option.id,
            name: option.name,
            priceAdjustmentMinor: option.price_adjustment_minor,
            stockItemRef: option.stock_item_ref,
          })),
      })),
      priceBooks: priceBooks.map((row) => ({
        active: row.active === 1,
        code: row.code,
        currency: row.currency,
        id: row.id,
        name: row.name,
      })),
      prices: prices.map(toMenuPrice),
      specialCampaigns: specialCampaigns.map((row) => ({
        businessId: row.business_id,
        endsAt: row.ends_at,
        id: row.id,
        locationId: row.location_id,
        name: row.name,
        priority: row.priority,
        scope: row.scope,
        startsAt: row.starts_at,
        status: row.status,
      })),
      specialPrices: specialPrices.map((row) => ({
        amountMinor: row.amount_minor,
        campaignId: row.campaign_id,
        discountBasisPoints: row.discount_basis_points,
        id: row.id,
        itemId: row.item_id,
        usageLimit: row.usage_limit,
        usedCount: row.used_count,
        variantId: row.variant_id,
      })),
    };
  }

  async mediaTargetExists(businessId: string, itemId: string, variantId?: string): Promise<boolean> {
    const item = await this.database
      .selectFrom("qcafe_menu_items")
      .select("id")
      .where("id", "=", itemId)
      .where("business_id", "=", businessId)
      .executeTakeFirst();
    if (!item) return false;
    if (!variantId) return true;
    return Boolean(
      await this.database
        .selectFrom("qcafe_menu_variants")
        .select("id")
        .where("id", "=", variantId)
        .where("item_id", "=", itemId)
        .executeTakeFirst(),
    );
  }

  async attachMedia(
    input: {
      businessId: string;
      checksum: string;
      height?: number;
      itemId: string;
      mimeType: string;
      objectReference: string;
      sortOrder: number;
      usage: "delivery" | "menu" | "qr";
      variantId?: string;
      width?: number;
    },
    now: string,
  ): Promise<string> {
    return this.database.transaction().execute(async (transaction) => {
      const existingAsset = await transaction
        .selectFrom("qcafe_media_assets")
        .select("id")
        .where("business_id", "=", input.businessId)
        .where("storage_object_ref", "=", input.objectReference)
        .executeTakeFirst();
      const assetId = existingAsset?.id ?? randomUUID();
      if (!existingAsset) {
        await transaction
          .insertInto("qcafe_media_assets")
          .values({
            business_id: input.businessId,
            checksum: input.checksum,
            created_at: now,
            height: input.height ?? null,
            id: assetId,
            mime_type: input.mimeType,
            status: "active",
            storage_object_ref: input.objectReference,
            updated_at: now,
            version: 1,
            width: input.width ?? null,
          })
          .execute();
      }
      const existingLink = await transaction
        .selectFrom("qcafe_menu_item_media")
        .select("id")
        .where("item_id", "=", input.itemId)
        .where("media_asset_id", "=", assetId)
        .where("usage", "=", input.usage)
        .executeTakeFirst();
      if (existingLink) return existingLink.id;
      const id = randomUUID();
      await transaction
        .insertInto("qcafe_menu_item_media")
        .values({
          created_at: now,
          id,
          item_id: input.itemId,
          media_asset_id: assetId,
          sort_order: input.sortOrder,
          updated_at: now,
          usage: input.usage,
          variant_id: input.variantId ?? null,
          version: 1,
        })
        .execute();
      return id;
    });
  }

  async findMediaAsset(assetId: string, businessId: string) {
    return this.database
      .selectFrom("qcafe_media_assets")
      .select(["storage_object_ref", "mime_type"])
      .where("id", "=", assetId)
      .where("business_id", "=", businessId)
      .where("status", "=", "active")
      .executeTakeFirst();
  }

  async createCategory(input: CreateMenuCategory, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_menu_categories")
      .values({
        active: 1,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        id,
        name: input.name,
        parent_id: null,
        sort_order: input.sortOrder,
        updated_at: now,
        version: 1,
      })
      .execute();
    return id;
  }
  async createItem(input: CreateMenuItem, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_menu_items")
      .values({
        active: 1,
        business_id: input.businessId,
        category_id: input.categoryId,
        code: input.code,
        created_at: now,
        id,
        item_type: input.itemType,
        name: input.name,
        tax_code: input.taxCode ?? null,
        updated_at: now,
        version: 1,
      })
      .execute();
    return id;
  }
  async createVariant(input: CreateMenuVariant, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_menu_variants")
      .values({
        active: 1,
        code: input.code,
        created_at: now,
        id,
        item_id: input.itemId,
        name: input.name,
        quantity_basis_milli: 1000,
        updated_at: now,
        version: 1,
      })
      .execute();
    return id;
  }
  async createPriceBook(input: CreatePriceBook, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_price_books")
      .values({
        active: 1,
        business_id: input.businessId,
        code: input.code,
        created_at: now,
        currency: input.currency,
        id,
        location_id: null,
        name: input.name,
        service_channel_id: null,
        status: "active",
        updated_at: now,
        valid_from: now.slice(0, 10),
        valid_to: null,
        version: 1,
      })
      .execute();
    return id;
  }
  async setPrice(input: SetMenuPrice, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_menu_prices")
      .values({
        active: 1,
        amount_minor: input.amountMinor,
        created_at: now,
        id,
        item_id: input.itemId,
        location_id: input.locationId ?? null,
        price_book_id: input.priceBookId,
        service_channel_id: input.serviceChannelId ?? null,
        tax_included: 0,
        updated_at: now,
        valid_from: input.validFrom,
        valid_to: input.validTo ?? null,
        variant_id: input.variantId ?? null,
        version: 1,
      })
      .execute();
    return id;
  }
  async findEffectivePrice(input: {
    businessDate: string;
    itemId: string;
    locationId?: string;
    priceBookId: string;
    serviceChannelId?: string;
    variantId?: string;
  }): Promise<MenuPrice | null> {
    const rows = await this.database
      .selectFrom("qcafe_menu_prices")
      .selectAll()
      .where("price_book_id", "=", input.priceBookId)
      .where("item_id", "=", input.itemId)
      .where("active", "=", 1)
      .where("valid_from", "<=", input.businessDate)
      .execute();
    const candidates = rows.filter(
      (row) =>
        (!row.valid_to || row.valid_to >= input.businessDate) &&
        (row.variant_id === null || row.variant_id === (input.variantId ?? null)) &&
        (row.location_id === null || row.location_id === (input.locationId ?? null)) &&
        (row.service_channel_id === null || row.service_channel_id === (input.serviceChannelId ?? null)),
    );
    candidates.sort(
      (left, right) =>
        specificity(right) - specificity(left) ||
        right.valid_from.localeCompare(left.valid_from) ||
        right.created_at.localeCompare(left.created_at),
    );
    return candidates[0] ? toMenuPrice(candidates[0]) : null;
  }
}

function specificity(row: QcafeFoundationDatabase["qcafe_menu_prices"]): number {
  return (
    Number(Boolean(row.variant_id)) * 4 + Number(Boolean(row.location_id)) * 2 + Number(Boolean(row.service_channel_id))
  );
}
function toMenuPrice(row: QcafeFoundationDatabase["qcafe_menu_prices"]): MenuPrice {
  return {
    active: row.active === 1,
    amountMinor: row.amount_minor,
    id: row.id,
    itemId: row.item_id,
    locationId: row.location_id,
    priceBookId: row.price_book_id,
    serviceChannelId: row.service_channel_id,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    variantId: row.variant_id,
  };
}
