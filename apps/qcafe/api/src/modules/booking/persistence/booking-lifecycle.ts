import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import { randomUUID } from "node:crypto";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.booking.001|S01-S04|dining areas,tables,sessions,session tables|durable occupancy and combined table support",
  ),
  description: "Create Q Cafe dining and table-session records.",
  id: "qcafe.booking.001",
  owner: "qcafe.booking",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await database.schema
      .createTable("qcafe_dining_areas")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("kind", "varchar(20)", (c) => c.notNull())
      .addColumn("sort_order", "integer", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await database.schema
      .createTable("qcafe_dining_tables")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("area_id", "varchar(36)", (c) => c.notNull().references("qcafe_dining_areas.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("capacity", "integer", (c) => c.notNull())
      .addColumn("position_label", "varchar(80)")
      .addColumn("active", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_dining_tables_area_code_key", ["area_id", "code"])
      .execute();
    await database.schema
      .createTable("qcafe_table_sessions")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("guest_count", "integer", (c) => c.notNull())
      .addColumn("primary_order_id", "varchar(36)")
      .addColumn("opened_at", "varchar(40)", (c) => c.notNull())
      .addColumn("closed_at", "varchar(40)")
      .addColumn("opened_by", "varchar(120)", (c) => c.notNull())
      .addColumn("closed_by", "varchar(120)")
      .execute();
    await database.schema
      .createTable("qcafe_table_session_tables")
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("session_id", "varchar(36)", (c) => c.notNull().references("qcafe_table_sessions.id"))
      .addColumn("table_id", "varchar(36)", (c) => c.notNull().references("qcafe_dining_tables.id"))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_table_session_table_key", ["session_id", "table_id"])
      .execute();
  },
};
const guestMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.booking.002|S05-S10|customers,reservations,reservation-tables,reservation-events,table-qr-tokens,scanner-profiles|conflict-safe booking and hashed public entry",
  ),
  description: "Create Q Cafe customer, reservation, QR token, and scanner records.",
  id: "qcafe.booking.002",
  owner: "qcafe.booking",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await createGuestTables(database);
  },
};
const eventMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.booking.003|E01-E09|event-leads,followups,bookings,requirements,quotes,quote-lines,orders,schedule,tasks|function sales workflow",
  ),
  description: "Create Q Cafe function and festival sales workflow records.",
  id: "qcafe.booking.003",
  owner: "qcafe.booking",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await createEventTables(database);
  },
};
const eventSequenceSeeder = {
  checksum: createLifecycleChecksum("qcafe.booking.seed.001|event-quote-sequence|QTE|repeat-safe-per-location"),
  description: "Install a repeat-safe event quote sequence for every Q Cafe outlet.",
  id: "qcafe.booking.seed.001",
  owner: "qcafe.booking",
  async seed(database: Kysely<QcafeFoundationDatabase>) {
    const locations = await database.selectFrom("qcafe_locations").select("id").execute();
    for (const location of locations) {
      const existing = await database
        .selectFrom("qcafe_number_sequences")
        .select("id")
        .where("location_id", "=", location.id)
        .where("document_kind", "=", "event_quote")
        .executeTakeFirst();
      if (!existing)
        await database
          .insertInto("qcafe_number_sequences")
          .values({
            document_kind: "event_quote",
            id: randomUUID(),
            location_id: location.id,
            next_value: 1,
            prefix: "QTE",
            updated_at: new Date().toISOString(),
          })
          .execute();
    }
  },
};
export const qcafeBookingLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration, guestMigration, eventMigration],
  moduleId: "qcafe.booking",
  seeders: [eventSequenceSeeder],
};

async function createGuestTables(database: Kysely<QcafeFoundationDatabase>) {
  await database.schema
    .createTable("qcafe_customers")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
    .addColumn("name", "varchar(160)", (c) => c.notNull())
    .addColumn("phone", "varchar(40)")
    .addColumn("email", "varchar(254)")
    .addColumn("email_consent", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("whatsapp_consent", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("marketing_consent", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("external_reference", "varchar(160)")
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_reservations")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("customer_id", "varchar(36)", (c) => c.notNull().references("qcafe_customers.id"))
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("arrival_at", "varchar(40)", (c) => c.notNull())
    .addColumn("duration_minutes", "integer", (c) => c.notNull())
    .addColumn("party_size", "integer", (c) => c.notNull())
    .addColumn("status", "varchar(20)", (c) => c.notNull())
    .addColumn("source", "varchar(20)", (c) => c.notNull())
    .addColumn("notes", "text")
    .addColumn("table_session_id", "varchar(36)")
    .addColumn("order_id", "varchar(36)")
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_reservation_tables")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("reservation_id", "varchar(36)", (c) => c.notNull().references("qcafe_reservations.id"))
    .addColumn("table_id", "varchar(36)", (c) => c.notNull().references("qcafe_dining_tables.id"))
    .addColumn("assigned_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_reservation_table_key", ["reservation_id", "table_id"])
    .execute();
  await database.schema
    .createTable("qcafe_reservation_events")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("reservation_id", "varchar(36)", (c) => c.notNull().references("qcafe_reservations.id"))
    .addColumn("event_type", "varchar(40)", (c) => c.notNull())
    .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("note", "text")
    .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_table_qr_tokens")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("table_id", "varchar(36)", (c) => c.notNull().references("qcafe_dining_tables.id"))
    .addColumn("token_hash", "varchar(64)", (c) => c.notNull().unique())
    .addColumn("version", "integer", (c) => c.notNull())
    .addColumn("valid_from", "varchar(40)", (c) => c.notNull())
    .addColumn("expires_at", "varchar(40)")
    .addColumn("revoked_at", "varchar(40)")
    .addColumn("created_by", "varchar(120)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_scanner_profiles")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("device_ref", "varchar(160)", (c) => c.notNull())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("scan_purpose", "varchar(24)", (c) => c.notNull())
    .addColumn("accepted_formats_json", "text", (c) => c.notNull())
    .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_scanner_device_purpose_key", ["device_ref", "scan_purpose"])
    .execute();
}

async function createEventTables(database: Kysely<QcafeFoundationDatabase>) {
  await database.schema
    .createTable("qcafe_event_leads")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
    .addColumn("customer_id", "varchar(36)", (c) => c.references("qcafe_customers.id"))
    .addColumn("source", "varchar(40)", (c) => c.notNull())
    .addColumn("occasion_type", "varchar(80)", (c) => c.notNull())
    .addColumn("event_date", "varchar(10)", (c) => c.notNull())
    .addColumn("guest_count", "integer", (c) => c.notNull())
    .addColumn("status", "varchar(20)", (c) => c.notNull())
    .addColumn("owner_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_followups")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("lead_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_leads.id"))
    .addColumn("scheduled_at", "varchar(40)", (c) => c.notNull())
    .addColumn("outcome", "varchar(160)")
    .addColumn("note", "text", (c) => c.notNull())
    .addColumn("owner_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("completed_at", "varchar(40)")
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_bookings")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("lead_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_leads.id").unique())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("customer_id", "varchar(36)", (c) => c.references("qcafe_customers.id"))
    .addColumn("status", "varchar(20)", (c) => c.notNull())
    .addColumn("starts_at", "varchar(40)", (c) => c.notNull())
    .addColumn("ends_at", "varchar(40)", (c) => c.notNull())
    .addColumn("guest_count", "integer", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await createEventDetailTables(database);
}

async function createEventDetailTables(database: Kysely<QcafeFoundationDatabase>) {
  await database.schema
    .createTable("qcafe_event_requirements")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("event_booking_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_bookings.id"))
    .addColumn("category", "varchar(24)", (c) => c.notNull())
    .addColumn("details", "text", (c) => c.notNull())
    .addColumn("responsible_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_quotes")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("event_booking_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_bookings.id"))
    .addColumn("number", "varchar(40)", (c) => c.notNull().unique())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("currency", "varchar(3)", (c) => c.notNull())
    .addColumn("valid_until", "varchar(10)", (c) => c.notNull())
    .addColumn("total_minor", "integer", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_quote_lines")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("quote_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_quotes.id"))
    .addColumn("item_ref", "varchar(160)")
    .addColumn("description", "varchar(260)", (c) => c.notNull())
    .addColumn("quantity_milli", "integer", (c) => c.notNull())
    .addColumn("unit_amount_minor", "integer", (c) => c.notNull())
    .addColumn("total_minor", "integer", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_orders")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("event_booking_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_bookings.id"))
    .addColumn("order_id", "varchar(36)", (c) => c.notNull().references("qcafe_orders.id"))
    .addColumn("role", "varchar(20)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_event_order_key", ["event_booking_id", "order_id"])
    .execute();
  await database.schema
    .createTable("qcafe_event_schedule_items")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("event_booking_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_bookings.id"))
    .addColumn("starts_at", "varchar(40)", (c) => c.notNull())
    .addColumn("ends_at", "varchar(40)", (c) => c.notNull())
    .addColumn("activity", "varchar(260)", (c) => c.notNull())
    .addColumn("owner_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await database.schema
    .createTable("qcafe_event_tasks")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("event_booking_id", "varchar(36)", (c) => c.notNull().references("qcafe_event_bookings.id"))
    .addColumn("task", "varchar(260)", (c) => c.notNull())
    .addColumn("due_at", "varchar(40)", (c) => c.notNull())
    .addColumn("owner_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .execute();
}
