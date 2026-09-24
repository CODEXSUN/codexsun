import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeInventoryDatabase } from "./inventory.database.js";

export const qcafeRecipeMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.002|recipes,recipe-components|business,menu-item,variant,stock-item foreign keys|effective-dated revisions with source history",
  ),
  description: "Create Q Cafe recipe revisions and recipe component records.",
  id: "qcafe.inventory.002",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeInventoryDatabase>;
    await db.schema
      .createTable("qcafe_recipes")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("menu_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_menu_items.id"))
      .addColumn("menu_variant_id", "varchar(36)", (c) => c.references("qcafe_menu_variants.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(160)", (c) => c.notNull())
      .addColumn("revision_no", "integer", (c) => c.notNull())
      .addColumn("effective_from", "varchar(10)", (c) => c.notNull())
      .addColumn("effective_to", "varchar(10)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("source_recipe_id", "varchar(36)", (c) => c.references("qcafe_recipes.id"))
      .addColumn("change_reason", "varchar(500)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_recipes_business_code_revision_key", ["business_id", "code", "revision_no"])
      .execute();
    await db.schema
      .createTable("qcafe_recipe_components")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("recipe_id", "varchar(36)", (c) => c.notNull().references("qcafe_recipes.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("note", "varchar(240)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};
