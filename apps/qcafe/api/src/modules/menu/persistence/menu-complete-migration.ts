import {
  createLifecycleChecksum,
  type DatabaseMigration,
} from "@codexsun/platform-core";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export const qcafeMenuCompleteMigration: DatabaseMigration<QcafeFoundationDatabase> = {
  checksum: createLifecycleChecksum(
    "qcafe.menu.002|enrich M01-M05|create M06-M15 campaigns,modifiers,media,availability,allergens|versioned menu master data",
  ),
  description: "Complete the Q Cafe M01-M15 menu schema.",
  id: "qcafe.menu.002",
  owner: "qcafe.menu",
  async apply(database): Promise<void> {
    await database.schema.alterTable("qcafe_menu_categories")
      .addColumn("parent_id", "varchar(36)", (column) => column.references("qcafe_menu_categories.id"))
      .execute();
    await database.schema.alterTable("qcafe_menu_categories")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1)).execute();

    await database.schema.alterTable("qcafe_menu_items")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .execute();

    await database.schema.alterTable("qcafe_menu_variants")
      .addColumn("quantity_basis_milli", "integer", (column) => column.notNull().defaultTo(1000))
      .execute();
    await database.schema.alterTable("qcafe_menu_variants")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1)).execute();

    await database.schema.alterTable("qcafe_price_books")
      .addColumn("location_id", "varchar(36)", (column) => column.references("qcafe_locations.id"))
      .execute();
    await database.schema.alterTable("qcafe_price_books")
      .addColumn("service_channel_id", "varchar(36)", (column) => column.references("qcafe_service_channels.id")).execute();
    await database.schema.alterTable("qcafe_price_books")
      .addColumn("valid_from", "varchar(10)", (column) => column.notNull().defaultTo("1970-01-01")).execute();
    await database.schema.alterTable("qcafe_price_books").addColumn("valid_to", "varchar(10)").execute();
    await database.schema.alterTable("qcafe_price_books")
      .addColumn("status", "varchar(16)", (column) => column.notNull().defaultTo("active")).execute();
    await database.schema.alterTable("qcafe_price_books")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1)).execute();

    await database.schema.alterTable("qcafe_menu_prices")
      .addColumn("tax_included", "integer", (column) => column.notNull().defaultTo(0))
      .execute();
    await database.schema.alterTable("qcafe_menu_prices")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1)).execute();

    await database.schema.createTable("qcafe_special_campaigns")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (column) => column.references("qcafe_locations.id"))
      .addColumn("name", "varchar(160)", (column) => column.notNull())
      .addColumn("scope", "varchar(16)", (column) => column.notNull())
      .addColumn("starts_at", "varchar(40)", (column) => column.notNull())
      .addColumn("ends_at", "varchar(40)", (column) => column.notNull())
      .addColumn("priority", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("status", "varchar(16)", (column) => column.notNull().defaultTo("draft"))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();

    await database.schema.createTable("qcafe_special_prices")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("campaign_id", "varchar(36)", (column) => column.notNull().references("qcafe_special_campaigns.id"))
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("amount_minor", "integer")
      .addColumn("discount_basis_points", "integer")
      .addColumn("usage_limit", "integer")
      .addColumn("used_count", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();

    await database.schema.createTable("qcafe_modifier_groups")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("min_selections", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("max_selections", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_modifier_groups_business_code_key", ["business_id", "code"])
      .execute();

    await database.schema.createTable("qcafe_modifier_options")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("group_id", "varchar(36)", (column) => column.notNull().references("qcafe_modifier_groups.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("price_adjustment_minor", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("stock_item_ref", "varchar(120)")
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_modifier_options_group_code_key", ["group_id", "code"])
      .execute();

    await database.schema.createTable("qcafe_item_modifier_groups")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("group_id", "varchar(36)", (column) => column.notNull().references("qcafe_modifier_groups.id"))
      .addColumn("sort_order", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();

    await database.schema.createTable("qcafe_media_assets")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("storage_object_ref", "varchar(255)", (column) => column.notNull())
      .addColumn("checksum", "varchar(128)", (column) => column.notNull())
      .addColumn("mime_type", "varchar(120)", (column) => column.notNull())
      .addColumn("width", "integer")
      .addColumn("height", "integer")
      .addColumn("status", "varchar(16)", (column) => column.notNull().defaultTo("processing"))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_media_assets_object_key", ["business_id", "storage_object_ref"])
      .execute();

    await database.schema.createTable("qcafe_menu_item_media")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("media_asset_id", "varchar(36)", (column) => column.notNull().references("qcafe_media_assets.id"))
      .addColumn("usage", "varchar(16)", (column) => column.notNull())
      .addColumn("sort_order", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();

    await database.schema.createTable("qcafe_item_availability")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("location_id", "varchar(36)", (column) => column.notNull().references("qcafe_locations.id"))
      .addColumn("service_channel_id", "varchar(36)", (column) => column.references("qcafe_service_channels.id"))
      .addColumn("starts_at", "varchar(40)", (column) => column.notNull())
      .addColumn("ends_at", "varchar(40)")
      .addColumn("status", "varchar(16)", (column) => column.notNull())
      .addColumn("reason", "varchar(255)")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();

    await database.schema.createTable("qcafe_allergen_tags")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("severity", "varchar(16)", (column) => column.notNull())
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_allergen_tags_business_code_key", ["business_id", "code"])
      .execute();

    await database.schema.createTable("qcafe_item_allergens")
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("allergen_tag_id", "varchar(36)", (column) => column.notNull().references("qcafe_allergen_tags.id"))
      .addColumn("note", "varchar(255)")
      .addColumn("version", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute();
  },
};
