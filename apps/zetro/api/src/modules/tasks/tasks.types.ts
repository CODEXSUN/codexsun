export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'
export type TaskPlanningKind = 'phase' | 'subtask' | 'task'
export type TaskWorkflow = 'review' | null

export interface ZetroTask {
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

export interface CreateTaskInput {
  description: string
  priority: TaskPriority
  projectId: string
  parentTaskId?: string | null
  planningKind?: TaskPlanningKind
  title: string
}

export interface UpdateTaskInput {
  archived?: boolean
  description?: string
  priority?: TaskPriority
  pinned?: boolean
  workflow?: TaskWorkflow
  status?: TaskStatus
  title?: string
}
