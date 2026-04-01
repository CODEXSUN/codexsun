export type BillingConnectorId = 'tally' | 'erpnext'

export type BillingCapabilityId =
  | 'foundation'
  | 'masters'
  | 'accounts'
  | 'inventory'
  | 'billing'
  | 'reports'
  | 'connectors'

export interface BillingCapabilityDefinition {
  id: BillingCapabilityId
  name: string
  summary: string
  readiness: 'scaffold' | 'planned' | 'active'
}

export interface BillingConnectorDefinition {
  id: BillingConnectorId
  name: string
  direction: 'import' | 'export' | 'bidirectional'
  summary: string
  readiness: 'scaffold' | 'planned' | 'active'
}

export interface BillingProductManifest {
  id: 'billing'
  name: string
  runtime: 'desktop-first'
  tone: 'auditor-focused'
  summary: string
  capabilities: BillingCapabilityDefinition[]
  connectors: BillingConnectorDefinition[]
}

export const billingCapabilities: BillingCapabilityDefinition[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    summary: 'Company, books, permissions, settings, and audit-safe product setup.',
    readiness: 'scaffold',
  },
  {
    id: 'masters',
    name: 'Masters',
    summary: 'Ledger, party, item, tax, warehouse, and bank master structures.',
    readiness: 'scaffold',
  },
  {
    id: 'accounts',
    name: 'Accounts',
    summary: 'Voucher-first accounting flows inspired by Tally-style bookkeeping.',
    readiness: 'planned',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    summary: 'Date-reproducible stock movement and warehouse-aware stock ledgers.',
    readiness: 'planned',
  },
  {
    id: 'billing',
    name: 'Billing',
    summary: 'Sales, purchase, and return documents built on trusted accounts and stock.',
    readiness: 'planned',
  },
  {
    id: 'reports',
    name: 'Reports',
    summary: 'Ledger, trial balance, P&L, balance sheet, registers, and audit views.',
    readiness: 'planned',
  },
  {
    id: 'connectors',
    name: 'Connectors',
    summary: 'Optional external integrations with reviewable two-way sync boundaries.',
    readiness: 'scaffold',
  },
]

export const billingConnectors: BillingConnectorDefinition[] = [
  {
    id: 'tally',
    name: 'Tally',
    direction: 'bidirectional',
    summary: 'Voucher, master, and stock-oriented sync adapter boundary for Tally.',
    readiness: 'scaffold',
  },
  {
    id: 'erpnext',
    name: 'ERPNext / Frappe',
    direction: 'bidirectional',
    summary: 'Connector boundary for ERPNext item, party, invoice, and stock exchange.',
    readiness: 'scaffold',
  },
]

export const billingProductManifest: BillingProductManifest = {
  id: 'billing',
  name: 'codexsun Billing',
  runtime: 'desktop-first',
  tone: 'auditor-focused',
  summary:
    'Standalone billing-and-accounts product for small businesses with Tally-like accounting and inventory discipline.',
  capabilities: billingCapabilities,
  connectors: billingConnectors,
}
