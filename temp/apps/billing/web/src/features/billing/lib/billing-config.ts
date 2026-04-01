import type { BillingLedgerCategory, BillingVoucherModuleDefinition, BillingVoucherType } from '@billing-web/features/billing/lib/billing-types'

export const billingLedgerCategoryOptions: Array<{ value: BillingLedgerCategory; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'tax', label: 'Tax' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
]

export const billingBalanceSideOptions = [
  { value: 'dr', label: 'Dr' },
  { value: 'cr', label: 'Cr' },
] as const

export const billingGstTreatmentOptions = [
  { value: 'regular', label: 'Regular GST' },
  { value: 'consumer', label: 'Consumer / B2C' },
  { value: 'sez', label: 'SEZ' },
  { value: 'export', label: 'Export' },
  { value: 'exempted', label: 'Exempted' },
] as const

export const billingPaymentModeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'adjustment', label: 'Adjustment' },
] as const

export const billingUnitOptions = [
  { value: 'Nos', label: 'Nos' },
  { value: 'Box', label: 'Box' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Set', label: 'Set' },
] as const

export const billingParentGroups = [
  'Sundry Debtors',
  'Sundry Creditors',
  'Cash-in-Hand',
  'Bank Accounts',
  'Sales Accounts',
  'Purchase Accounts',
  'Duties and Taxes',
  'Indirect Expenses',
  'Indirect Incomes',
]

export const billingVoucherModules: Record<BillingVoucherType, BillingVoucherModuleDefinition> = {
  sales: {
    type: 'sales',
    title: 'Sales Invoices',
    description: 'Create GST-ready sales invoices with party, item rows, tax breakup, and posting totals.',
    addLabel: 'New Invoice',
    route: '/invoices',
    documentLabel: 'Invoice',
    usesInventoryRows: true,
    numberPrefix: 'INV',
  },
  purchase: {
    type: 'purchase',
    title: 'Purchase Vouchers',
    description: 'Capture supplier purchases with item rows, GST, landed value, and stock-affecting totals.',
    addLabel: 'New Purchase',
    route: '/purchases',
    documentLabel: 'Purchase',
    usesInventoryRows: true,
    numberPrefix: 'PUR',
  },
  receipt: {
    type: 'receipt',
    title: 'Receipt Vouchers',
    description: 'Record customer collections and bank or cash receipts with compact debit-credit entry.',
    addLabel: 'New Receipt',
    route: '/receipts',
    documentLabel: 'Receipt',
    usesInventoryRows: false,
    numberPrefix: 'RCPT',
  },
  payment: {
    type: 'payment',
    title: 'Payment Vouchers',
    description: 'Post supplier payments, expense disbursements, and settlement entries from cash or bank.',
    addLabel: 'New Payment',
    route: '/payments',
    documentLabel: 'Payment',
    usesInventoryRows: false,
    numberPrefix: 'PAY',
  },
  journal: {
    type: 'journal',
    title: 'Journal Vouchers',
    description: 'Pass manual accounting adjustments with controlled debit-credit tables and voucher balance checks.',
    addLabel: 'New Journal',
    route: '/journals',
    documentLabel: 'Journal',
    usesInventoryRows: false,
    numberPrefix: 'JRN',
  },
  contra: {
    type: 'contra',
    title: 'Contra Vouchers',
    description: 'Handle cash-to-bank and bank-to-bank transfers inside one compact accounting entry flow.',
    addLabel: 'New Contra',
    route: '/contra',
    documentLabel: 'Contra',
    usesInventoryRows: false,
    numberPrefix: 'CNT',
  },
}
