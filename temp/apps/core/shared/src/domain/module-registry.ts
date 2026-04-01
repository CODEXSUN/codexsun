export type ProductModuleId =
  | 'organization'
  | 'masters'
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'tax'
  | 'inventory'
  | 'reports'
  | 'audit'
  | 'crm'
  | 'commerce'

export interface ProductModuleDefinition {
  id: ProductModuleId
  name: string
  summary: string
  readiness: 'foundation' | 'planned' | 'active'
}

export const productModules: ProductModuleDefinition[] = [
  {
    id: 'organization',
    name: 'Organization Setup',
    summary: 'Organizations, branches, books, and financial year controls.',
    readiness: 'foundation',
  },
  {
    id: 'masters',
    name: 'Masters',
    summary: 'Customer, supplier, item, tax profile, and ledger master data.',
    readiness: 'foundation',
  },
  {
    id: 'sales',
    name: 'Sales',
    summary: 'Sales quotations, invoices, and receivable-ready document flows.',
    readiness: 'planned',
  },
  {
    id: 'purchases',
    name: 'Purchases',
    summary: 'Purchase invoices, supplier accounting, and stock-linked procurement.',
    readiness: 'planned',
  },
  {
    id: 'payments',
    name: 'Payments',
    summary: 'Receipts, payments, contra, and allocation-ready cash flows.',
    readiness: 'planned',
  },
  {
    id: 'tax',
    name: 'Tax Engine',
    summary: 'GST-ready configurable rate slabs with versionable tax logic.',
    readiness: 'planned',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    summary: 'Stock movement, basic valuation, and warehouse-aware availability.',
    readiness: 'planned',
  },
  {
    id: 'reports',
    name: 'Financial Reports',
    summary: 'Trial balance, P&L, balance sheet, and reproducible period reporting.',
    readiness: 'planned',
  },
  {
    id: 'audit',
    name: 'Audit And Access',
    summary: 'Immutable audit trail, approval flows, and RBAC enforcement.',
    readiness: 'foundation',
  },
  {
    id: 'crm',
    name: 'CRM',
    summary: 'Leads, accounts, activities, and pipeline workflows on shared masters.',
    readiness: 'planned',
  },
  {
    id: 'commerce',
    name: 'Online Store',
    summary: 'Commerce catalog, order intake, and ERP-connected fulfillment hooks.',
    readiness: 'planned',
  },
]
