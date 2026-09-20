import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import { qcafeMenuCompleteMigration } from "./menu-complete-migration.js";

const menuMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.menu.001|categories,items,variants,price_books,menu_prices|business,item,location,channel foreign keys|effective dated minor-unit prices",
  ),
  description: "Create Q Cafe menu catalog and effective price tables.",
  id: "qcafe.menu.001",
  owner: "qcafe.menu",
  async apply(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    await database.schema.createTable("qcafe_menu_categories").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("sort_order", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_menu_categories_business_code_key", ["business_id", "code"]).execute();
    await database.schema.createTable("qcafe_menu_items").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("category_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_categories.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(160)", (column) => column.notNull())
      .addColumn("item_type", "varchar(20)", (column) => column.notNull())
      .addColumn("tax_code", "varchar(40)")
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_menu_items_business_code_key", ["business_id", "code"]).execute();
    await database.schema.createTable("qcafe_menu_variants").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_menu_variants_item_code_key", ["item_id", "code"]).execute();
    await database.schema.createTable("qcafe_price_books").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("business_id", "varchar(36)", (column) => column.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (column) => column.notNull())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("currency", "varchar(3)", (column) => column.notNull())
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("qcafe_price_books_business_code_key", ["business_id", "code"]).execute();
    await database.schema.createTable("qcafe_menu_prices").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("price_book_id", "varchar(36)", (column) => column.notNull().references("qcafe_price_books.id"))
      .addColumn("item_id", "varchar(36)", (column) => column.notNull().references("qcafe_menu_items.id"))
      .addColumn("variant_id", "varchar(36)", (column) => column.references("qcafe_menu_variants.id"))
      .addColumn("location_id", "varchar(36)", (column) => column.references("qcafe_locations.id"))
      .addColumn("service_channel_id", "varchar(36)", (column) => column.references("qcafe_service_channels.id"))
      .addColumn("amount_minor", "integer", (column) => column.notNull())
      .addColumn("valid_from", "varchar(10)", (column) => column.notNull())
      .addColumn("valid_to", "varchar(10)")
      .addColumn("active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
  },
};

export const qcafeMenuLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [menuMigration, qcafeMenuCompleteMigration], moduleId: "qcafe.menu", seeders: [],
};
