import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeAccountRow {
  active: number;
  business_id: string;
  code: string;
  created_at: string;
  id: string;
  name: string;
  type: "asset" | "liability" | "revenue" | "contra-revenue";
}

export interface QcafeJournalRow {
  business_id: string;
  created_at: string;
  created_by: string;
  id: string;
  location_id: string;
  number: string;
  posted_at: string | null;
  source_id: string;
  source_type: "bill" | "payment" | "refund" | "voucher-issue" | "voucher-apply";
  status: "draft" | "posted";
}

export interface QcafeJournalLineRow {
  account_id: string;
  credit_minor: number;
  debit_minor: number;
  id: string;
  journal_id: string;
  memo: string | null;
  tax_code: string | null;
}

export interface QcafeAccountingTables {
  qcafe_accounting_accounts: QcafeAccountRow;
  qcafe_accounting_journal_lines: QcafeJournalLineRow;
  qcafe_accounting_journals: QcafeJournalRow;
}

export type QcafeAccountingDatabase = QcafeFoundationDatabase & QcafeAccountingTables;
