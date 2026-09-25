import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import { qcafeRecipeMigration } from "./recipe-lifecycle.js";
import { qcafeDailyPlanMigration } from "./daily-plan-lifecycle.js";
import { qcafeReservationMigration } from "./reservation-lifecycle.js";
import { qcafeProcurementMigration, qcafeMovementSourceMigration } from "./procurement-lifecycle.js";
import { qcafeConsumptionMigration } from "./consumption-lifecycle.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.001|stock-units,stock-items,stock-adjustments,stock-movements|business,location,unit,item foreign keys|source-linked ledger",
  ),
  description: "Create Q Cafe stock units, items, adjustments, and source-linked movement ledger.",
  id: "qcafe.inventory.001",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await database.schema
      .createTable("qcafe_stock_units")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("symbol", "varchar(20)")
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_stock_units_business_code_key", ["business_id", "code"])
      .execute();
    await database.schema
      .createTable("qcafe_stock_items")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("unit_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_units.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(160)", (c) => c.notNull())
      .addColumn("track_stock", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("reorder_level_milli", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_stock_items_business_code_key", ["business_id", "code"])
      .execute();
    await database.schema
      .createTable("qcafe_stock_adjustments")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("reason", "varchar(500)", (c) => c.notNull())
      .addColumn("approved_by", "varchar(120)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_stock_movements")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("movement_type", "varchar(20)", (c) => c.notNull())
      .addColumn("source_type", "varchar(20)", (c) => c.notNull())
      .addColumn("source_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_adjustments.id"))
      .addColumn("reason", "varchar(500)", (c) => c.notNull())
      .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeInventoryLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [
    migration,
    qcafeRecipeMigration,
    qcafeDailyPlanMigration,
    qcafeReservationMigration,
    qcafeProcurementMigration,
    qcafeMovementSourceMigration,
    qcafeConsumptionMigration,
  ],
  moduleId: "qcafe.inventory",
  seeders: [],
};
