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
  icon?: LucideIcon
  label: string
  onSelect?: () => void
}

export type MdiNotification = {
  description?: string
  id: string
  read?: boolean
  time?: string
  title: string
  onSelect?: () => void
}

export type MdiUser = {
  avatarUrl?: string
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
  deskRegionId?: string
  navigation?: MdiNavigationSection[]
  notificationCount?: number
  notifications?: readonly MdiNotification[]
  primaryAction?: MdiPrimaryAction | null
  searchPlaceholder?: string
  searchValue?: string
  showAppearancePanel?: boolean
  showMdiOverview?: boolean
  sidebarContent?: ReactNode
  sidebarContentClassName?: string
  sidebarFooter?: ReactNode | null
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
