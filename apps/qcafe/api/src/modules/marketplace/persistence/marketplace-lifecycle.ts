import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeMarketplaceDatabase } from "./marketplace.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.marketplace.001|partners,menu-mappings,orders,order-lines,events,settlements|business,location,partner,menu foreign keys|idempotent intake",
  ),
  description: "Create Q Cafe marketplace partners, mappings, intake, events, and settlements.",
  id: "qcafe.marketplace.001",
  owner: "qcafe.marketplace",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeMarketplaceDatabase>;
    await db.schema
      .createTable("qcafe_marketplace_partners")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(40)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("adapter_contract", "varchar(80)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_marketplace_partners_business_code_key", ["business_id", "code"])
      .execute();
    await db.schema
      .createTable("qcafe_marketplace_menu_mappings")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("partner_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_partners.id"))
      .addColumn("partner_item_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("menu_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_menu_items.id"))
      .addColumn("menu_variant_id", "varchar(36)", (c) => c.references("qcafe_menu_variants.id"))
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_marketplace_mappings_partner_ref_key", ["partner_id", "partner_item_ref"])
      .execute();
    await db.schema
      .createTable("qcafe_marketplace_orders")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("partner_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_partners.id"))
      .addColumn("partner_order_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("idempotency_key", "varchar(120)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("currency", "varchar(3)", (c) => c.notNull())
      .addColumn("total_minor", "integer", (c) => c.notNull())
      .addColumn("received_at", "varchar(40)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_marketplace_orders_partner_ref_key", ["partner_id", "partner_order_ref"])
      .execute();
    await db.schema
      .createTable("qcafe_marketplace_order_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("intake_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_orders.id"))
      .addColumn("mapping_id", "varchar(36)", (c) => c.references("qcafe_marketplace_menu_mappings.id"))
      .addColumn("partner_item_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("quantity", "integer", (c) => c.notNull())
      .addColumn("unit_price_minor", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_marketplace_events")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("intake_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_orders.id"))
      .addColumn("event_type", "varchar(60)", (c) => c.notNull())
      .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_marketplace_settlements")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("partner_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_partners.id"))
      .addColumn("period_from", "varchar(10)", (c) => c.notNull())
      .addColumn("period_to", "varchar(10)", (c) => c.notNull())
      .addColumn("gross_minor", "integer", (c) => c.notNull())
      .addColumn("fee_minor", "integer", (c) => c.notNull())
      .addColumn("net_minor", "integer", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const fulfillmentMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.marketplace.002|delivery-fulfillments,intake pos link|order,fulfillment foreign keys|collection and fee reconcile with bills and payments",
  ),
  description: "Create Q Cafe delivery fulfillments and link intakes to POS orders.",
  id: "qcafe.marketplace.002",
  owner: "qcafe.marketplace",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeMarketplaceDatabase>;
    await db.schema.alterTable("qcafe_marketplace_orders").addColumn("pos_order_id", "varchar(36)").execute();
    await db.schema
      .createTable("qcafe_delivery_fulfillments")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("intake_id", "varchar(36)", (c) => c.notNull().references("qcafe_marketplace_orders.id").unique())
      .addColumn("rider_ref", "varchar(120)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("partner_collected_minor", "integer", (c) => c.notNull())
      .addColumn("partner_fee_minor", "integer", (c) => c.notNull())
      .addColumn("picked_at", "varchar(40)")
      .addColumn("delivered_at", "varchar(40)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeMarketplaceLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration, fulfillmentMigration],
  moduleId: "qcafe.marketplace",
  seeders: [],
};
