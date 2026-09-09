import { createContext, useContext } from 'react'
import type { SystemTask, SystemTaskDetail } from './system-tasks.types'

export interface SystemTasksController {
  error: string | null
  selected: SystemTaskDetail | null
  tasks: SystemTask[]
  refresh(): Promise<void>
  retry(taskId: string): Promise<void>
  select(taskId: string): Promise<void>
  stop(taskId: string): Promise<void>
}

export const SystemTasksContext = createContext<SystemTasksController | null>(null)

export function useSystemTasks(): SystemTasksController {
  const value = useContext(SystemTasksContext)
  if (!value) throw new Error('SystemTasksProvider is required.')
  return value
}
