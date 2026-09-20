import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { EffectiveSaleabilityInput } from "../contracts/menu.contract.js";

export type SaleabilityScope = {
  categoryActive: boolean;
  channelValid: boolean;
  invalidModifierGroupIds: string[];
  itemActive: boolean;
  itemFound: boolean;
  locationValid: boolean;
  priceBookEligible: boolean;
  variantActive: boolean;
  variantValid: boolean;
};

export class MenuSaleabilityRepository {
  constructor(private readonly database: Kysely<QcafeFoundationDatabase>) {}

  async inspect(input: EffectiveSaleabilityInput): Promise<SaleabilityScope> {
    const businessDate = input.at.slice(0, 10);
    const [item, location, channel, variant, priceBook, assignedGroups] = await Promise.all([
      this.database.selectFrom("qcafe_menu_items")
        .innerJoin("qcafe_menu_categories", "qcafe_menu_categories.id", "qcafe_menu_items.category_id")
        .select(["qcafe_menu_items.id", "qcafe_menu_items.active as item_active", "qcafe_menu_categories.active as category_active"])
        .where("qcafe_menu_items.id", "=", input.itemId)
        .where("qcafe_menu_items.business_id", "=", input.businessId)
        .executeTakeFirst(),
      this.database.selectFrom("qcafe_locations").select(["id", "status"])
        .where("id", "=", input.locationId).where("business_id", "=", input.businessId).executeTakeFirst(),
      input.serviceChannelId
        ? this.database.selectFrom("qcafe_service_channels").select(["id", "enabled"])
          .where("id", "=", input.serviceChannelId).where("location_id", "=", input.locationId).executeTakeFirst()
        : Promise.resolve(undefined),
      input.variantId
        ? this.database.selectFrom("qcafe_menu_variants").select(["id", "active"])
          .where("id", "=", input.variantId).where("item_id", "=", input.itemId).executeTakeFirst()
        : Promise.resolve(undefined),
      this.database.selectFrom("qcafe_price_books").selectAll()
        .where("id", "=", input.priceBookId).where("business_id", "=", input.businessId).executeTakeFirst(),
      this.database.selectFrom("qcafe_item_modifier_groups")
        .innerJoin("qcafe_modifier_groups", "qcafe_modifier_groups.id", "qcafe_item_modifier_groups.group_id")
        .select(["qcafe_modifier_groups.id", "qcafe_modifier_groups.active", "qcafe_modifier_groups.min_selections", "qcafe_modifier_groups.max_selections", "qcafe_item_modifier_groups.variant_id"])
        .where("qcafe_item_modifier_groups.item_id", "=", input.itemId).execute(),
    ]);

    const applicableGroups = assignedGroups.filter((group) => group.active === 1
      && (group.variant_id === null || group.variant_id === (input.variantId ?? null)));
    const optionCounts = applicableGroups.length
      ? await this.database.selectFrom("qcafe_modifier_options").select(["group_id", "active"])
        .where("group_id", "in", applicableGroups.map((group) => group.id)).execute()
      : [];
    const invalidModifierGroupIds = applicableGroups
      .filter((group) => {
        const activeOptions = optionCounts.filter((option) => option.group_id === group.id && option.active === 1).length;
        return group.min_selections > activeOptions || group.max_selections < group.min_selections;
      })
      .map((group) => group.id);
    const priceBookEligible = Boolean(priceBook
      && priceBook.active === 1
      && priceBook.status === "active"
      && priceBook.valid_from <= businessDate
      && (!priceBook.valid_to || priceBook.valid_to >= businessDate)
      && (!priceBook.location_id || priceBook.location_id === input.locationId)
      && (!priceBook.service_channel_id || priceBook.service_channel_id === (input.serviceChannelId ?? null)));

    return {
      categoryActive: item?.category_active === 1,
      channelValid: !input.serviceChannelId || Boolean(channel?.enabled === 1),
      invalidModifierGroupIds,
      itemActive: item?.item_active === 1,
      itemFound: Boolean(item),
      locationValid: location?.status === "active",
      priceBookEligible,
      variantActive: !input.variantId || variant?.active === 1,
      variantValid: !input.variantId || Boolean(variant),
    };
  }
}
