import { Button } from '@codexsun/ui/components/button'
import { ClipboardList } from 'lucide-react'
import type { AgentTaskSummary } from '@codexsun/zetro-contracts'

export function AgentTaskRegistry({
  busy,
  query,
  selectedId,
  tasks,
  onSelect,
}: {
  busy: boolean
  query: string
  selectedId?: string
  tasks: AgentTaskSummary[]
  onSelect: (taskId: string) => void
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = tasks.filter(
    ({ title }) => !normalizedQuery || title.toLocaleLowerCase().includes(normalizedQuery),
  )
  return (
    <div className="flex min-h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium">
        <span>Task queue</span>
        <span className="text-xs font-normal text-muted-foreground">
          {visible.length} awaiting approval
        </span>
      </div>
      <div aria-label="Task queue" className="grid gap-1">
        {visible.map((task) => (
          <Button
            className="h-auto min-w-0 justify-start gap-2 px-2 py-2.5 text-left"
            key={task.id}
            onClick={() => onSelect(task.id)}
            variant={task.id === selectedId ? 'secondary' : 'ghost'}
          >
            <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{task.title}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                Draft handoff · {formatUpdatedAt(task.updatedAt)}
              </span>
            </span>
          </Button>
        ))}
        {!busy && visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            {normalizedQuery
              ? 'No matching task drafts.'
              : 'Send a completed response to the queue.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(timestamp)
}
