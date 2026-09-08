export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'

export interface ZetroTask {
  createdAt: string
  description: string
  id: string
  priority: TaskPriority
  status: TaskStatus
  title: string
  updatedAt: string
}

export interface CreateTaskInput {
  description: string
  priority: TaskPriority
  title: string
}

export interface UpdateTaskInput {
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  title?: string
}
