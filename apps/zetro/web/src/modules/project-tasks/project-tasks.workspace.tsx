import { useState, type FormEvent } from 'react'
import { CheckCircle2, Circle, CircleDot, LoaderCircle } from 'lucide-react'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { NativeSelect } from '@codexsun/ui/components/native-select'
import { Textarea } from '@codexsun/ui/components/textarea'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { ProjectTaskArchive } from './project-tasks.archive'
import { useProjectTasks } from './project-tasks.controller'
import { TaskPlanningActions } from './project-tasks.planning'
import type { TaskPriority, TaskStatus, ZetroTask } from './project-tasks.types'

const nextStatus: Record<TaskStatus, TaskStatus> = {
  done: 'todo',
  in_progress: 'done',
  todo: 'in_progress',
}

export function ProjectTasksWorkspace() {
  const tasks = useProjectTasks()
  const topology = useMdiTopology()

  if (tasks.view === 'archive') return <ProjectTaskArchive />

  return (
    <TopologyRegion
      aria-label="Project tasks"
      as="section"
      className="size-full overflow-y-auto bg-background"
      id="15.1.4"
      topology={topology}
    >
      <div className="mx-auto flex w-4/5 min-w-0 max-w-5xl flex-col py-6">
        {tasks.isCreating ? <TaskCreateForm close={tasks.closeCreateTask} /> : null}
        {!tasks.isCreating && tasks.isLoading ? (
          <LoaderCircle className="mx-auto my-12 size-5 animate-spin text-muted-foreground" />
        ) : null}
        {!tasks.isCreating && !tasks.isLoading && tasks.activeTask ? (
          <TaskDetails task={tasks.activeTask} />
        ) : null}
        {!tasks.isCreating && !tasks.isLoading && !tasks.activeTask ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Select a task or create a new one.
          </p>
        ) : null}
        {tasks.error ? (
          <p className="border-t py-3 text-sm text-destructive" role="alert">
            {tasks.error}
          </p>
        ) : null}
      </div>
    </TopologyRegion>
  )
}

function TaskCreateForm({ close }: { close(): void }) {
  const tasks = useProjectTasks()
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [title, setTitle] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await tasks.addTask({ description: description.trim(), priority, title: title.trim() })
      close()
    } catch {
      return
    }
  }

  return (
    <form className="grid gap-3 border-b py-5" onSubmit={(event) => void submit(event)}>
      <Input
        autoFocus
        maxLength={160}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task title"
        value={title}
      />
      <Textarea
        maxLength={2000}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        value={description}
      />
      <div className="flex items-center justify-between gap-3">
        <NativeSelect
          aria-label="Priority"
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          value={priority}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </NativeSelect>
        <div className="flex gap-2">
          <Button className="cursor-pointer" onClick={close} type="button" variant="ghost">
            Cancel
          </Button>
          <Button className="cursor-pointer" disabled={!title.trim()} type="submit">
            Create task
          </Button>
        </div>
      </div>
    </form>
  )
}

function TaskDetails({ task }: { task: ZetroTask }) {
  const tasks = useProjectTasks()
  const StatusIcon =
    task.status === 'done' ? CheckCircle2 : task.status === 'in_progress' ? CircleDot : Circle

  return (
    <article className="flex flex-col">
      <header className="flex items-start justify-between gap-4 border-b py-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StatusIcon className="size-4" />
            <span>{statusLabel(task.status)}</span>
          </div>
          <h1 className="pt-2 text-2xl font-semibold tracking-tight">{task.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TaskPlanningActions task={task} />
          <Badge className="ml-2" variant="outline">
            {task.priority} priority
          </Badge>
        </div>
      </header>

      <section className="border-b py-6">
        <h2 className="text-sm font-medium">Description</h2>
        <p className="max-w-3xl pt-2 text-sm leading-6 text-muted-foreground">
          {task.description || 'No description was added.'}
        </p>
      </section>

      <dl className="grid grid-cols-1 gap-5 border-b py-6 text-sm sm:grid-cols-3">
        <TaskField label="Status" value={statusLabel(task.status)} />
        <TaskField label="Created" value={formatDate(task.createdAt)} />
        <TaskField label="Updated" value={formatDate(task.updatedAt)} />
      </dl>

      <div className="flex justify-end py-5">
        <Button
          className="cursor-pointer"
          onClick={() => void tasks.changeStatus(task.id, nextStatus[task.status])}
          variant="outline"
        >
          {nextActionLabel(task.status)}
        </Button>
      </div>
    </article>
  )
}

function TaskField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="pt-1 font-medium">{value}</dd>
    </div>
  )
}

function statusLabel(status: TaskStatus) {
  if (status === 'in_progress') return 'In progress'
  if (status === 'done') return 'Done'
  return 'Waiting to start'
}

function nextActionLabel(status: TaskStatus) {
  if (status === 'in_progress') return 'Complete task'
  if (status === 'done') return 'Reopen task'
  return 'Start task'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
