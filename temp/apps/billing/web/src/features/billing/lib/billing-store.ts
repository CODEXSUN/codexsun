import { useSyncExternalStore } from 'react'
import {
  createDefaultBillingWorkspaceState,
} from '@billing-core/index'
import type { BillingLedger, BillingLedgerPostingLine, BillingStoreState, BillingTaxRate, BillingVoucher, BillingVoucherLine, BillingVoucherType } from '@billing-web/features/billing/lib/billing-types'

const STORAGE_KEY = 'codexsun.billing.workspace.v1'

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getDefaultState(): BillingStoreState {
  return createDefaultBillingWorkspaceState()
}

function readState(): BillingStoreState {
  if (typeof window === 'undefined') return getDefaultState()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return getDefaultState()
  try { return JSON.parse(raw) as BillingStoreState } catch { return getDefaultState() }
}

let state = readState()
const listeners = new Set<() => void>()

function emit() {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((listener) => listener())
}

function updateState(updater: (current: BillingStoreState) => BillingStoreState) {
  state = updater(state)
  emit()
}

export function useBillingStore() {
  const snapshot = useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => state, () => state)
  return {
    state: snapshot,
    createLedger(input: Omit<BillingLedger, 'id'>) {
      const nextLedger: BillingLedger = { ...input, id: createId('ledger') }
      updateState((current) => ({ ...current, ledgers: [nextLedger, ...current.ledgers] }))
      return nextLedger
    },
    updateLedger(id: string, input: Omit<BillingLedger, 'id'>) {
      updateState((current) => ({ ...current, ledgers: current.ledgers.map((ledger) => (ledger.id === id ? { ...input, id } : ledger)) }))
    },
    createVoucher(input: Omit<BillingVoucher, 'id'>) {
      const nextVoucher: BillingVoucher = { ...input, id: createId('voucher'), lines: input.lines.map((line) => ({ ...line, id: line.id || createId('line') })) }
      updateState((current) => ({ ...current, vouchers: [nextVoucher, ...current.vouchers] }))
      return nextVoucher
    },
    updateVoucher(id: string, input: Omit<BillingVoucher, 'id'>) {
      updateState((current) => ({ ...current, vouchers: current.vouchers.map((voucher) => (voucher.id === id ? { ...input, id } : voucher)) }))
    },
    cancelVoucher(id: string) {
      updateState((current) => ({ ...current, vouchers: current.vouchers.map((voucher) => voucher.id === id ? { ...voucher, status: 'cancelled', narration: voucher.narration ? `${voucher.narration} (Cancelled)` : 'Cancelled voucher' } : voucher) }))
    },
    createTaxRate(input: Omit<BillingTaxRate, 'id'>) {
      const nextRate: BillingTaxRate = { ...input, id: createId('tax') }
      updateState((current) => ({ ...current, taxRates: [nextRate, ...current.taxRates] }))
      return nextRate
    },
  }
}

export function buildNextVoucherNumber(vouchers: BillingVoucher[], type: BillingVoucherType, prefix: string) {
  const currentMax = vouchers.filter((voucher) => voucher.type === type).map((voucher) => { const match = voucher.voucherNumber.match(/(\d+)$/); return match ? Number(match[1]) : 0 }).reduce((max, current) => Math.max(max, current), 0)
  return `${prefix}-${String(currentMax + 1).padStart(4, '0')}`
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

export function calculateVoucherTotals(voucher: Pick<BillingVoucher, 'lines'>, taxRates: BillingTaxRate[], inventoryMode: boolean) {
  if (inventoryMode) {
    return voucher.lines.reduce((summary, line) => {
      const totals = calculateInventoryLineTotal(line, taxRates)
      return { taxableValue: roundCurrency(summary.taxableValue + totals.taxableValue), gstAmount: roundCurrency(summary.gstAmount + totals.gstAmount), total: roundCurrency(summary.total + totals.total), debit: 0, credit: 0 }
    }, { taxableValue: 0, gstAmount: 0, total: 0, debit: 0, credit: 0 })
  }
  return voucher.lines.reduce((summary, line) => ({ taxableValue: 0, gstAmount: 0, total: roundCurrency(summary.total + line.debit), debit: roundCurrency(summary.debit + line.debit), credit: roundCurrency(summary.credit + line.credit) }), { taxableValue: 0, gstAmount: 0, total: 0, debit: 0, credit: 0 })
}

export function getLockedPeriodCutoff() {
  return '2026-03-01'
}

export function validateVoucherRules(voucher: Omit<BillingVoucher, 'id'>, vouchers: BillingVoucher[], ledgers: BillingLedger[], taxRates: BillingTaxRate[], inventoryMode: boolean, editingId?: string | null) {
  if (voucher.postingDate < getLockedPeriodCutoff()) return `The period before ${getLockedPeriodCutoff()} is locked.`
  const duplicate = vouchers.find((item) => item.type === voucher.type && item.voucherNumber.trim().toLowerCase() === voucher.voucherNumber.trim().toLowerCase() && item.id !== editingId)
  if (duplicate) return `Voucher number ${voucher.voucherNumber} already exists for this voucher type.`
  const activeLedgerIds = new Set(ledgers.filter((item) => item.isActive).map((item) => item.id))
  if (voucher.lines.some((line) => !activeLedgerIds.has(line.ledgerId))) return 'Every voucher line must use an active ledger.'
  if (voucher.counterpartyLedgerId && !activeLedgerIds.has(voucher.counterpartyLedgerId)) return 'Counterparty ledger must be active.'
  if (!inventoryMode) {
    const totals = calculateVoucherTotals(voucher, taxRates, false)
    if (totals.debit !== totals.credit) return `Voucher is not balanced. Debit ${totals.debit} and credit ${totals.credit} must match.`
  }
  if (voucher.type === 'contra' && voucher.lines.some((line) => { const ledger = ledgers.find((item) => item.id === line.ledgerId); return ledger && !['cash', 'bank'].includes(ledger.category) })) return 'Contra vouchers allow only cash and bank ledgers.'
  if (voucher.type === 'receipt' && voucher.lines.some((line) => { const ledger = ledgers.find((item) => item.id === line.ledgerId); return ledger && ['purchase', 'expense'].includes(ledger.category) })) return 'Receipt vouchers cannot post directly to purchase or expense ledgers.'
  if (voucher.type === 'payment' && voucher.lines.some((line) => { const ledger = ledgers.find((item) => item.id === line.ledgerId); return ledger && ['sales', 'income'].includes(ledger.category) })) return 'Payment vouchers cannot post directly to sales or income ledgers.'
  return null
}

export function buildLedgerPostingLines(vouchers: BillingVoucher[], ledgers: BillingLedger[], taxRates: BillingTaxRate[]) {
  const postingLines: BillingLedgerPostingLine[] = []
  vouchers.filter((voucher) => voucher.status === 'posted').forEach((voucher) => {
    if (voucher.type === 'sales' || voucher.type === 'purchase') {
      const total = calculateVoucherTotals(voucher, taxRates, true)
      const revenueLedgerId = voucher.lines[0]?.ledgerId ?? ''
      const controlLedgerId = voucher.counterpartyLedgerId
      const taxLedgerId = ledgers.find((item) => item.category === 'tax')?.id ?? ''
      if (controlLedgerId) postingLines.push({ voucherId: voucher.id, voucherType: voucher.type, voucherNumber: voucher.voucherNumber, postingDate: voucher.postingDate, ledgerId: controlLedgerId, debit: voucher.type === 'sales' ? total.total : 0, credit: voucher.type === 'purchase' ? total.total : 0, narration: voucher.narration })
      if (revenueLedgerId) postingLines.push({ voucherId: voucher.id, voucherType: voucher.type, voucherNumber: voucher.voucherNumber, postingDate: voucher.postingDate, ledgerId: revenueLedgerId, debit: voucher.type === 'purchase' ? total.taxableValue : 0, credit: voucher.type === 'sales' ? total.taxableValue : 0, narration: voucher.narration })
      if (taxLedgerId && total.gstAmount > 0) postingLines.push({ voucherId: voucher.id, voucherType: voucher.type, voucherNumber: voucher.voucherNumber, postingDate: voucher.postingDate, ledgerId: taxLedgerId, debit: voucher.type === 'purchase' ? total.gstAmount : 0, credit: voucher.type === 'sales' ? total.gstAmount : 0, narration: voucher.narration })
      return
    }
    voucher.lines.forEach((line) => postingLines.push({ voucherId: voucher.id, voucherType: voucher.type, voucherNumber: voucher.voucherNumber, postingDate: voucher.postingDate, ledgerId: line.ledgerId, debit: line.debit, credit: line.credit, narration: line.description || voucher.narration }))
  })
  return postingLines
}

export function summarizeLedgerBalances(lines: BillingLedgerPostingLine[]) {
  const summary = new Map<string, { debit: number; credit: number }>()
  lines.forEach((line) => {
    const current = summary.get(line.ledgerId) ?? { debit: 0, credit: 0 }
    summary.set(line.ledgerId, { debit: roundCurrency(current.debit + line.debit), credit: roundCurrency(current.credit + line.credit) })
  })
  return summary
}
