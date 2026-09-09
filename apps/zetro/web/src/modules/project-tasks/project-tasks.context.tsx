import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useProjects } from '../projects'
import { TaskContext } from './project-tasks.controller'
import { createTask, listTasks, updateTask } from './project-tasks.services'
import type { TaskPriority, TaskStatus, TaskUpdate, ZetroTask } from './project-tasks.types'

export function ProjectTasksProvider({ children }: { children: ReactNode }) {
  const { activeProject } = useProjects()
  const activeProjectIdRef = useRef<string | null>(null)
  const [archivedTasks, setArchivedTasks] = useState<ZetroTask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<ZetroTask[]>([])
  const [view, setView] = useState<'archive' | 'tasks'>('tasks')

  useEffect(() => {
    activeProjectIdRef.current = activeProject?.id ?? null
    if (!activeProject) return
    let current = true
    setArchivedTasks([])
    setIsCreating(false)
    setIsLoading(true)
    setSelectedTaskId(null)
    setTasks([])
    setView('tasks')
    void listTasks(activeProject.id)
      .then((loaded) => {
        if (!current) return
        setTasks(sortTasks(loaded))
        setSelectedTaskId(loaded[0]?.id ?? null)
      })
      .catch((reason: unknown) => {
        if (current) setError(toMessage(reason))
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [activeProject])

  const activeTask = useMemo(
    () => tasks.find(({ id }) => id === selectedTaskId) ?? tasks[0] ?? null,
    [selectedTaskId, tasks],
  )
  const childTasks = useMemo(
    () => tasks.filter((task) => task.parentTaskId === activeTask?.id),
    [activeTask?.id, tasks],
  )

  async function addTask(input: { description: string; priority: TaskPriority; title: string }) {
    if (!activeProject) throw new Error('Select a project before creating a task.')
    const projectId = activeProject.id
    try {
      const task = await createTask({ ...input, projectId })
      if (activeProjectIdRef.current === projectId) {
        setTasks((current) => [task, ...current])
        setSelectedTaskId(task.id)
        setIsCreating(false)
        setView('tasks')
      }
      setError(null)
      return task
    } catch (reason) {
      setError(toMessage(reason))
      throw reason
    }
  }

  async function changeStatus(taskId: string, status: TaskStatus) {
    await changeTask(taskId, { status })
  }

  async function bindReviewWorkflow(taskId: string) {
    await changeTask(taskId, { workflow: 'review' })
  }

  async function splitTask(task: ZetroTask, kind: 'phase' | 'subtask') {
    if (!activeProject) return
    if (
      tasks.some(
        (candidate) => candidate.parentTaskId === task.id && candidate.planningKind === kind,
      )
    ) {
      setError(`This task already has ${kind === 'phase' ? 'phases' : 'subtasks'}.`)
      return
    }

    const plannedTasks = createPlannedTasks(task, kind)
    try {
      const created = await Promise.all(
        plannedTasks.map((planned) =>
          createTask({
            ...planned,
            parentTaskId: task.id,
            planningKind: kind,
            projectId: activeProject.id,
          }),
        ),
      )
      if (activeProjectIdRef.current === activeProject.id) {
        setTasks((current) => sortTasks([...created, ...current]))
      }
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  async function changeTask(taskId: string, update: TaskUpdate) {
    if (!activeProject) return
    const projectId = activeProject.id
    try {
      const task = await updateTask(projectId, taskId, update)
      if (activeProjectIdRef.current === projectId) {
        setTasks((current) =>
          sortTasks(current.map((candidate) => (candidate.id === task.id ? task : candidate))),
        )
      }
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  async function archiveTask(task: ZetroTask) {
    if (!activeProject) return
    try {
      const archived = await updateTask(activeProject.id, task.id, { archived: true })
      const remaining = tasks.filter(({ id }) => id !== task.id)
      setTasks(remaining)
      setArchivedTasks((current) => sortTasks([archived, ...current]))
      if (selectedTaskId === task.id) setSelectedTaskId(remaining[0]?.id ?? null)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  async function restoreTask(task: ZetroTask) {
    if (!activeProject) return
    try {
      const restored = await updateTask(activeProject.id, task.id, { archived: false })
      setArchivedTasks((current) => current.filter(({ id }) => id !== task.id))
      setTasks((current) => sortTasks([restored, ...current]))
      setSelectedTaskId(restored.id)
      setView('tasks')
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }

  async function openArchive() {
    if (!activeProject) return
    setIsCreating(false)
    setView('archive')
    setIsLoadingArchive(true)
    try {
      setArchivedTasks(sortTasks(await listTasks(activeProject.id, true)))
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    } finally {
      setIsLoadingArchive(false)
    }
  }

  return (
    <TaskContext.Provider
      value={{
        activeTask,
        addTask,
        archiveTask,
        archivedTasks,
        bindReviewWorkflow,
        childTasks,
        closeCreateTask: () => setIsCreating(false),
        changeStatus,
        error,
        isCreating,
        isLoadingArchive,
        isLoading,
        openArchive,
        openCreateTask: () => {
          setView('tasks')
          setIsCreating(true)
        },
        renameTask: (taskId, title) => changeTask(taskId, { title: title.trim() }),
        restoreTask,
        selectTask: (taskId) => {
          setSelectedTaskId(taskId)
          setIsCreating(false)
          setView('tasks')
        },
        splitTask,
        tasks,
        togglePin: (task) => changeTask(task.id, { pinned: !task.pinned }),
        view,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

function createPlannedTasks(task: ZetroTask, kind: 'phase' | 'subtask') {
  const context = task.description ? `\n\nParent task context: ${task.description}` : ''
  const plans =
    kind === 'phase'
      ? [
          ['Plan', 'Define scope, constraints, acceptance criteria, and validation.'],
          ['Implement', 'Make the smallest complete change within the task scope.'],
          ['Verify', 'Run the relevant checks and record the evidence.'],
        ]
      : [
          ['Clarify scope', 'Identify the concrete outcome and any missing decision.'],
          ['Implement change', 'Complete the requested behavior in the owning module.'],
          ['Confirm result', 'Verify the result against the acceptance criteria.'],
        ]
  return plans.map(([prefix, description]) => ({
    description: `${description}${context}`,
    priority: task.priority,
    title: `${prefix}: ${task.title}`,
  }))
}

function toMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Zetro could not load project tasks.'
}

function sortTasks(tasks: ZetroTask[]) {
  return [...tasks].sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
    return right.updatedAt.localeCompare(left.updatedAt)
  })
}
