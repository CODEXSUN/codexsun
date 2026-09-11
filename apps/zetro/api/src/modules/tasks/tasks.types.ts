export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'
export type TaskPlanningKind = 'phase' | 'subtask' | 'task'
export type TaskWorkflow = 'review' | null

export interface TaskScope {
  application: string
  documentationPaths?: readonly string[]
  folderPath: string
  module: string
}

export interface TaskExecutionPlan {
  acceptanceCriteria: readonly string[]
  checks: readonly string[]
  scope: TaskScope
  sourceConversationId: string | null
}

export interface TaskExecutionAttempt {
  startedAt: string
  systemTaskId: string
}

export interface ZetroTask {
  archived: boolean
  createdAt: string
  description: string
  executionAttempt: TaskExecutionAttempt | null
  id: string
  priority: TaskPriority
  projectId: string
  pinned: boolean
  parentTaskId: string | null
  planningKind: TaskPlanningKind
  plan: TaskExecutionPlan | null
  status: TaskStatus
  title: string
  updatedAt: string
  workflow: TaskWorkflow
}

export interface CreateTaskInput {
  description: string
  priority: TaskPriority
  projectId: string
  parentTaskId?: string | null
  planningKind?: TaskPlanningKind
  plan?: TaskExecutionPlan | null
  title: string
}

export interface UpdateTaskInput {
  archived?: boolean
  description?: string
  priority?: TaskPriority
  pinned?: boolean
  plan?: TaskExecutionPlan | null
  workflow?: TaskWorkflow
  status?: TaskStatus
  title?: string
}

export interface TaskExecutionRunner {
  start(input: { projectId: string; prompt: string; scope: TaskScope }): Promise<{ id: string }>
}
