import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeInventoryDatabase } from "./inventory.database.js";

export const qcafeReservationMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.004|stock-reservations|business,location,stock-item foreign keys|planning hold without early consumption",
  ),
  description: "Create Q Cafe stock reservations for events, plans, specials, and orders.",
  id: "qcafe.inventory.004",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeInventoryDatabase>;
    await db.schema
      .createTable("qcafe_stock_reservations")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("source_type", "varchar(16)", (c) => c.notNull())
      .addColumn("source_id", "varchar(120)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("reason", "varchar(500)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("resolved_at", "varchar(40)")
      .addColumn("resolved_by", "varchar(120)")
      .execute();
  },
};
