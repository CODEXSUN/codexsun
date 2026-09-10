import { CircleStop, RotateCcw } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { useSystemTasks } from '../system-tasks'

export function AutomationSidebar() {
  const runs = useSystemTasks()
  if (runs.tasks.length === 0) {
    return <p className="px-3 py-4 text-xs text-muted-foreground">No automation runs yet.</p>
  }

  return (
    <div className="space-y-0.5 p-1.5">
      {runs.tasks.map((task) => (
        <Button
          variant="ghost"
          className="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-muted"
          key={task.id}
          onClick={() => void runs.select(task.id)}
          type="button"
        >
          <span className={statusClass(task.status)} />
          <span className="min-w-0 flex-1 truncate">{task.title}</span>
          {task.status === 'pending' || task.status === 'running' ? (
            <Button
              aria-label={`Stop ${task.title}`}
              className="invisible size-6 cursor-pointer group-hover:visible hover:text-orange-500"
              onClick={(event) => {
                event.stopPropagation()
                void runs.stop(task.id)
              }}
              size="icon-xs"
              variant="ghost"
            >
              <CircleStop />
            </Button>
          ) : null}
          {['blocked', 'failed', 'stopped'].includes(task.status) ? (
            <Button
              aria-label={`Retry ${task.title}`}
              className="invisible size-6 cursor-pointer group-hover:visible hover:text-orange-500"
              onClick={(event) => {
                event.stopPropagation()
                void runs.retry(task.id)
              }}
              size="icon-xs"
              variant="ghost"
            >
              <RotateCcw />
            </Button>
          ) : null}
        </Button>
      ))}
    </div>
  )
}

function statusClass(status: string): string {
  if (status === 'completed') return 'size-2 rounded-full bg-emerald-500'
  if (status === 'running') return 'size-2 animate-pulse rounded-full bg-orange-500'
  if (status === 'failed' || status === 'blocked') return 'size-2 rounded-full bg-destructive'
  return 'size-2 rounded-full bg-muted-foreground'
}
