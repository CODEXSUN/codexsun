import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AgentWorkspaceRailItem = {
  active?: boolean
  badge?: number | string
  disabled?: boolean
  icon: LucideIcon
  id: string
  label: string
  onSelect?: () => void
}

export type AgentWorkspaceRail = {
  footerItems?: readonly AgentWorkspaceRailItem[]
  items: readonly AgentWorkspaceRailItem[]
  label: string
}

export type AgentWorkspaceProps = {
  canvasClassName?: string
  children?: ReactNode
  className?: string
  primaryRail: AgentWorkspaceRail
  secondaryRail: AgentWorkspaceRail
  showPrimaryRail?: boolean
  showSecondaryRail?: boolean
}
