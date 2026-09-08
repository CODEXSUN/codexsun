export type TaskPriority = 'high' | 'low' | 'medium'
export type TaskStatus = 'done' | 'in_progress' | 'todo'

export type ZetroTask = {
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

export type TaskUpdate = {
  archived?: boolean
  pinned?: boolean
  priority?: TaskPriority
  status?: TaskStatus
  title?: string
}
