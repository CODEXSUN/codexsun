import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BadgeIndianRupee,
  Boxes,
  Building2,
  Contact2,
  CreditCard,
  LayoutDashboard,
  PackageCheck,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import {
  accentOptions,
  modeOptions,
  type AccentTheme,
  type ColorMode,
} from '@framework-core/web/theme/theme-contract'

export { accentOptions, modeOptions }
export type { AccentTheme, ColorMode }

export const publicNavigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Dashboard', href: '/admin/dashboard' },
]

export interface SidebarGroup {
  title: string
  items: {
    title: string
    href: string
    icon: LucideIcon
    badge?: string
  }[]
}

export const dashboardSidebar: SidebarGroup[] = [
  {
    title: 'Operate',
    items: [
      { title: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { title: 'Orders', href: '/admin/dashboard/orders', icon: ReceiptText, badge: '24' },
      { title: 'Inventory', href: '/admin/dashboard/inventory', icon: Boxes },
      { title: 'Logistics', href: '/admin/dashboard/logistics', icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Billing', href: '/admin/dashboard/billing', icon: CreditCard },
      { title: 'Cash Flow', href: '/admin/dashboard/cash-flow', icon: BadgeIndianRupee },
      { title: 'Compliance', href: '/admin/dashboard/compliance', icon: ShieldCheck },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Workspace', href: '/admin/dashboard/workspace', icon: Building2 },
      { title: 'Teams', href: '/admin/dashboard/teams', icon: Users },
      { title: 'Settings', href: '/admin/dashboard/settings', icon: Settings2 },
    ],
  },
]

export const dashboardStats = [
  { label: 'Open orders', value: '124', delta: '+18% this week' },
  { label: 'Ready to dispatch', value: '39', delta: '8 high priority' },
  { label: 'Receivables due', value: 'Rs. 8.4L', delta: '12 invoices this week' },
  { label: 'Stock alerts', value: '07', delta: '2 severe shortages' },
]

export const workspaceSignals = [
  {
    title: 'Cash and collections',
    summary: 'Collections are on plan, but two enterprise accounts need follow-up before month end.',
    icon: Activity,
  },
  {
    title: 'Catalog health',
    summary: 'Three fast-moving SKUs have less than six days of cover across western warehouses.',
    icon: PackageCheck,
  },
  {
    title: 'CRM handoff',
    summary: 'New distributor leads need qualification rules before they move into quotes and invoicing.',
    icon: Contact2,
  },
]

