export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'
export type TaskPlanningKind = 'phase' | 'subtask' | 'task'
export type TaskWorkflow = 'review' | null

export type TaskScope = {
  application: string
  documentationPaths?: string[]
  folderPath: string
  module: string
}

export type TaskExecutionPlan = {
  acceptanceCriteria: string[]
  checks: string[]
  scope: TaskScope
  sourceConversationId: string | null
}

export type TaskExecutionAttempt = { startedAt: string; systemTaskId: string }

export type ZetroTask = {
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

export type TaskUpdate = {
  archived?: boolean
  pinned?: boolean
  plan?: TaskExecutionPlan | null
  priority?: TaskPriority
  status?: TaskStatus
  title?: string
  workflow?: TaskWorkflow
}
