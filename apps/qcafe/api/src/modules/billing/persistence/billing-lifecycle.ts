import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.billing.001|B01-B15|bills,taxes,tax-rates,payment-methods,payments,tenders,receipts,vouchers,applications,refunds,drawers,shifts,movements,settlements,day-closes|append-only money records",
  ),
  description: "Create Q Cafe billing, tender, voucher, cash custody, and settlement records.",
  id: "qcafe.billing.001",
  owner: "qcafe.billing",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    await createBills(database);
    await createPayments(database);
    await createVouchers(database);
    await createCashControl(database);
  },
};

const defaults = {
  checksum: createLifecycleChecksum(
    "qcafe.billing.seed.001|receipt-voucher-sequences|cash-card-upi-bank-digital|main-drawer|repeat-safe-per-location",
  ),
  description: "Install repeat-safe billing defaults for every Q Cafe outlet.",
  id: "qcafe.billing.seed.001",
  owner: "qcafe.billing",
  async seed(database: Kysely<QcafeFoundationDatabase>) {
    const locations = await database.selectFrom("qcafe_locations").select(["id"]).execute();
    const now = new Date().toISOString();
    for (const location of locations) await installBillingDefaults(database, location.id, now);
  },
};

export async function installBillingDefaults(
  database: Kysely<QcafeFoundationDatabase>,
  locationId: string,
  now: string,
) {
  for (const sequence of [
    { kind: "receipt" as const, prefix: "RCT" },
    { kind: "voucher" as const, prefix: "VCH" },
  ]) {
    const exists = await database
      .selectFrom("qcafe_number_sequences")
      .select("id")
      .where("location_id", "=", locationId)
      .where("document_kind", "=", sequence.kind)
      .executeTakeFirst();
    if (!exists)
      await database
        .insertInto("qcafe_number_sequences")
        .values({
          document_kind: sequence.kind,
          id: randomUUID(),
          location_id: locationId,
          next_value: 1,
          prefix: sequence.prefix,
          updated_at: now,
        })
        .execute();
  }
  for (const method of [
    { code: "CASH", kind: "cash" as const, name: "Cash" },
    { code: "CARD", kind: "card" as const, name: "Card" },
    { code: "UPI", kind: "upi" as const, name: "UPI" },
    { code: "BANK", kind: "bank" as const, name: "Bank transfer" },
    { code: "DIGITAL", kind: "digital" as const, name: "Approved digital" },
  ]) {
    const exists = await database
      .selectFrom("qcafe_payment_methods")
      .select("id")
      .where("location_id", "=", locationId)
      .where("code", "=", method.code)
      .executeTakeFirst();
    if (!exists)
      await database
        .insertInto("qcafe_payment_methods")
        .values({
          ...method,
          active: 1,
          configuration_ref: null,
          created_at: now,
          id: randomUUID(),
          location_id: locationId,
          updated_at: now,
        })
        .execute();
  }
  const drawer = await database
    .selectFrom("qcafe_cash_drawers")
    .select("id")
    .where("location_id", "=", locationId)
    .where("code", "=", "MAIN")
    .executeTakeFirst();
  if (!drawer)
    await database
      .insertInto("qcafe_cash_drawers")
      .values({
        active: 1,
        code: "MAIN",
        created_at: now,
        id: randomUUID(),
        location_id: locationId,
        name: "Main drawer",
      })
      .execute();
}

export const qcafeBillingLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration],
  moduleId: "qcafe.billing",
  seeders: [defaults],
};

async function createBills(db: Kysely<QcafeFoundationDatabase>) {
  await db.schema
    .createTable("qcafe_bills")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("order_id", "varchar(36)", (c) => c.notNull().references("qcafe_orders.id"))
    .addColumn("number", "varchar(40)", (c) => c.notNull().unique())
    .addColumn("status", "varchar(20)", (c) => c.notNull())
    .addColumn("currency", "varchar(3)", (c) => c.notNull())
    .addColumn("subtotal_minor", "integer", (c) => c.notNull())
    .addColumn("tax_minor", "integer", (c) => c.notNull())
    .addColumn("discount_minor", "integer", (c) => c.notNull())
    .addColumn("payable_minor", "integer", (c) => c.notNull())
    .addColumn("paid_minor", "integer", (c) => c.notNull().defaultTo(0))
    .addColumn("balance_minor", "integer", (c) => c.notNull())
    .addColumn("issued_at", "varchar(40)", (c) => c.notNull())
    .addColumn("posted_by", "varchar(120)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_bills_order_key", ["order_id"])
    .execute();
  await db.schema
    .createTable("qcafe_bill_lines")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("bill_id", "varchar(36)", (c) => c.notNull().references("qcafe_bills.id"))
    .addColumn("order_line_id", "varchar(36)", (c) => c.notNull())
    .addColumn("item_code", "varchar(40)", (c) => c.notNull())
    .addColumn("description", "varchar(260)", (c) => c.notNull())
    .addColumn("quantity_milli", "integer", (c) => c.notNull())
    .addColumn("unit_price_minor", "integer", (c) => c.notNull())
    .addColumn("tax_code", "varchar(40)")
    .addColumn("tax_basis_points", "integer", (c) => c.notNull())
    .addColumn("taxable_minor", "integer", (c) => c.notNull())
    .addColumn("tax_minor", "integer", (c) => c.notNull())
    .addColumn("total_minor", "integer", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_bill_taxes")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("bill_id", "varchar(36)", (c) => c.notNull().references("qcafe_bills.id"))
    .addColumn("tax_code", "varchar(40)", (c) => c.notNull())
    .addColumn("tax_basis_points", "integer", (c) => c.notNull())
    .addColumn("taxable_minor", "integer", (c) => c.notNull())
    .addColumn("tax_minor", "integer", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_tax_rates")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
    .addColumn("code", "varchar(40)", (c) => c.notNull())
    .addColumn("name", "varchar(120)", (c) => c.notNull())
    .addColumn("basis_points", "integer", (c) => c.notNull())
    .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_tax_rates_business_code_key", ["business_id", "code"])
    .execute();
}

async function createPayments(db: Kysely<QcafeFoundationDatabase>) {
  await db.schema
    .createTable("qcafe_payment_methods")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("code", "varchar(40)", (c) => c.notNull())
    .addColumn("name", "varchar(120)", (c) => c.notNull())
    .addColumn("kind", "varchar(24)", (c) => c.notNull())
    .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
    .addColumn("configuration_ref", "varchar(160)")
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_payment_methods_location_code_key", ["location_id", "code"])
    .execute();
  await db.schema
    .createTable("qcafe_payments")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("bill_id", "varchar(36)", (c) => c.references("qcafe_bills.id"))
    .addColumn("payment_method_id", "varchar(36)", (c) => c.notNull().references("qcafe_payment_methods.id"))
    .addColumn("parent_payment_id", "varchar(36)", (c) => c.references("qcafe_payments.id"))
    .addColumn("cash_shift_id", "varchar(36)")
    .addColumn("purpose", "varchar(20)", (c) => c.notNull())
    .addColumn("direction", "varchar(8)", (c) => c.notNull())
    .addColumn("amount_minor", "integer", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("provider_reference", "varchar(160)")
    .addColumn("failure_reason", "varchar(500)")
    .addColumn("received_at", "varchar(40)", (c) => c.notNull())
    .addColumn("posted_by", "varchar(120)", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_payment_tender_details")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("payment_id", "varchar(36)", (c) => c.notNull().references("qcafe_payments.id").unique())
    .addColumn("tender_kind", "varchar(24)", (c) => c.notNull())
    .addColumn("masked_reference", "varchar(80)")
    .addColumn("approval_code", "varchar(80)")
    .addColumn("received_minor", "integer", (c) => c.notNull())
    .addColumn("change_minor", "integer", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_receipts")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("number", "varchar(40)", (c) => c.notNull().unique())
    .addColumn("bill_id", "varchar(36)", (c) => c.references("qcafe_bills.id"))
    .addColumn("payment_id", "varchar(36)", (c) => c.notNull().references("qcafe_payments.id").unique())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("issued_at", "varchar(40)", (c) => c.notNull())
    .addColumn("rendered_document_ref", "varchar(240)")
    .execute();
}

async function createVouchers(db: Kysely<QcafeFoundationDatabase>) {
  await db.schema
    .createTable("qcafe_vouchers")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("number", "varchar(40)", (c) => c.notNull().unique())
    .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("kind", "varchar(20)", (c) => c.notNull())
    .addColumn("customer_ref", "varchar(160)")
    .addColumn("event_ref", "varchar(160)")
    .addColumn("status", "varchar(20)", (c) => c.notNull())
    .addColumn("original_value_minor", "integer", (c) => c.notNull())
    .addColumn("remaining_value_minor", "integer", (c) => c.notNull())
    .addColumn("issued_payment_id", "varchar(36)", (c) => c.notNull().references("qcafe_payments.id").unique())
    .addColumn("issued_at", "varchar(40)", (c) => c.notNull())
    .addColumn("expires_at", "varchar(40)")
    .execute();
  await db.schema
    .createTable("qcafe_voucher_applications")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("voucher_id", "varchar(36)", (c) => c.notNull().references("qcafe_vouchers.id"))
    .addColumn("bill_id", "varchar(36)", (c) => c.notNull().references("qcafe_bills.id"))
    .addColumn("applied_minor", "integer", (c) => c.notNull())
    .addColumn("applied_by", "varchar(120)", (c) => c.notNull())
    .addColumn("applied_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_refunds")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("original_payment_id", "varchar(36)", (c) => c.notNull().references("qcafe_payments.id"))
    .addColumn("refund_payment_id", "varchar(36)", (c) => c.notNull().references("qcafe_payments.id").unique())
    .addColumn("reason", "varchar(500)", (c) => c.notNull())
    .addColumn("approved_by", "varchar(120)", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .execute();
}

async function createCashControl(db: Kysely<QcafeFoundationDatabase>) {
  await db.schema
    .createTable("qcafe_cash_drawers")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
    .addColumn("code", "varchar(40)", (c) => c.notNull())
    .addColumn("name", "varchar(120)", (c) => c.notNull())
    .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
    .addColumn("created_at", "varchar(40)", (c) => c.notNull())
    .addUniqueConstraint("qcafe_cash_drawers_location_code_key", ["location_id", "code"])
    .execute();
  await db.schema
    .createTable("qcafe_cash_shifts")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("drawer_id", "varchar(36)", (c) => c.notNull().references("qcafe_cash_drawers.id"))
    .addColumn("business_day_id", "varchar(36)", (c) => c.notNull().references("qcafe_business_days.id"))
    .addColumn("cashier_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("opening_float_minor", "integer", (c) => c.notNull())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("opened_at", "varchar(40)", (c) => c.notNull())
    .addColumn("closed_at", "varchar(40)")
    .execute();
  await db.schema
    .createTable("qcafe_cash_movements")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("cash_shift_id", "varchar(36)", (c) => c.notNull().references("qcafe_cash_shifts.id"))
    .addColumn("kind", "varchar(20)", (c) => c.notNull())
    .addColumn("amount_minor", "integer", (c) => c.notNull())
    .addColumn("reason", "varchar(500)", (c) => c.notNull())
    .addColumn("actor_ref", "varchar(120)", (c) => c.notNull())
    .addColumn("approved_by", "varchar(120)")
    .addColumn("occurred_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_shift_settlements")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("cash_shift_id", "varchar(36)", (c) => c.notNull().references("qcafe_cash_shifts.id").unique())
    .addColumn("expected_minor", "integer", (c) => c.notNull())
    .addColumn("counted_minor", "integer", (c) => c.notNull())
    .addColumn("variance_minor", "integer", (c) => c.notNull())
    .addColumn("variance_reason", "varchar(500)")
    .addColumn("approved_by", "varchar(120)")
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("settled_at", "varchar(40)", (c) => c.notNull())
    .execute();
  await db.schema
    .createTable("qcafe_day_closes")
    .addColumn("id", "varchar(36)", (c) => c.primaryKey())
    .addColumn("business_day_id", "varchar(36)", (c) => c.notNull().references("qcafe_business_days.id").unique())
    .addColumn("status", "varchar(16)", (c) => c.notNull())
    .addColumn("sales_minor", "integer", (c) => c.notNull())
    .addColumn("tax_minor", "integer", (c) => c.notNull())
    .addColumn("payments_minor", "integer", (c) => c.notNull())
    .addColumn("refunds_minor", "integer", (c) => c.notNull())
    .addColumn("payment_totals_json", "text", (c) => c.notNull())
    .addColumn("closed_by", "varchar(120)", (c) => c.notNull())
    .addColumn("closed_at", "varchar(40)", (c) => c.notNull())
    .execute();
}
