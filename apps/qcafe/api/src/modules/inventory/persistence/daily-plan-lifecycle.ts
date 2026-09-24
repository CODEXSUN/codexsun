import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeInventoryDatabase } from "./inventory.database.js";

export const qcafeDailyPlanMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.003|daily-plans,daily-plan-lines|business,location,menu-item,variant foreign keys|demand-source per line",
  ),
  description: "Create Q Cafe daily plans and demand-sourced plan lines.",
  id: "qcafe.inventory.003",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeInventoryDatabase>;
    await db.schema
      .createTable("qcafe_daily_plans")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("plan_date", "varchar(10)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("note", "varchar(500)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_daily_plans_location_date_key", ["location_id", "plan_date"])
      .execute();
    await db.schema
      .createTable("qcafe_daily_plan_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("plan_id", "varchar(36)", (c) => c.notNull().references("qcafe_daily_plans.id"))
      .addColumn("demand_source", "varchar(16)", (c) => c.notNull())
      .addColumn("demand_ref", "varchar(120)")
      .addColumn("menu_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_menu_items.id"))
      .addColumn("menu_variant_id", "varchar(36)", (c) => c.references("qcafe_menu_variants.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("note", "varchar(240)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};
