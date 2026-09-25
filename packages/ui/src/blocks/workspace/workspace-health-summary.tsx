import type { LucideIcon } from 'lucide-react'

import { WorkspaceMetricCard, type WorkspaceMetricTone } from './workspace-metric-card'

export type WorkspaceHealthSummaryProps = {
  description?: string
  icon?: LucideIcon
  label: string
  tone?: WorkspaceMetricTone
  value: string
}

export function WorkspaceHealthSummary({ description, icon, label, tone = 'neutral', value }: WorkspaceHealthSummaryProps) {
  return <WorkspaceMetricCard description={description} icon={icon} label={label} size="compact" tone={tone} value={value} />
}
