import { createLifecycleChecksum } from "@codexsun/platform-core";
import { sql, type Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeInventoryDatabase } from "./inventory.database.js";

export const qcafeProcurementMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.005|purchase-orders,goods-receipts,stock-lots,stock-counts,waste-events|business,location,item,lot foreign keys|variance and waste need reason and approval",
  ),
  description: "Create Q Cafe purchase, receipt, lot, count, and waste records.",
  id: "qcafe.inventory.005",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeInventoryDatabase>;
    // Table order matters: MariaDB validates foreign keys at CREATE time, so
    // qcafe_stock_lots must exist before qcafe_goods_receipt_lines references it.
    await db.schema
      .createTable("qcafe_purchase_orders")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("supplier_ref", "varchar(160)")
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("expected_at", "varchar(40)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_purchase_order_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("po_id", "varchar(36)", (c) => c.notNull().references("qcafe_purchase_orders.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("received_milli", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("note", "varchar(240)")
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_goods_receipts")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("po_id", "varchar(36)", (c) => c.notNull().references("qcafe_purchase_orders.id"))
      .addColumn("note", "varchar(500)")
      .addColumn("received_by", "varchar(120)", (c) => c.notNull())
      .addColumn("received_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_stock_lots")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("lot_code", "varchar(80)", (c) => c.notNull())
      .addColumn("expires_at", "varchar(10)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_stock_lots_item_code_key", ["stock_item_id", "lot_code"])
      .execute();

    await db.schema
      .createTable("qcafe_goods_receipt_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("receipt_id", "varchar(36)", (c) => c.notNull().references("qcafe_goods_receipts.id"))
      .addColumn("po_line_id", "varchar(36)", (c) => c.notNull().references("qcafe_purchase_order_lines.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("lot_id", "varchar(36)", (c) => c.references("qcafe_stock_lots.id"))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_stock_counts")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("reason", "varchar(500)", (c) => c.notNull())
      .addColumn("approved_by", "varchar(120)")
      .addColumn("counted_by", "varchar(120)", (c) => c.notNull())
      .addColumn("counted_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_stock_count_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("count_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_counts.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("expected_milli", "integer", (c) => c.notNull())
      .addColumn("counted_milli", "integer", (c) => c.notNull())
      .addColumn("variance_milli", "integer", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_waste_events")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("stock_item_id", "varchar(36)", (c) => c.notNull().references("qcafe_stock_items.id"))
      .addColumn("quantity_milli", "integer", (c) => c.notNull())
      .addColumn("reason", "varchar(500)", (c) => c.notNull())
      .addColumn("approved_by", "varchar(120)", (c) => c.notNull())
      .addColumn("recorded_by", "varchar(120)", (c) => c.notNull())
      .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeValuationMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.008|purchase-order-lines,receipt-lines unit prices|no new foreign keys|stock valuation without postings",
  ),
  description: "Record unit prices on purchase order and receipt lines for stock valuation.",
  id: "qcafe.inventory.008",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await database.schema
      .alterTable("qcafe_purchase_order_lines")
      .addColumn("unit_price_minor", "integer", (c) => c.notNull().defaultTo(0))
      .execute();
    await database.schema
      .alterTable("qcafe_goods_receipt_lines")
      .addColumn("unit_price_minor", "integer", (c) => c.notNull().defaultTo(0))
      .execute();
  },
};

export const qcafeMovementSourceMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.inventory.006|stock-movements source_id without adjustment foreign key|preserve ledger rows|purchase,count,waste sources",
  ),
  description: "Allow stock movement sources beyond adjustments while preserving ledger rows.",
  id: "qcafe.inventory.006",
  owner: "qcafe.inventory",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await sql`CREATE TABLE qcafe_stock_movements_next (id varchar(36) PRIMARY KEY, business_id varchar(36) NOT NULL, location_id varchar(36) NOT NULL, stock_item_id varchar(36) NOT NULL, quantity_milli integer NOT NULL, movement_type varchar(20) NOT NULL, source_type varchar(20) NOT NULL, source_id varchar(36) NOT NULL, reason varchar(500) NOT NULL, actor_ref varchar(120) NOT NULL, occurred_at varchar(40) NOT NULL)`.execute(
      database,
    );
    await sql`INSERT INTO qcafe_stock_movements_next (id, business_id, location_id, stock_item_id, quantity_milli, movement_type, source_type, source_id, reason, actor_ref, occurred_at) SELECT id, business_id, location_id, stock_item_id, quantity_milli, movement_type, source_type, source_id, reason, actor_ref, occurred_at FROM qcafe_stock_movements`.execute(
      database,
    );
    await sql`DROP TABLE qcafe_stock_movements`.execute(database);
    await sql`ALTER TABLE qcafe_stock_movements_next RENAME TO qcafe_stock_movements`.execute(database);
  },
};
