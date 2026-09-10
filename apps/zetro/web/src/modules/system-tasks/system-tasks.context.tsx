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
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const activeProject = useRef(projectId)
  activeProject.current = projectId
  const selectionRequest = useRef(0)
  const pendingRefresh = useRef(new Set<string>())
  const [selected, setSelected] = useState<SystemTaskDetail | null>(null)
  const [tasks, setTasks] = useState<SystemTask[]>([])
  const previous = useRef(new Map<string, SystemTask['status']>())
  const selectedId = useRef<string | null>(null)
  const notificationsEnabled = useDeveloperTools().effective?.desktopNotifications ?? false

  const refresh = useCallback(async () => {
    if (!projectId || pendingRefresh.current.has(projectId)) return
    pendingRefresh.current.add(projectId)
    try {
      const next = await listSystemTasks(projectId)
      if (activeProject.current !== projectId) return
      if (notificationsEnabled) notifyCompleted(previous.current, next)
      previous.current = new Map(next.map((task) => [task.id, task.status]))
      setTasks(next)
      setError(null)
      setLastUpdated(Date.now())
      const id = selectedId.current
      if (id) {
        const detail = await getSystemTask(id)
        if (activeProject.current === projectId && selectedId.current === id) setSelected(detail)
      }
    } catch (reason) {
      if (activeProject.current === projectId) setError(toMessage(reason))
    } finally {
      pendingRefresh.current.delete(projectId)
      if (activeProject.current === projectId) setLoading(false)
    }
  }, [notificationsEnabled, projectId])

  useEffect(() => {
    selectedId.current = null
    selectionRequest.current += 1
    setSelected(null)
    setTasks([])
    setError(null)
    setLastUpdated(null)
    setLoading(Boolean(projectId))
    previous.current.clear()
  }, [projectId])

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
      loading,
      lastUpdated,
      clearSelection: () => {
        selectedId.current = null
        selectionRequest.current += 1
        setSelected(null)
      },
      refresh,
      selected,
      tasks,
      retry: async (taskId: string) => {
        await retrySystemTask(taskId)
        await refresh()
      },
      select: async (taskId: string) => {
        const request = ++selectionRequest.current
        selectedId.current = taskId
        setSelected(null)
        try {
          const detail = await getSystemTask(taskId)
          if (request === selectionRequest.current && activeProject.current === projectId) {
            setSelected(detail)
            setError(null)
          }
        } catch (reason) {
          if (request === selectionRequest.current) setError(toMessage(reason))
        }
      },
      stop: async (taskId: string) => {
        await stopSystemTask(taskId)
        await refresh()
      },
    }),
    [error, loading, lastUpdated, projectId, refresh, selected, tasks],
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
