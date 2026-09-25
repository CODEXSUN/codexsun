import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { AccountingScope } from "../contracts/accounting.contract.js";
import type { QcafeAccountingDatabase } from "../persistence/accounting.database.js";

export const ACCOUNT_CHART = [
  { code: "1000", name: "Cash", type: "asset" },
  { code: "1010", name: "Card clearing", type: "asset" },
  { code: "1020", name: "UPI clearing", type: "asset" },
  { code: "1030", name: "Bank", type: "asset" },
  { code: "1100", name: "Marketplace receivable", type: "asset" },
  { code: "2000", name: "GST output", type: "liability" },
  { code: "4000", name: "Sales", type: "revenue" },
  { code: "4010", name: "Discounts", type: "contra-revenue" },
] as const;

export const CLEARING_BY_METHOD_KIND: Record<string, string> = {
  bank: "1030",
  card: "1010",
  cash: "1000",
  digital: "1030",
  marketplace: "1030",
  room_charge: "1030",
  upi: "1020",
  voucher: "1100",
};

export class AccountingRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeAccountingDatabase>;
  }

  location(scope: AccountingScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  businessForLocation(locationId: string) {
    return this.db
      .selectFrom("qcafe_locations")
      .select(["id", "business_id"])
      .where("id", "=", locationId)
      .executeTakeFirst();
  }

  async workspace(scope: AccountingScope) {
    const db = this.tables();
    const accounts = await db
      .selectFrom("qcafe_accounting_accounts")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .orderBy("code")
      .execute();
    const journals = await db
      .selectFrom("qcafe_accounting_journals")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    const journalIds = journals.map((journal) => journal.id);
    return {
      accounts,
      journalLines: journalIds.length
        ? await db
            .selectFrom("qcafe_accounting_journal_lines")
            .selectAll()
            .where("journal_id", "in", journalIds)
            .execute()
        : [],
      journals,
    };
  }

  async ensureChart(businessId: string, now: string) {
    const db = this.tables();
    const existing = await db
      .selectFrom("qcafe_accounting_accounts")
      .select("code")
      .where("business_id", "=", businessId)
      .execute();
    const known = new Set(existing.map((row) => row.code));
    const missing = ACCOUNT_CHART.filter((account) => !known.has(account.code));
    if (!missing.length) return;
    await db
      .insertInto("qcafe_accounting_accounts")
      .values(
        missing.map((account) => ({
          active: 1,
          business_id: businessId,
          code: account.code,
          created_at: now,
          id: randomUUID(),
          name: account.name,
          type: account.type,
        })),
      )
      .execute();
  }

  async accountByCode(businessId: string, code: string) {
    return this.tables()
      .selectFrom("qcafe_accounting_accounts")
      .selectAll()
      .where("business_id", "=", businessId)
      .where("code", "=", code)
      .executeTakeFirst();
  }

  journal(id: string) {
    return this.tables().selectFrom("qcafe_accounting_journals").selectAll().where("id", "=", id).executeTakeFirst();
  }

  journalBySource(sourceType: "bill" | "payment" | "refund" | "voucher-issue" | "voucher-apply", sourceId: string) {
    return this.tables()
      .selectFrom("qcafe_accounting_journals")
      .selectAll()
      .where("source_type", "=", sourceType)
      .where("source_id", "=", sourceId)
      .executeTakeFirst();
  }

  journalLines(journalId: string) {
    return this.tables()
      .selectFrom("qcafe_accounting_journal_lines")
      .selectAll()
      .where("journal_id", "=", journalId)
      .execute();
  }

  bill(id: string) {
    return this.db.selectFrom("qcafe_bills").selectAll().where("id", "=", id).executeTakeFirst();
  }

  billTaxes(billId: string) {
    return this.db.selectFrom("qcafe_bill_taxes").selectAll().where("bill_id", "=", billId).execute();
  }

  payment(id: string) {
    return this.db.selectFrom("qcafe_payments").selectAll().where("id", "=", id).executeTakeFirst();
  }

  paymentMethod(id: string) {
    return this.db.selectFrom("qcafe_payment_methods").selectAll().where("id", "=", id).executeTakeFirst();
  }

  voucher(id: string) {
    return this.db.selectFrom("qcafe_vouchers").selectAll().where("id", "=", id).executeTakeFirst();
  }

  voucherApplication(id: string) {
    return this.db.selectFrom("qcafe_voucher_applications").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async nextJournalNumber(locationId: string, now: string) {
    return this.db.transaction().execute(async (tx) => {
      const existing = await tx
        .selectFrom("qcafe_number_sequences")
        .selectAll()
        .where("location_id", "=", locationId)
        .where("document_kind", "=", "journal")
        .executeTakeFirst();
      if (existing) {
        await tx
          .updateTable("qcafe_number_sequences")
          .set({ next_value: existing.next_value + 1, updated_at: now })
          .where("id", "=", existing.id)
          .execute();
        return `${existing.prefix}-${String(existing.next_value).padStart(6, "0")}`;
      }
      await tx
        .insertInto("qcafe_number_sequences")
        .values({
          document_kind: "journal",
          id: randomUUID(),
          location_id: locationId,
          next_value: 2,
          prefix: "J",
          updated_at: now,
        })
        .execute();
      return "J-000001";
    });
  }

  async createJournal(
    scope: AccountingScope,
    input: {
      number: string;
      sourceId: string;
      sourceType: "bill" | "payment" | "refund" | "voucher-issue" | "voucher-apply";
    },
    lines: ReadonlyArray<{
      accountId: string;
      creditMinor: number;
      debitMinor: number;
      memo?: string;
      taxCode?: string;
    }>,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeAccountingDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_accounting_journals")
        .values({
          business_id: scope.businessId,
          created_at: now,
          created_by: actor,
          id,
          location_id: scope.locationId,
          number: input.number,
          posted_at: null,
          source_id: input.sourceId,
          source_type: input.sourceType,
          status: "draft",
        })
        .execute();
      await db
        .insertInto("qcafe_accounting_journal_lines")
        .values(
          lines.map((line) => ({
            account_id: line.accountId,
            credit_minor: line.creditMinor,
            debit_minor: line.debitMinor,
            id: randomUUID(),
            journal_id: id,
            memo: line.memo ?? null,
            tax_code: line.taxCode ?? null,
          })),
        )
        .execute();
      return id;
    });
  }

  async postJournal(id: string, now: string) {
    await this.tables()
      .updateTable("qcafe_accounting_journals")
      .set({ posted_at: now, status: "posted" })
      .where("id", "=", id)
      .where("status", "=", "draft")
      .execute();
  }
}
