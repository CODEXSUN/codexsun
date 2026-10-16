import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AgentWorkspaceRailItem = {
  active?: boolean | undefined
  badge?: number | string | undefined
  disabled?: boolean | undefined
  icon: LucideIcon
  id: string
  label: string
  onSelect?: (() => void) | undefined
}

export type AgentWorkspaceRail = {
  footerItems?: readonly AgentWorkspaceRailItem[] | undefined
  items: readonly AgentWorkspaceRailItem[]
  label: string
}

export type AgentWorkspaceProps = {
  canvasClassName?: string | undefined
  children?: ReactNode | undefined
  className?: string | undefined
  primaryRail: AgentWorkspaceRail
  secondaryRail: AgentWorkspaceRail
  showPrimaryRail?: boolean | undefined
  showSecondaryRail?: boolean | undefined
}
