import type { RowDataPacket } from 'mysql2'
import {
  createDefaultBillingLedgerGroups,
  createDefaultBillingLedgers,
  createDefaultBillingTaxRates,
  createDefaultBillingVouchers,
  type BillingLedger,
  type BillingLedgerGroup,
  type BillingWorkspaceState,
} from '@billing-core/index'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { billingTableNames } from '@framework-core/runtime/database/table-names'

interface BillingLedgerGroupRow extends RowDataPacket {
  id: string
  code: string
  name: string
  primary_bucket: BillingLedgerGroup['primaryBucket']
  parent_group_id: string | null
  parent_group_name: string | null
  description: string | null
  sort_order: number
  is_system: number
  is_active: number
}

interface BillingLedgerRow extends RowDataPacket {
  id: string
  code: string
  name: string
  category: BillingLedger['category']
  ledger_group_id: string
  group_name: string
  gstin: string | null
  state_name: string | null
  opening_balance: string | number
  balance_side: BillingLedger['balanceSide']
  linked_contact_id: string | null
  linked_mode: BillingLedger['linkedMode']
  is_system: number
  is_active: number
}

function toLedgerGroup(row: BillingLedgerGroupRow): BillingLedgerGroup {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    primaryBucket: row.primary_bucket,
    parentGroupId: row.parent_group_id,
    parentGroupName: row.parent_group_name,
    description: row.description ?? '',
    sortOrder: row.sort_order,
    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
  }
}

function toLedger(row: BillingLedgerRow): BillingLedger {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    groupId: row.ledger_group_id,
    parentGroup: row.group_name,
    gstin: row.gstin ?? '',
    state: row.state_name ?? '',
    openingBalance: Number(row.opening_balance ?? 0),
    balanceSide: row.balance_side,
    linkedContactId: row.linked_contact_id,
    linkedMode: row.linked_mode ?? null,
    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
  }
}

export class BillingAccountingRepository {
  async readWorkspaceState(): Promise<BillingWorkspaceState> {
    await ensureDatabaseSchema()

    const [ledgerGroups, ledgers] = await Promise.all([
      this.listLedgerGroups(),
      this.listLedgers(),
    ])

    return {
      ledgerGroups: ledgerGroups.length > 0 ? ledgerGroups : createDefaultBillingLedgerGroups(),
      ledgers: ledgers.length > 0 ? ledgers : createDefaultBillingLedgers(),
      taxRates: createDefaultBillingTaxRates(),
      vouchers: createDefaultBillingVouchers(),
    }
  }

  async listLedgerGroups() {
    const rows = await db.query<BillingLedgerGroupRow>(
      `
        SELECT
          g.id,
          g.code,
          g.name,
          g.primary_bucket,
          g.parent_group_id,
          parent.name AS parent_group_name,
          g.description,
          g.sort_order,
          g.is_system,
          g.is_active
        FROM ${billingTableNames.ledgerGroups} g
        LEFT JOIN ${billingTableNames.ledgerGroups} parent ON parent.id = g.parent_group_id
        WHERE g.is_active = 1
        ORDER BY g.sort_order ASC, g.name ASC
      `,
    )

    return rows.map(toLedgerGroup)
  }

  async listLedgers() {
    const rows = await db.query<BillingLedgerRow>(
      `
        SELECT
          l.id,
          l.code,
          l.name,
          l.category,
          l.ledger_group_id,
          g.name AS group_name,
          l.gstin,
          l.state_name,
          l.opening_balance,
          l.balance_side,
          l.linked_contact_id,
          l.linked_mode,
          l.is_system,
          l.is_active
        FROM ${billingTableNames.ledgers} l
        INNER JOIN ${billingTableNames.ledgerGroups} g ON g.id = l.ledger_group_id
        WHERE l.is_active = 1
        ORDER BY g.sort_order ASC, l.name ASC
      `,
    )

    return rows.map(toLedger)
  }
}
