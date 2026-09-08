import { useCallback, useEffect, useState } from 'react'
import { createTask, listTasks, updateTaskStatus } from './tasks.services'
import type { CreateTaskInput, TaskStatus, ZetroTask } from './tasks.types'

export function useTasks() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<ZetroTask[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setTasks(await listTasks())
    } catch (reason) {
      setError(toErrorMessage(reason))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addTask = useCallback(async (input: CreateTaskInput) => {
    setError(null)
    try {
      const task = await createTask(input)
      setTasks((current) => [task, ...current])
      return task
    } catch (reason) {
      setError(toErrorMessage(reason))
      return null
    }
  }, [])

  const changeStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    setError(null)
    try {
      const task = await updateTaskStatus(taskId, status)
      setTasks((current) =>
        current.map((candidate) => (candidate.id === task.id ? task : candidate)),
      )
    } catch (reason) {
      setError(toErrorMessage(reason))
    }
  }, [])

  return { addTask, changeStatus, error, isLoading, refresh, tasks }
}

function toErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Zetro could not update tasks.'
}
