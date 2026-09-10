import { useState, type KeyboardEvent } from 'react'
import {
  Archive,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  LoaderCircle,
  Pencil,
  Pin,
  PinOff,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { useProjectTasks } from './project-tasks.controller'
import type { ZetroTask } from './project-tasks.types'

export function ProjectTaskList() {
  const tasks = useProjectTasks()

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div aria-label="Project task list" className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1">
        {tasks.isLoading ? (
          <div className="grid h-10 place-items-center">
            <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {!tasks.isLoading && tasks.tasks.length === 0 ? (
          <p className="px-1.5 py-2 text-sm text-muted-foreground">No tasks yet.</p>
        ) : null}
        <div className="space-y-0.5">
          {tasks.tasks.map((task) => (
            <TaskTitle key={task.id} task={task} />
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t p-2">
        <Button
          className="mb-1 h-8 w-full cursor-pointer justify-start bg-black text-white hover:bg-black/90 hover:text-white"
          onClick={tasks.openCreateTask}
        >
          <Plus /> New task
        </Button>
        <Button
          className="h-8 w-full cursor-pointer justify-start"
          onClick={() => void tasks.openArchive()}
          variant="ghost"
        >
          <Archive /> Archived tasks
        </Button>
      </div>
    </div>
  )
}

function TaskTitle({ task }: { task: ZetroTask }) {
  const tasks = useProjectTasks()
  const [draft, setDraft] = useState(task.title)
  const [renaming, setRenaming] = useState(false)
  const StatusIcon =
    task.status === 'done' ? CheckCircle2 : task.status === 'in_progress' ? CircleDot : Circle

  function finishRename() {
    const title = draft.trim()
    if (title && title !== task.title) void tasks.renameTask(task.id, title)
    if (!title) setDraft(task.title)
    setRenaming(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') finishRename()
    if (event.key === 'Escape') {
      setDraft(task.title)
      setRenaming(false)
    }
  }

  return (
    <div
      aria-current={tasks.activeTask?.id === task.id ? 'page' : undefined}
      className="group/row flex min-h-8 items-center gap-1 rounded-md px-1 aria-[current=page]:bg-sidebar-accent"
    >
      {renaming ? (
        <>
          <Input
            aria-label={`Rename ${task.title}`}
            autoFocus
            className="h-7 min-w-0 flex-1"
            maxLength={160}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            value={draft}
          />
          <Button aria-label="Save title" onClick={finishRename} size="icon-xs" variant="ghost">
            <Check />
          </Button>
          <Button
            aria-label="Cancel rename"
            onClick={() => {
              setDraft(task.title)
              setRenaming(false)
            }}
            size="icon-xs"
            variant="ghost"
          >
            <X />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 text-left text-sm"
            onClick={() => tasks.selectTask(task.id)}
            title={task.title}
            type="button"
          >
            <StatusIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span
              className={task.status === 'done' ? 'truncate line-through opacity-60' : 'truncate'}
            >
              {task.title}
            </span>
          </Button>
          <div className="flex shrink-0 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100">
            <Button
              aria-label={`Archive ${task.title}`}
              onClick={() => void tasks.archiveTask(task)}
              size="icon-xs"
              title={`Archive ${task.title}`}
              variant="ghost"
            >
              <Archive />
            </Button>
            <Button
              aria-label={`Rename ${task.title}`}
              onClick={() => setRenaming(true)}
              size="icon-xs"
              title={`Rename ${task.title}`}
              variant="ghost"
            >
              <Pencil />
            </Button>
            <Button
              aria-label={`${task.pinned ? 'Unpin' : 'Pin'} ${task.title}`}
              onClick={() => void tasks.togglePin(task)}
              size="icon-xs"
              title={`${task.pinned ? 'Unpin' : 'Pin'} ${task.title}`}
              variant="ghost"
            >
              {task.pinned ? <PinOff /> : <Pin />}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
