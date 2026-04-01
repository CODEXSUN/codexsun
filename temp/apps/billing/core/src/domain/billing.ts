export interface BillingDocumentCapability {
  area: 'billing'
  documents: string[]
  priorities: string[]
}

export const billingDocumentCapability: BillingDocumentCapability = {
  area: 'billing',
  documents: [
    'sales-invoice',
    'purchase-invoice',
    'sales-return',
    'purchase-return',
    'quotation',
    'delivery-challan',
  ],
  priorities: [
    'fast keyboard-first entry',
    'accounts-safe posting handoff',
    'inventory-linked document behavior',
    'print and export readiness',
  ],
}
