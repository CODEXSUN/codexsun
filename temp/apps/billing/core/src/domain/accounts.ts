export type BillingVoucherKind =
  | 'journal'
  | 'receipt'
  | 'payment'
  | 'contra'
  | 'debit-note'
  | 'credit-note'
  | 'sales'
  | 'purchase'

export interface BillingAccountsCapability {
  area: 'accounts'
  voucherKinds: BillingVoucherKind[]
  priorities: string[]
}

export const billingAccountsCapability: BillingAccountsCapability = {
  area: 'accounts',
  voucherKinds: ['journal', 'receipt', 'payment', 'contra', 'debit-note', 'credit-note', 'sales', 'purchase'],
  priorities: [
    'double-entry correctness',
    'period lock enforcement',
    'reversal over destructive correction',
    'auditor-readable voucher history',
  ],
}
