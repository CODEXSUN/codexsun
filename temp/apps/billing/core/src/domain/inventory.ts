export interface BillingInventoryCapability {
  area: 'inventory'
  stockDocuments: string[]
  priorities: string[]
}

export const billingInventoryCapability: BillingInventoryCapability = {
  area: 'inventory',
  stockDocuments: ['opening-stock', 'stock-journal', 'stock-transfer', 'stock-adjustment', 'sales', 'purchase'],
  priorities: [
    'date-reproducible stock ledger',
    'warehouse-aware balances',
    'traceable stock correction flow',
    'accounting-linked inventory movement',
  ],
}
