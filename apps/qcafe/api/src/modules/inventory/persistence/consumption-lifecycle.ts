import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeInventoryDatabase } from "./inventory.database.js";

export const qcafeConsumptionMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.007|consumptions|business,location,recipe foreign keys|sale and event stock effects",
  ),
  description: "Create Q Cafe recipe consumption records for sales and events.",
  id: "qcafe.inventory.007",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeInventoryDatabase>;
    await db.schema
      .createTable("qcafe_consumptions")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("source_type", "varchar(16)", (c) => c.notNull())
      .addColumn("source_id", "varchar(120)", (c) => c.notNull())
      .addColumn("recipe_id", "varchar(36)", (c) => c.notNull().references("qcafe_recipes.id"))
      .addColumn("portions", "integer", (c) => c.notNull())
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};
