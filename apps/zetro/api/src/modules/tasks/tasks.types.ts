export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'

export interface ZetroTask {
  archived: boolean
  createdAt: string
  description: string
  id: string
  priority: TaskPriority
  projectId: string
  pinned: boolean
  status: TaskStatus
  title: string
  updatedAt: string
}

export interface CreateTaskInput {
  description: string
  priority: TaskPriority
  projectId: string
  title: string
}

export interface UpdateTaskInput {
  archived?: boolean
  description?: string
  priority?: TaskPriority
  pinned?: boolean
  status?: TaskStatus
  title?: string
}
