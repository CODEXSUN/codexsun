export interface OperationsSettings {
  autoSweepWorktrees: boolean
  metricRetentionDays: number
  worktreeRetentionDays: number
}

export interface WorktreeStatus {
  conversationId: string
  dirty: boolean
  modifiedAt: string
  path: string
  projectId: string | null
  sizeBytes: number
}

export interface OperationsMetrics {
  api: { heapBytes: number; residentBytes: number; uptimeSeconds: number }
  codex: string
  connectedApps: Array<{
    appId: string
    component: string
    observedAt: string
    status: string
    values: Record<string, number>
  }>
  database: 'mariadb' | 'sqlite'
  disk: { freeBytes: number; totalBytes: number }
  generatedAt: string
  host: {
    cpuCount: number
    freeMemoryBytes: number
    loadAverage: number[]
    totalMemoryBytes: number
  }
  systemTasks: Record<string, number>
  worktrees: { count: number; dirty: number; sizeBytes: number }
}
