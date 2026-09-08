import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { InterfaceTopologySection } from '../../features/interface-topology'

export type MdiFeatures = {
  appSwitcher: boolean
  notifications: boolean
  profileMenu: boolean
  statusBar: boolean
  topMenu: boolean
}

export type MdiFeatureKey = keyof MdiFeatures

export type MdiAppItem = {
  active?: boolean
  href?: string
  icon: LucideIcon
  label: string
  onSelect?: () => void
}

export type MdiNavigationItem = {
  active?: boolean
  badge?: string | number
  href?: string
  icon?: LucideIcon
  label: string
  onSelect?: () => void
}

export type MdiNavigationSection = {
  defaultOpen?: boolean
  items: MdiNavigationItem[]
  label?: string
}

export type MdiPrimaryAction = {
  label: string
  onSelect?: () => void
}

export type MdiUser = {
  email?: string
  initials: string
  name: string
  onManageProfile?: () => void
  onSignOut?: () => void
}

export type MdiMainProps = {
  applicationIcon?: LucideIcon
  applicationId?: string
  applicationName?: string
  apps?: MdiAppItem[]
  children?: ReactNode
  defaultFeatures?: Partial<MdiFeatures>
  navigation?: MdiNavigationSection[]
  notificationCount?: number
  organizationName?: string
  primaryAction?: MdiPrimaryAction | null
  searchPlaceholder?: string
  searchValue?: string
  showAppearancePanel?: boolean
  sidebarContentClassName?: string
  statusLabel?: string
  topologySections?: readonly InterfaceTopologySection[]
  user?: MdiUser
  workspaceTitle?: string
  onSearchChange?: (value: string) => void
}

export const defaultMdiFeatures: MdiFeatures = {
  appSwitcher: true,
  notifications: true,
  profileMenu: true,
  statusBar: true,
  topMenu: true,
}
