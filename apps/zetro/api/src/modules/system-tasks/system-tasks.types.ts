export type SystemTaskStatus =
  'blocked' | 'completed' | 'failed' | 'pending' | 'running' | 'stopped' | 'stopping'

export interface SystemTaskRecord {
  attempts: number
  completedAt: string | null
  createdAt: string
  error: string | null
  id: string
  input: unknown
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

export interface SystemTaskDetail extends SystemTaskRecord {
  steps: SystemTaskStep[]
}

export interface SystemTaskContext {
  readonly signal: AbortSignal
  step(status: SystemTaskStep['status'], message: string): Promise<void>
}

export type SystemTaskHandler = (input: unknown, context: SystemTaskContext) => Promise<unknown>
