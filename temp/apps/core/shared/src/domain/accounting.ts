export interface LedgerLine {
  ledgerId: string
  debit: number
  credit: number
}

export interface VoucherWrite {
  voucherType: string
  voucherNumber: string
  postingDate: string
  effectiveDate: string
  createdAt: string
  lines: LedgerLine[]
}

export interface InvariantResult {
  ok: boolean
  reason?: string
}

export function validateBalancedVoucher(voucher: VoucherWrite): InvariantResult {
  const totalDebit = voucher.lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = voucher.lines.reduce((sum, line) => sum + line.credit, 0)

  if (voucher.lines.length < 2) {
    return {
      ok: false,
      reason: 'Voucher must contain at least two ledger lines.',
    }
  }

  if (totalDebit !== totalCredit) {
    return {
      ok: false,
      reason: `Voucher is unbalanced. Debit ${totalDebit} != credit ${totalCredit}.`,
    }
  }

  return { ok: true }
}
