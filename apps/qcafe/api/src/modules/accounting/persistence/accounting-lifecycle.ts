import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeAccountingDatabase } from "./accounting.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.accounting.001|accounts,journals,journal-lines|business,location,journal,account foreign keys|balanced source-linked journals",
  ),
  description: "Create Q Cafe chart of accounts, journals, and journal lines.",
  id: "qcafe.accounting.001",
  owner: "qcafe.accounting",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeAccountingDatabase>;
    await db.schema
      .createTable("qcafe_accounting_accounts")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("code", "varchar(20)", (c) => c.notNull())
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("type", "varchar(20)", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_accounting_accounts_business_code_key", ["business_id", "code"])
      .execute();
    await db.schema
      .createTable("qcafe_accounting_journals")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("number", "varchar(40)", (c) => c.notNull())
      .addColumn("source_type", "varchar(20)", (c) => c.notNull())
      .addColumn("source_id", "varchar(36)", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("posted_at", "varchar(40)")
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_accounting_journals_number_key", ["number"])
      .addUniqueConstraint("qcafe_accounting_journals_source_key", ["source_type", "source_id"])
      .execute();
    await db.schema
      .createTable("qcafe_accounting_journal_lines")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("journal_id", "varchar(36)", (c) => c.notNull().references("qcafe_accounting_journals.id"))
      .addColumn("account_id", "varchar(36)", (c) => c.notNull().references("qcafe_accounting_accounts.id"))
      .addColumn("debit_minor", "integer", (c) => c.notNull())
      .addColumn("credit_minor", "integer", (c) => c.notNull())
      .addColumn("tax_code", "varchar(40)")
      .addColumn("memo", "varchar(240)")
      .execute();
  },
};

export const qcafeAccountingLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration],
  moduleId: "qcafe.accounting",
  seeders: [],
};
