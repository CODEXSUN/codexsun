import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  CreateSpecialCampaign,
  CreateSpecialPrice,
  EffectiveSaleabilityInput,
  MenuSpecialCampaign,
  MenuSpecialPrice,
} from "../contracts/menu.contract.js";

export type EffectiveSpecial = {
  campaign: MenuSpecialCampaign;
  specialPrice: MenuSpecialPrice;
};

export class MenuCampaignRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async campaignScopeExists(input: CreateSpecialCampaign): Promise<boolean> {
    if (input.scope === "business") {
      return Boolean(
        await this.database
          .selectFrom("qcafe_businesses")
          .select("id")
          .where("id", "=", input.businessId)
          .executeTakeFirst(),
      );
    }
    if (!input.locationId) return false;
    return Boolean(
      await this.database
        .selectFrom("qcafe_locations")
        .select("id")
        .where("id", "=", input.locationId)
        .where("business_id", "=", input.businessId)
        .executeTakeFirst(),
    );
  }

  async specialPriceScopeExists(input: CreateSpecialPrice): Promise<boolean> {
    const [campaign, item, variant] = await Promise.all([
      this.database
        .selectFrom("qcafe_special_campaigns")
        .select("id")
        .where("id", "=", input.campaignId)
        .where("business_id", "=", input.businessId)
        .executeTakeFirst(),
      this.database
        .selectFrom("qcafe_menu_items")
        .select("id")
        .where("id", "=", input.itemId)
        .where("business_id", "=", input.businessId)
        .executeTakeFirst(),
      input.variantId
        ? this.database
            .selectFrom("qcafe_menu_variants")
            .select("id")
            .where("id", "=", input.variantId)
            .where("item_id", "=", input.itemId)
            .executeTakeFirst()
        : Promise.resolve({ id: "base" }),
    ]);
    return Boolean(campaign && item && variant);
  }

  async specialPriceExists(input: CreateSpecialPrice): Promise<boolean> {
    let query = this.database
      .selectFrom("qcafe_special_prices")
      .select("id")
      .where("campaign_id", "=", input.campaignId)
      .where("item_id", "=", input.itemId);
    query = input.variantId ? query.where("variant_id", "=", input.variantId) : query.where("variant_id", "is", null);
    return Boolean(await query.executeTakeFirst());
  }

  async createCampaign(input: CreateSpecialCampaign, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_special_campaigns")
      .values({
        business_id: input.businessId,
        created_at: now,
        ends_at: input.endsAt,
        id,
        location_id: input.locationId ?? null,
        name: input.name,
        priority: input.priority,
        scope: input.scope,
        starts_at: input.startsAt,
        status: input.status,
        updated_at: now,
        version: 1,
      })
      .execute();
    return id;
  }

  async createSpecialPrice(input: CreateSpecialPrice, now: string): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto("qcafe_special_prices")
      .values({
        amount_minor: input.amountMinor ?? null,
        campaign_id: input.campaignId,
        created_at: now,
        discount_basis_points: input.discountBasisPoints ?? null,
        id,
        item_id: input.itemId,
        updated_at: now,
        usage_limit: input.usageLimit ?? null,
        used_count: 0,
        variant_id: input.variantId ?? null,
        version: 1,
      })
      .execute();
    return id;
  }

  async findEffective(input: EffectiveSaleabilityInput): Promise<EffectiveSpecial | null> {
    const rows = await this.database
      .selectFrom("qcafe_special_prices")
      .innerJoin("qcafe_special_campaigns", "qcafe_special_campaigns.id", "qcafe_special_prices.campaign_id")
      .select([
        "qcafe_special_campaigns.business_id",
        "qcafe_special_campaigns.ends_at",
        "qcafe_special_campaigns.id as campaign_id",
        "qcafe_special_campaigns.location_id",
        "qcafe_special_campaigns.name",
        "qcafe_special_campaigns.priority",
        "qcafe_special_campaigns.scope",
        "qcafe_special_campaigns.starts_at",
        "qcafe_special_campaigns.status",
        "qcafe_special_prices.amount_minor",
        "qcafe_special_prices.discount_basis_points",
        "qcafe_special_prices.id as special_price_id",
        "qcafe_special_prices.item_id",
        "qcafe_special_prices.usage_limit",
        "qcafe_special_prices.used_count",
        "qcafe_special_prices.variant_id",
      ])
      .where("qcafe_special_campaigns.business_id", "=", input.businessId)
      .where("qcafe_special_campaigns.status", "=", "active")
      .where("qcafe_special_campaigns.starts_at", "<=", input.at)
      .where("qcafe_special_campaigns.ends_at", ">", input.at)
      .where("qcafe_special_prices.item_id", "=", input.itemId)
      .execute();
    const candidates = rows.filter(
      (row) =>
        (row.scope === "business" || row.location_id === input.locationId) &&
        (row.variant_id === null || row.variant_id === (input.variantId ?? null)) &&
        (row.usage_limit === null || row.used_count < row.usage_limit),
    );
    candidates.sort(
      (left, right) =>
        right.priority - left.priority ||
        Number(Boolean(right.variant_id)) - Number(Boolean(left.variant_id)) ||
        Number(right.scope === "location") - Number(left.scope === "location") ||
        right.starts_at.localeCompare(left.starts_at) ||
        right.campaign_id.localeCompare(left.campaign_id),
    );
    const row = candidates[0];
    if (!row) return null;
    return {
      campaign: {
        businessId: row.business_id,
        endsAt: row.ends_at,
        id: row.campaign_id,
        locationId: row.location_id,
        name: row.name,
        priority: row.priority,
        scope: row.scope,
        startsAt: row.starts_at,
        status: row.status,
      },
      specialPrice: {
        amountMinor: row.amount_minor,
        campaignId: row.campaign_id,
        discountBasisPoints: row.discount_basis_points,
        id: row.special_price_id,
        itemId: row.item_id,
        usageLimit: row.usage_limit,
        usedCount: row.used_count,
        variantId: row.variant_id,
      },
    };
  }
}
