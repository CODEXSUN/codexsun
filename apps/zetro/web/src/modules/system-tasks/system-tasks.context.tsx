import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SystemTasksContext } from './system-tasks.controller'
import {
  getSystemTask,
  listSystemTasks,
  retrySystemTask,
  stopSystemTask,
} from './system-tasks.services'
import type { SystemTask, SystemTaskDetail } from './system-tasks.types'
import { useDeveloperTools } from '../developer-tools'

export function SystemTasksProvider({
  children,
  projectId,
}: {
  children: ReactNode
  projectId: string | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SystemTaskDetail | null>(null)
  const [tasks, setTasks] = useState<SystemTask[]>([])
  const previous = useRef(new Map<string, SystemTask['status']>())
  const selectedId = useRef<string | null>(null)
  const notificationsEnabled = useDeveloperTools().effective?.desktopNotifications ?? false

  const refresh = useCallback(async () => {
    try {
      const next = await listSystemTasks(projectId)
      if (notificationsEnabled) notifyCompleted(previous.current, next)
      previous.current = new Map(next.map((task) => [task.id, task.status]))
      setTasks(next)
      setError(null)
      if (selectedId.current) setSelected(await getSystemTask(selectedId.current))
    } catch (reason) {
      setError(toMessage(reason))
    }
  }, [notificationsEnabled, projectId])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 2_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const value = useMemo(
    () => ({
      error,
      refresh,
      selected,
      tasks,
      retry: async (taskId: string) => {
        await retrySystemTask(taskId)
        await refresh()
      },
      select: async (taskId: string) => {
        selectedId.current = taskId
        setSelected(await getSystemTask(taskId))
      },
      stop: async (taskId: string) => {
        await stopSystemTask(taskId)
        await refresh()
      },
    }),
    [error, refresh, selected, tasks],
  )

  return <SystemTasksContext.Provider value={value}>{children}</SystemTasksContext.Provider>
}

function notifyCompleted(previous: Map<string, SystemTask['status']>, tasks: SystemTask[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  for (const task of tasks) {
    const oldStatus = previous.get(task.id)
    if (!oldStatus || oldStatus === task.status) continue
    if (['blocked', 'completed', 'failed'].includes(task.status)) {
      new Notification(`Zetro task ${task.status}`, { body: task.title })
    }
  }
}

function toMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'System tasks are unavailable.'
}
