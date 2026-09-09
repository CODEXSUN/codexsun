export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'
export type TaskPlanningKind = 'phase' | 'subtask' | 'task'
export type TaskWorkflow = 'review' | null

export type ZetroTask = {
  archived: boolean
  createdAt: string
  description: string
  id: string
  priority: TaskPriority
  projectId: string
  pinned: boolean
  parentTaskId: string | null
  planningKind: TaskPlanningKind
  status: TaskStatus
  title: string
  updatedAt: string
  workflow: TaskWorkflow
}

export type TaskUpdate = {
  archived?: boolean
  pinned?: boolean
  priority?: TaskPriority
  status?: TaskStatus
  title?: string
  workflow?: TaskWorkflow
}
