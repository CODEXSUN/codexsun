export interface OperationsSettings {
  autoSweepWorktrees: boolean
  metricRetentionDays: number
  worktreeRetentionDays: number
}

export interface ConnectedAppMetric {
  appId: string
  component: string
  labels: Record<string, string>
  observedAt: string
  receivedAt: string
  status: 'degraded' | 'offline' | 'online'
  values: Record<string, number>
}
