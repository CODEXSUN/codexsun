import { billingTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

type SeedRow = Record<string, string | number | boolean | null>

async function seedRows(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  table: string,
  columns: string[],
  rows: SeedRow[],
) {
  const updateColumns = columns.filter((column) => column !== 'id')
  const upsertSql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
      ${updateColumns.map((column) => `${column} = VALUES(${column})`).join(', ')},
      is_active = 1
  `

  for (const row of rows) {
    await execute(
      upsertSql,
      columns.map((column) => {
        const value = row[column]
        return value === undefined ? null : value
      }),
    )
  }
}

export const billingAccountingFoundationMigration: Migration = {
  id: '032-billing-accounting-foundation',
  name: 'Billing accounting foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${billingTableNames.ledgerGroups} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        primary_bucket VARCHAR(32) NOT NULL,
        parent_group_id VARCHAR(64) NULL,
        description TEXT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_system TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_billing_ledger_groups_name (name),
        INDEX idx_billing_ledger_groups_bucket (primary_bucket),
        INDEX idx_billing_ledger_groups_parent (parent_group_id),
        CONSTRAINT fk_billing_ledger_groups_parent FOREIGN KEY (parent_group_id) REFERENCES ${billingTableNames.ledgerGroups}(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${billingTableNames.ledgers} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL,
        category VARCHAR(32) NOT NULL,
        ledger_group_id VARCHAR(64) NOT NULL,
        gstin VARCHAR(20) NULL,
        state_name VARCHAR(120) NULL,
        opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
        balance_side VARCHAR(8) NOT NULL DEFAULT 'dr',
        linked_contact_id VARCHAR(64) NULL,
        linked_mode VARCHAR(32) NULL,
        is_system TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_billing_ledgers_name (name),
        INDEX idx_billing_ledgers_group (ledger_group_id),
        INDEX idx_billing_ledgers_category (category),
        CONSTRAINT fk_billing_ledgers_group FOREIGN KEY (ledger_group_id) REFERENCES ${billingTableNames.ledgerGroups}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    const execute = db.execute.bind(db)

    await seedRows(execute, billingTableNames.ledgerGroups, [
      'id',
      'code',
      'name',
      'primary_bucket',
      'parent_group_id',
      'description',
      'sort_order',
      'is_system',
    ], [
      { id: 'billing-ledger-group:assets', code: 'ASSETS', name: 'Assets', primary_bucket: 'assets', parent_group_id: null, description: 'Root group for asset-side balances.', sort_order: 10, is_system: 1 },
      { id: 'billing-ledger-group:liabilities', code: 'LIABILITIES', name: 'Liabilities', primary_bucket: 'liabilities', parent_group_id: null, description: 'Root group for liability-side balances.', sort_order: 20, is_system: 1 },
      { id: 'billing-ledger-group:income', code: 'INCOME', name: 'Income', primary_bucket: 'income', parent_group_id: null, description: 'Root group for revenue and income heads.', sort_order: 30, is_system: 1 },
      { id: 'billing-ledger-group:expenses', code: 'EXPENSES', name: 'Expenses', primary_bucket: 'expenses', parent_group_id: null, description: 'Root group for cost and expense heads.', sort_order: 40, is_system: 1 },
      { id: 'billing-ledger-group:cash', code: 'CASH', name: 'Cash-in-Hand', primary_bucket: 'assets', parent_group_id: 'billing-ledger-group:assets', description: 'Cash drawers and physical cash balances.', sort_order: 110, is_system: 1 },
      { id: 'billing-ledger-group:bank', code: 'BANK', name: 'Bank Accounts', primary_bucket: 'assets', parent_group_id: 'billing-ledger-group:assets', description: 'Current and savings bank balances.', sort_order: 120, is_system: 1 },
      { id: 'billing-ledger-group:debtors', code: 'SUNDRY_DEBTORS', name: 'Sundry Debtors', primary_bucket: 'assets', parent_group_id: 'billing-ledger-group:assets', description: 'Customer receivables and trade debtors.', sort_order: 130, is_system: 1 },
      { id: 'billing-ledger-group:creditors', code: 'SUNDRY_CREDITORS', name: 'Sundry Creditors', primary_bucket: 'liabilities', parent_group_id: 'billing-ledger-group:liabilities', description: 'Supplier payables and trade creditors.', sort_order: 210, is_system: 1 },
      { id: 'billing-ledger-group:duties-taxes', code: 'DUTIES_TAXES', name: 'Duties and Taxes', primary_bucket: 'liabilities', parent_group_id: 'billing-ledger-group:liabilities', description: 'GST and other statutory balances.', sort_order: 220, is_system: 1 },
      { id: 'billing-ledger-group:sales', code: 'SALES_ACCOUNTS', name: 'Sales Accounts', primary_bucket: 'income', parent_group_id: 'billing-ledger-group:income', description: 'Domestic and export sales ledgers.', sort_order: 310, is_system: 1 },
      { id: 'billing-ledger-group:purchase', code: 'PURCHASE_ACCOUNTS', name: 'Purchase Accounts', primary_bucket: 'expenses', parent_group_id: 'billing-ledger-group:expenses', description: 'Purchase and inward cost ledgers.', sort_order: 410, is_system: 1 },
      { id: 'billing-ledger-group:indirect-expenses', code: 'INDIRECT_EXPENSES', name: 'Indirect Expenses', primary_bucket: 'expenses', parent_group_id: 'billing-ledger-group:expenses', description: 'Freight, utilities, and indirect operating costs.', sort_order: 420, is_system: 1 }
    ])

    await seedRows(execute, billingTableNames.ledgers, [
      'id',
      'code',
      'name',
      'category',
      'ledger_group_id',
      'gstin',
      'state_name',
      'opening_balance',
      'balance_side',
      'linked_contact_id',
      'linked_mode',
      'is_system',
    ], [
      { id: 'led-cash', code: 'CASH001', name: 'Cash-in-Hand', category: 'cash', ledger_group_id: 'billing-ledger-group:cash', gstin: null, state_name: 'Tamil Nadu', opening_balance: 25000, balance_side: 'dr', linked_contact_id: null, linked_mode: 'cash', is_system: 1 },
      { id: 'led-bank', code: 'BANK001', name: 'ICICI Current Account', category: 'bank', ledger_group_id: 'billing-ledger-group:bank', gstin: null, state_name: 'Tamil Nadu', opening_balance: 180000, balance_side: 'dr', linked_contact_id: null, linked_mode: 'bank', is_system: 1 },
      { id: 'led-customer', code: 'CUS001', name: 'Aaran Retail LLP', category: 'customer', ledger_group_id: 'billing-ledger-group:debtors', gstin: '33ABCDE1234F1Z5', state_name: 'Tamil Nadu', opening_balance: 64000, balance_side: 'dr', linked_contact_id: null, linked_mode: 'party', is_system: 1 },
      { id: 'led-supplier', code: 'SUP001', name: 'Tiruppur Yarn Mills', category: 'supplier', ledger_group_id: 'billing-ledger-group:creditors', gstin: '33AACCT7788R1Z2', state_name: 'Tamil Nadu', opening_balance: 42000, balance_side: 'cr', linked_contact_id: null, linked_mode: 'party', is_system: 1 },
      { id: 'led-sales', code: 'SAL001', name: 'Domestic Sales', category: 'sales', ledger_group_id: 'billing-ledger-group:sales', gstin: null, state_name: 'Tamil Nadu', opening_balance: 0, balance_side: 'cr', linked_contact_id: null, linked_mode: null, is_system: 1 },
      { id: 'led-purchase', code: 'PUR001', name: 'Purchase Account', category: 'purchase', ledger_group_id: 'billing-ledger-group:purchase', gstin: null, state_name: 'Tamil Nadu', opening_balance: 0, balance_side: 'dr', linked_contact_id: null, linked_mode: null, is_system: 1 },
      { id: 'led-gst', code: 'GST001', name: 'Output CGST/SGST', category: 'tax', ledger_group_id: 'billing-ledger-group:duties-taxes', gstin: null, state_name: 'Tamil Nadu', opening_balance: 0, balance_side: 'cr', linked_contact_id: null, linked_mode: null, is_system: 1 },
      { id: 'led-expense', code: 'EXP001', name: 'Freight Charges', category: 'expense', ledger_group_id: 'billing-ledger-group:indirect-expenses', gstin: null, state_name: 'Tamil Nadu', opening_balance: 0, balance_side: 'dr', linked_contact_id: null, linked_mode: null, is_system: 1 }
    ])
  },
}
