import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.kitchen.001|K01-K05,kot print attempts|stations,routes,tickets,lines,events,prints|station-routed durable preparation",
  ),
  description: "Create Q Cafe kitchen ticket and print-attempt records.",
  id: "qcafe.kitchen.001",
  owner: "qcafe.kitchen",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await database.schema
      .createTable("qcafe_kitchen_stations")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_kitchen_stations_location_code_key", ["location_id", "code"])
      .execute();
    await database.schema
      .createTable("qcafe_item_station_routes")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("item_id", "varchar(36)", (c) => c.notNull())
      .addColumn("variant_id", "varchar(36)")
      .addColumn("station_id", "varchar(36)", (c) => c.notNull().references("qcafe_kitchen_stations.id"))
      .addColumn("priority", "integer", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_kitchen_tickets")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("number", "varchar(40)", (c) => c.notNull().unique())
      .addColumn("order_id", "varchar(36)", (c) => c.notNull().references("qcafe_orders.id"))
      .addColumn("station_id", "varchar(36)", (c) => c.notNull().references("qcafe_kitchen_stations.id"))
      .addColumn("status", "varchar(20)", (c) => c.notNull())
      .addColumn("fired_at", "varchar(40)", (c) => c.notNull())
      .addColumn("ready_at", "varchar(40)")
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_kitchen_ticket_lines")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("ticket_id", "varchar(36)", (c) => c.notNull().references("qcafe_kitchen_tickets.id"))
      .addColumn("order_line_id", "varchar(36)", (c) => c.notNull().references("qcafe_order_lines.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("status", "varchar(20)", (c) => c.notNull())
      .addColumn("preparation_note", "text")
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_kitchen_ticket_events")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("ticket_id", "varchar(36)", (c) => c.notNull().references("qcafe_kitchen_tickets.id"))
      .addColumn("line_id", "varchar(36)")
      .addColumn("event_type", "varchar(40)", (c) => c.notNull())
      .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("note", "text")
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_kitchen_print_attempts")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("ticket_id", "varchar(36)", (c) => c.notNull().references("qcafe_kitchen_tickets.id"))
      .addColumn("attempt_number", "integer", (c) => c.notNull())
      .addColumn("route_ref", "varchar(160)", (c) => c.notNull())
      .addColumn("status", "varchar(20)", (c) => c.notNull())
      .addColumn("error", "text")
      .addColumn("requested_by", "varchar(120)", (c) => c.notNull())
      .addColumn("requested_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};
export const qcafeKitchenLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration],
  moduleId: "qcafe.kitchen",
  seeders: [],
};
