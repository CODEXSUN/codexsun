import {
  Calculator,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react'

export type BillingNavGroupId = 'home' | 'accounts' | 'compliance'

export interface BillingNavItem {
  id: string
  label: string
  path: string
  icon: typeof LayoutDashboard
  group: BillingNavGroupId
  summary: string
}

const frameworkPrefix = '/admin/dashboard/billing'

export const BILLING_NAV_ITEMS: BillingNavItem[] = [
  {
    id: 'dashboard',
    label: 'Billing Desk',
    path: '/dashboard',
    icon: LayoutDashboard,
    group: 'home',
    summary: 'Accounts, GST, voucher entry, and billing operations in one desk.',
  },
  {
    id: 'ledger-groups',
    label: 'Ledger Groups',
    path: '/ledger-groups',
    icon: Landmark,
    group: 'accounts',
    summary: 'Primary account groups and child groups like a Tally-style master hierarchy.',
  },
  {
    id: 'ledgers',
    label: 'Ledgers',
    path: '/ledgers',
    icon: Landmark,
    group: 'accounts',
    summary: 'Ledger masters for customers, suppliers, bank, cash, and tax accounts.',
  },
  {
    id: 'voucher-groups',
    label: 'Voucher Groups',
    path: '/voucher-groups',
    icon: Calculator,
    group: 'accounts',
    summary: 'Tally-style voucher grouping scaffold for future posting controls.',
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    path: '/vouchers',
    icon: Calculator,
    group: 'accounts',
    summary: 'Cross-voucher scaffold for unified search, numbering, and audit review.',
  },
  {
    id: 'invoices',
    label: 'Sales Invoices',
    path: '/invoices',
    icon: ReceiptText,
    group: 'accounts',
    summary: 'GST-ready invoice list and compact item-row entry surface.',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    path: '/purchases',
    icon: Wallet,
    group: 'accounts',
    summary: 'Supplier purchase vouchers with item rows and tax breakup.',
  },
  {
    id: 'receipts',
    label: 'Receipts',
    path: '/receipts',
    icon: Wallet,
    group: 'accounts',
    summary: 'Customer collection entries with cash and bank posting.',
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/payments',
    icon: Wallet,
    group: 'accounts',
    summary: 'Supplier and expense payments posted from cash or bank.',
  },
  {
    id: 'journals',
    label: 'Journals',
    path: '/journals',
    icon: Calculator,
    group: 'accounts',
    summary: 'Balanced debit-credit journal adjustments and accrual entries.',
  },
  {
    id: 'contra',
    label: 'Contra',
    path: '/contra',
    icon: Calculator,
    group: 'accounts',
    summary: 'Cash-to-bank and bank-to-bank transfer vouchers.',
  },
  {
    id: 'gst',
    label: 'GST Center',
    path: '/gst',
    icon: ShieldCheck,
    group: 'compliance',
    summary: 'Rates, compliance checkpoints, and filing-oriented tax totals.',
  },
]

export const BILLING_NAV_GROUPS: Array<{ id: BillingNavGroupId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'compliance', label: 'Compliance' },
]

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

export function resolveBillingNavPath(path: string, mode: 'standalone' | 'framework') {
  const normalized = normalizePath(path)

  if (mode === 'framework') {
    return normalized === '/dashboard'
      ? frameworkPrefix
      : `${frameworkPrefix}${normalized}`
  }

  return normalized
}

export function getBillingNavMatch(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isFramework = normalizedPath === frameworkPrefix || normalizedPath.startsWith(`${frameworkPrefix}/`)
  const mode: 'standalone' | 'framework' = isFramework ? 'framework' : 'standalone'

  const matches = BILLING_NAV_ITEMS.map((item) => {
    const resolved = resolveBillingNavPath(item.path, mode)
    const isMatch = normalizedPath === resolved || normalizedPath.startsWith(`${resolved}/`)
    return isMatch ? { item, resolved } : null
  }).filter((entry) => entry !== null)

  if (matches.length === 0) {
    return null
  }

  matches.sort((a, b) => b.resolved.length - a.resolved.length)
  return matches[0].item
}

export function getBillingPageTitle(pathname: string) {
  return getBillingNavMatch(pathname)?.label ?? 'Dashboard'
}
