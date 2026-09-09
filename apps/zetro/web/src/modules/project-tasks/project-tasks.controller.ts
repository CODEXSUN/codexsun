import { createContext, useContext } from 'react'
import type { TaskPlanningKind, TaskPriority, TaskStatus, ZetroTask } from './project-tasks.types'

export type TaskController = {
  activeTask: ZetroTask | null
  archivedTasks: ZetroTask[]
  childTasks: ZetroTask[]
  error: string | null
  isCreating: boolean
  isLoadingArchive: boolean
  isLoading: boolean
  tasks: ZetroTask[]
  view: 'archive' | 'tasks'
  addTask(input: { description: string; priority: TaskPriority; title: string }): Promise<ZetroTask>
  archiveTask(task: ZetroTask): Promise<void>
  bindReviewWorkflow(taskId: string): Promise<void>
  closeCreateTask(): void
  changeStatus(taskId: string, status: TaskStatus): Promise<void>
  openArchive(): Promise<void>
  openCreateTask(): void
  renameTask(taskId: string, title: string): Promise<void>
  restoreTask(task: ZetroTask): Promise<void>
  selectTask(taskId: string): void
  splitTask(task: ZetroTask, kind: Exclude<TaskPlanningKind, 'task'>): Promise<void>
  togglePin(task: ZetroTask): Promise<void>
}

export const TaskContext = createContext<TaskController | null>(null)

export function useProjectTasks() {
  const controller = useContext(TaskContext)
  if (!controller) throw new Error('useProjectTasks must be used inside ProjectTasksProvider.')
  return controller
}
