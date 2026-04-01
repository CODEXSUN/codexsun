export type {
  BillingLedger,
  BillingLedgerGroup,
  BillingLedgerGroupPrimaryBucket,
  BillingLedgerBalanceSummary,
  BillingLedgerCategory,
  BillingLedgerPostingLine,
  BillingTaxRate,
  BillingVoucher,
  BillingVoucherLine,
  BillingVoucherStatus,
  BillingVoucherType,
  BillingWorkspaceOverview,
  BillingWorkspaceResponse,
  BillingWorkspaceSnapshot,
  BillingWorkspaceState as BillingStoreState,
} from '@billing-core/index'

export type BillingOption = {
  value: string
  label: string
}

export type BillingVoucherModuleDefinition = {
  type: BillingVoucherType
  title: string
  description: string
  addLabel: string
  route: string
  documentLabel: string
  usesInventoryRows: boolean
  numberPrefix: string
}
