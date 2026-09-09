export type SystemTaskStatus =
  'blocked' | 'completed' | 'failed' | 'pending' | 'running' | 'stopped' | 'stopping'

export interface SystemTask {
  attempts: number
  completedAt: string | null
  createdAt: string
  error: string | null
  id: string
  maxAttempts: number
  projectId: string | null
  recoveryCount: number
  result: unknown
  startedAt: string | null
  status: SystemTaskStatus
  title: string
  type: string
  updatedAt: string
}

export interface SystemTaskStep {
  completedAt: string
  id: string
  message: string
  status: 'completed' | 'failed' | 'info' | 'skipped'
  taskId: string
}

export interface SystemTaskDetail extends SystemTask {
  steps: SystemTaskStep[]
}
