export type BillingVoucherType = 'sales' | 'purchase' | 'receipt' | 'payment' | 'journal' | 'contra'

export type BillingLedgerGroupPrimaryBucket = 'assets' | 'liabilities' | 'income' | 'expenses'

export type BillingLedgerCategory =
  | 'customer'
  | 'supplier'
  | 'cash'
  | 'bank'
  | 'sales'
  | 'purchase'
  | 'tax'
  | 'expense'
  | 'income'

export type BillingLedgerGroup = {
  id: string
  code: string
  name: string
  primaryBucket: BillingLedgerGroupPrimaryBucket
  parentGroupId: string | null
  parentGroupName: string | null
  description: string
  sortOrder: number
  isSystem: boolean
  isActive: boolean
}

export type BillingVoucherStatus = 'draft' | 'posted' | 'cancelled'

export type BillingLedger = {
  id: string
  code: string
  name: string
  category: BillingLedgerCategory
  groupId: string
  parentGroup: string
  gstin: string
  state: string
  openingBalance: number
  balanceSide: 'dr' | 'cr'
  linkedContactId: string | null
  linkedMode: 'party' | 'bank' | 'cash' | null
  isSystem: boolean
  isActive: boolean
}

export type BillingTaxRate = {
  id: string
  code: string
  label: string
  rate: number
  cgstRate: number
  sgstRate: number
  igstRate: number
  cessRate: number
  isActive: boolean
}

export type BillingVoucherLine = {
  id: string
  ledgerId: string
  itemName: string
  description: string
  hsnSacCode: string
  quantity: number
  unit: string
  rate: number
  discountPercent: number
  gstRateId: string
  debit: number
  credit: number
}

export type BillingVoucher = {
  id: string
  type: BillingVoucherType
  voucherNumber: string
  postingDate: string
  referenceNumber: string
  counterpartyLedgerId: string
  placeOfSupply: string
  gstTreatment: 'regular' | 'consumer' | 'sez' | 'export' | 'exempted'
  paymentMode: 'cash' | 'bank' | 'upi' | 'cheque' | 'adjustment'
  narration: string
  status: BillingVoucherStatus
  lines: BillingVoucherLine[]
}

export type BillingWorkspaceState = {
  ledgerGroups: BillingLedgerGroup[]
  ledgers: BillingLedger[]
  taxRates: BillingTaxRate[]
  vouchers: BillingVoucher[]
}

export type BillingLedgerPostingLine = {
  voucherId: string
  voucherType: BillingVoucherType
  voucherNumber: string
  postingDate: string
  ledgerId: string
  debit: number
  credit: number
  narration: string
}

export type BillingLedgerBalanceSummary = {
  ledgerId: string
  debit: number
  credit: number
}

export type BillingWorkspaceOverview = {
  outputGst: number
  inputGst: number
  netGstLiability: number
  activeTaxRateCount: number
}

export type BillingWorkspaceSnapshot = BillingWorkspaceState & {
  postingLines: BillingLedgerPostingLine[]
  ledgerBalances: BillingLedgerBalanceSummary[]
  overview: BillingWorkspaceOverview
  isReadOnly: boolean
}

export type BillingWorkspaceResponse = {
  workspace: BillingWorkspaceSnapshot
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function createInventoryLine(
  id: string,
  ledgerId: string,
  itemName: string,
  gstRateId: string,
  quantity: number,
  rate: number,
): BillingVoucherLine {
  return {
    id,
    ledgerId,
    itemName,
    description: itemName,
    hsnSacCode: '6109',
    quantity,
    unit: 'Nos',
    rate,
    discountPercent: 0,
    gstRateId,
    debit: 0,
    credit: 0,
  }
}

function createAccountingLine(
  id: string,
  ledgerId: string,
  description: string,
  debit: number,
  credit: number,
): BillingVoucherLine {
  return {
    id,
    ledgerId,
    itemName: '',
    description,
    hsnSacCode: '',
    quantity: 1,
    unit: 'Nos',
    rate: 0,
    discountPercent: 0,
    gstRateId: 'tax-0',
    debit,
    credit,
  }
}

export function createDefaultBillingLedgers(): BillingLedger[] {
  return [
    { id: 'led-cash', code: 'CASH001', name: 'Cash-in-Hand', category: 'cash', groupId: 'billing-ledger-group:cash', parentGroup: 'Cash-in-Hand', gstin: '', state: 'Tamil Nadu', openingBalance: 25000, balanceSide: 'dr', linkedContactId: null, linkedMode: 'cash', isSystem: true, isActive: true },
    { id: 'led-bank', code: 'BANK001', name: 'ICICI Current Account', category: 'bank', groupId: 'billing-ledger-group:bank', parentGroup: 'Bank Accounts', gstin: '', state: 'Tamil Nadu', openingBalance: 180000, balanceSide: 'dr', linkedContactId: null, linkedMode: 'bank', isSystem: true, isActive: true },
    { id: 'led-customer', code: 'CUS001', name: 'Aaran Retail LLP', category: 'customer', groupId: 'billing-ledger-group:debtors', parentGroup: 'Sundry Debtors', gstin: '33ABCDE1234F1Z5', state: 'Tamil Nadu', openingBalance: 64000, balanceSide: 'dr', linkedContactId: null, linkedMode: 'party', isSystem: true, isActive: true },
    { id: 'led-supplier', code: 'SUP001', name: 'Tiruppur Yarn Mills', category: 'supplier', groupId: 'billing-ledger-group:creditors', parentGroup: 'Sundry Creditors', gstin: '33AACCT7788R1Z2', state: 'Tamil Nadu', openingBalance: 42000, balanceSide: 'cr', linkedContactId: null, linkedMode: 'party', isSystem: true, isActive: true },
    { id: 'led-sales', code: 'SAL001', name: 'Domestic Sales', category: 'sales', groupId: 'billing-ledger-group:sales', parentGroup: 'Sales Accounts', gstin: '', state: 'Tamil Nadu', openingBalance: 0, balanceSide: 'cr', linkedContactId: null, linkedMode: null, isSystem: true, isActive: true },
    { id: 'led-purchase', code: 'PUR001', name: 'Purchase Account', category: 'purchase', groupId: 'billing-ledger-group:purchase', parentGroup: 'Purchase Accounts', gstin: '', state: 'Tamil Nadu', openingBalance: 0, balanceSide: 'dr', linkedContactId: null, linkedMode: null, isSystem: true, isActive: true },
    { id: 'led-gst', code: 'GST001', name: 'Output CGST/SGST', category: 'tax', groupId: 'billing-ledger-group:duties-taxes', parentGroup: 'Duties and Taxes', gstin: '', state: 'Tamil Nadu', openingBalance: 0, balanceSide: 'cr', linkedContactId: null, linkedMode: null, isSystem: true, isActive: true },
    { id: 'led-expense', code: 'EXP001', name: 'Freight Charges', category: 'expense', groupId: 'billing-ledger-group:indirect-expenses', parentGroup: 'Indirect Expenses', gstin: '', state: 'Tamil Nadu', openingBalance: 0, balanceSide: 'dr', linkedContactId: null, linkedMode: null, isSystem: true, isActive: true },
  ]
}

export function createDefaultBillingLedgerGroups(): BillingLedgerGroup[] {
  return [
    { id: 'billing-ledger-group:assets', code: 'ASSETS', name: 'Assets', primaryBucket: 'assets', parentGroupId: null, parentGroupName: null, description: 'Root group for asset-side balances.', sortOrder: 10, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:liabilities', code: 'LIABILITIES', name: 'Liabilities', primaryBucket: 'liabilities', parentGroupId: null, parentGroupName: null, description: 'Root group for liability-side balances.', sortOrder: 20, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:income', code: 'INCOME', name: 'Income', primaryBucket: 'income', parentGroupId: null, parentGroupName: null, description: 'Root group for revenue and income heads.', sortOrder: 30, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:expenses', code: 'EXPENSES', name: 'Expenses', primaryBucket: 'expenses', parentGroupId: null, parentGroupName: null, description: 'Root group for cost and expense heads.', sortOrder: 40, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:cash', code: 'CASH', name: 'Cash-in-Hand', primaryBucket: 'assets', parentGroupId: 'billing-ledger-group:assets', parentGroupName: 'Assets', description: 'Cash drawers and physical cash balances.', sortOrder: 110, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:bank', code: 'BANK', name: 'Bank Accounts', primaryBucket: 'assets', parentGroupId: 'billing-ledger-group:assets', parentGroupName: 'Assets', description: 'Current and savings bank balances.', sortOrder: 120, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:debtors', code: 'SUNDRY_DEBTORS', name: 'Sundry Debtors', primaryBucket: 'assets', parentGroupId: 'billing-ledger-group:assets', parentGroupName: 'Assets', description: 'Customer receivables and trade debtors.', sortOrder: 130, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:creditors', code: 'SUNDRY_CREDITORS', name: 'Sundry Creditors', primaryBucket: 'liabilities', parentGroupId: 'billing-ledger-group:liabilities', parentGroupName: 'Liabilities', description: 'Supplier payables and trade creditors.', sortOrder: 210, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:duties-taxes', code: 'DUTIES_TAXES', name: 'Duties and Taxes', primaryBucket: 'liabilities', parentGroupId: 'billing-ledger-group:liabilities', parentGroupName: 'Liabilities', description: 'GST and other statutory balances.', sortOrder: 220, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:sales', code: 'SALES_ACCOUNTS', name: 'Sales Accounts', primaryBucket: 'income', parentGroupId: 'billing-ledger-group:income', parentGroupName: 'Income', description: 'Domestic and export sales ledgers.', sortOrder: 310, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:purchase', code: 'PURCHASE_ACCOUNTS', name: 'Purchase Accounts', primaryBucket: 'expenses', parentGroupId: 'billing-ledger-group:expenses', parentGroupName: 'Expenses', description: 'Purchase and inward cost ledgers.', sortOrder: 410, isSystem: true, isActive: true },
    { id: 'billing-ledger-group:indirect-expenses', code: 'INDIRECT_EXPENSES', name: 'Indirect Expenses', primaryBucket: 'expenses', parentGroupId: 'billing-ledger-group:expenses', parentGroupName: 'Expenses', description: 'Freight, utilities, and indirect operating costs.', sortOrder: 420, isSystem: true, isActive: true },
  ]
}

export function createDefaultBillingTaxRates(): BillingTaxRate[] {
  return [
    { id: 'tax-0', code: 'GST0', label: 'GST 0%', rate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0, isActive: true },
    { id: 'tax-5', code: 'GST5', label: 'GST 5%', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, cessRate: 0, isActive: true },
    { id: 'tax-12', code: 'GST12', label: 'GST 12%', rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12, cessRate: 0, isActive: true },
    { id: 'tax-18', code: 'GST18', label: 'GST 18%', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, cessRate: 0, isActive: true },
  ]
}

export function createDefaultBillingVouchers(): BillingVoucher[] {
  return [
    { id: 'v-sales-1', type: 'sales', voucherNumber: 'INV-0001', postingDate: '2026-03-24', referenceNumber: 'PO-1108', counterpartyLedgerId: 'led-customer', placeOfSupply: 'Tamil Nadu', gstTreatment: 'regular', paymentMode: 'bank', narration: 'Spring knitwear dispatch invoice.', status: 'posted', lines: [createInventoryLine('line-1', 'led-sales', 'Cotton Polo Tee', 'tax-12', 24, 450), createInventoryLine('line-2', 'led-sales', 'Ribbed Lounge Set', 'tax-5', 8, 680)] },
    { id: 'v-purchase-1', type: 'purchase', voucherNumber: 'PUR-0001', postingDate: '2026-03-22', referenceNumber: 'SUP-443', counterpartyLedgerId: 'led-supplier', placeOfSupply: 'Tamil Nadu', gstTreatment: 'regular', paymentMode: 'bank', narration: 'Yarn and trims inward purchase.', status: 'posted', lines: [createInventoryLine('line-3', 'led-purchase', 'Combed Cotton Yarn', 'tax-5', 120, 210)] },
    { id: 'v-receipt-1', type: 'receipt', voucherNumber: 'RCPT-0001', postingDate: '2026-03-23', referenceNumber: 'UTR-91091', counterpartyLedgerId: 'led-customer', placeOfSupply: 'Tamil Nadu', gstTreatment: 'regular', paymentMode: 'bank', narration: 'Collection against invoice INV-0001.', status: 'posted', lines: [createAccountingLine('line-4', 'led-bank', 'Bank receipt', 18000, 0), createAccountingLine('line-5', 'led-customer', 'Against customer ledger', 0, 18000)] },
    { id: 'v-journal-1', type: 'journal', voucherNumber: 'JRN-0001', postingDate: '2026-03-24', referenceNumber: 'ADJ-12', counterpartyLedgerId: '', placeOfSupply: 'Tamil Nadu', gstTreatment: 'regular', paymentMode: 'adjustment', narration: 'Month-end expense accrual.', status: 'draft', lines: [createAccountingLine('line-6', 'led-expense', 'Freight accrual', 3200, 0), createAccountingLine('line-7', 'led-bank', 'Provision', 0, 3200)] },
  ]
}

export function createDefaultBillingWorkspaceState(): BillingWorkspaceState {
  return {
    ledgerGroups: createDefaultBillingLedgerGroups(),
    ledgers: createDefaultBillingLedgers(),
    taxRates: createDefaultBillingTaxRates(),
    vouchers: createDefaultBillingVouchers(),
  }
}

export function resolveLedgerName(ledgers: BillingLedger[], ledgerId: string) {
  return ledgers.find((ledger) => ledger.id === ledgerId)?.name ?? '-'
}

export function resolveTaxRate(taxRates: BillingTaxRate[], taxRateId: string) {
  return taxRates.find((rate) => rate.id === taxRateId)?.rate ?? 0
}

export function calculateInventoryLineTotal(line: BillingVoucherLine, taxRates: BillingTaxRate[]) {
  const gross = roundCurrency(line.quantity * line.rate)
  const discountAmount = roundCurrency(gross * (line.discountPercent / 100))
  const taxableValue = roundCurrency(gross - discountAmount)
  const gstAmount = roundCurrency(taxableValue * (resolveTaxRate(taxRates, line.gstRateId) / 100))
  const total = roundCurrency(taxableValue + gstAmount)
  return { gross, discountAmount, taxableValue, gstAmount, total }
}

export function calculateVoucherTotals(
  voucher: Pick<BillingVoucher, 'lines'>,
  taxRates: BillingTaxRate[],
  inventoryMode: boolean,
) {
  if (inventoryMode) {
    return voucher.lines.reduce(
      (summary, line) => {
        const totals = calculateInventoryLineTotal(line, taxRates)
        return {
          taxableValue: roundCurrency(summary.taxableValue + totals.taxableValue),
          gstAmount: roundCurrency(summary.gstAmount + totals.gstAmount),
          total: roundCurrency(summary.total + totals.total),
          debit: 0,
          credit: 0,
        }
      },
      { taxableValue: 0, gstAmount: 0, total: 0, debit: 0, credit: 0 },
    )
  }

  return voucher.lines.reduce(
    (summary, line) => ({
      taxableValue: 0,
      gstAmount: 0,
      total: roundCurrency(summary.total + line.debit),
      debit: roundCurrency(summary.debit + line.debit),
      credit: roundCurrency(summary.credit + line.credit),
    }),
    { taxableValue: 0, gstAmount: 0, total: 0, debit: 0, credit: 0 },
  )
}

export function buildLedgerPostingLines(
  vouchers: BillingVoucher[],
  ledgers: BillingLedger[],
  taxRates: BillingTaxRate[],
) {
  const postingLines: BillingLedgerPostingLine[] = []

  vouchers
    .filter((voucher) => voucher.status === 'posted')
    .forEach((voucher) => {
      if (voucher.type === 'sales' || voucher.type === 'purchase') {
        const total = calculateVoucherTotals(voucher, taxRates, true)
        const revenueLedgerId = voucher.lines[0]?.ledgerId ?? ''
        const controlLedgerId = voucher.counterpartyLedgerId
        const taxLedgerId = ledgers.find((item) => item.category === 'tax')?.id ?? ''

        if (controlLedgerId) {
          postingLines.push({
            voucherId: voucher.id,
            voucherType: voucher.type,
            voucherNumber: voucher.voucherNumber,
            postingDate: voucher.postingDate,
            ledgerId: controlLedgerId,
            debit: voucher.type === 'sales' ? total.total : 0,
            credit: voucher.type === 'purchase' ? total.total : 0,
            narration: voucher.narration,
          })
        }

        if (revenueLedgerId) {
          postingLines.push({
            voucherId: voucher.id,
            voucherType: voucher.type,
            voucherNumber: voucher.voucherNumber,
            postingDate: voucher.postingDate,
            ledgerId: revenueLedgerId,
            debit: voucher.type === 'purchase' ? total.taxableValue : 0,
            credit: voucher.type === 'sales' ? total.taxableValue : 0,
            narration: voucher.narration,
          })
        }

        if (taxLedgerId && total.gstAmount > 0) {
          postingLines.push({
            voucherId: voucher.id,
            voucherType: voucher.type,
            voucherNumber: voucher.voucherNumber,
            postingDate: voucher.postingDate,
            ledgerId: taxLedgerId,
            debit: voucher.type === 'purchase' ? total.gstAmount : 0,
            credit: voucher.type === 'sales' ? total.gstAmount : 0,
            narration: voucher.narration,
          })
        }

        return
      }

      voucher.lines.forEach((line) => {
        postingLines.push({
          voucherId: voucher.id,
          voucherType: voucher.type,
          voucherNumber: voucher.voucherNumber,
          postingDate: voucher.postingDate,
          ledgerId: line.ledgerId,
          debit: line.debit,
          credit: line.credit,
          narration: line.description || voucher.narration,
        })
      })
    })

  return postingLines
}

export function summarizeLedgerBalances(lines: BillingLedgerPostingLine[]): BillingLedgerBalanceSummary[] {
  const summary = new Map<string, { debit: number; credit: number }>()

  lines.forEach((line) => {
    const current = summary.get(line.ledgerId) ?? { debit: 0, credit: 0 }
    summary.set(line.ledgerId, {
      debit: roundCurrency(current.debit + line.debit),
      credit: roundCurrency(current.credit + line.credit),
    })
  })

  return Array.from(summary.entries()).map(([ledgerId, values]) => ({
    ledgerId,
    debit: values.debit,
    credit: values.credit,
  }))
}

export function buildBillingWorkspaceSnapshot(state: BillingWorkspaceState): BillingWorkspaceSnapshot {
  const postingLines = buildLedgerPostingLines(state.vouchers, state.ledgers, state.taxRates)
  const ledgerBalances = summarizeLedgerBalances(postingLines)
  const outputGst = state.vouchers
    .filter((item) => item.type === 'sales')
    .reduce((sum, item) => sum + calculateVoucherTotals(item, state.taxRates, true).gstAmount, 0)
  const inputGst = state.vouchers
    .filter((item) => item.type === 'purchase')
    .reduce((sum, item) => sum + calculateVoucherTotals(item, state.taxRates, true).gstAmount, 0)

  return {
    ...state,
    postingLines,
    ledgerBalances,
    overview: {
      outputGst: roundCurrency(outputGst),
      inputGst: roundCurrency(inputGst),
      netGstLiability: roundCurrency(outputGst - inputGst),
      activeTaxRateCount: state.taxRates.filter((item) => item.isActive).length,
    },
    isReadOnly: true,
  }
}
