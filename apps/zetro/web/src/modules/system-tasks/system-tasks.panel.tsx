import { CircleStop, History, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { useSystemTasks } from './system-tasks.controller'

export function SystemTasksPanel() {
  const controller = useSystemTasks()
  if (controller.tasks.length === 0 && !controller.error) return null

  return (
    <section className="border-b">
      <header className="flex items-center gap-2 px-3 py-2 text-xs font-medium">
        <History className="size-3.5" />
        System tasks
        <Button
          aria-label="Refresh system tasks"
          className="ml-auto cursor-pointer"
          onClick={() => void controller.refresh()}
          size="icon-xs"
          variant="ghost"
        >
          <RefreshCw />
        </Button>
      </header>
      <div className="max-h-48 overflow-y-auto px-2 pb-2">
        {controller.tasks.slice(0, 8).map((task) => (
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
            key={task.id}
            onClick={() => void controller.select(task.id)}
            type="button"
          >
            <span className={statusClass(task.status)} />
            <span className="min-w-0 flex-1 truncate">{task.title}</span>
            <span className="text-[10px] text-muted-foreground">{task.status}</span>
            {task.status === 'pending' || task.status === 'running' ? (
              <Button
                aria-label={`Stop ${task.title}`}
                className="size-6 cursor-pointer hover:text-orange-500"
                onClick={(event) => {
                  event.stopPropagation()
                  void controller.stop(task.id)
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
                className="size-6 cursor-pointer hover:text-orange-500"
                onClick={(event) => {
                  event.stopPropagation()
                  void controller.retry(task.id)
                }}
                size="icon-xs"
                variant="ghost"
              >
                <RotateCcw />
              </Button>
            ) : null}
          </button>
        ))}
      </div>
      {controller.selected ? (
        <div className="border-t px-3 py-2 text-xs">
          <div className="font-medium">{controller.selected.title}</div>
          {controller.selected.steps.map((step) => (
            <div className="mt-1 text-muted-foreground" key={step.id}>
              {step.status}: {step.message}
            </div>
          ))}
          {controller.selected.error ? (
            <div className="mt-1 text-destructive">{controller.selected.error}</div>
          ) : null}
          {controller.selected.result ? (
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-[11px]">
              {formatResult(controller.selected.result)}
            </pre>
          ) : null}
        </div>
      ) : null}
      {controller.error ? (
        <div className="px-3 pb-2 text-xs text-destructive">{controller.error}</div>
      ) : null}
    </section>
  )
}

function formatResult(result: unknown): string {
  if (
    typeof result === 'object' &&
    result &&
    'output' in result &&
    typeof result.output === 'string'
  ) {
    return result.output
  }
  return JSON.stringify(result, null, 2)
}

function statusClass(status: string): string {
  if (status === 'completed') return 'size-2 rounded-full bg-emerald-500'
  if (status === 'running') return 'size-2 animate-pulse rounded-full bg-orange-500'
  if (status === 'failed' || status === 'blocked') return 'size-2 rounded-full bg-destructive'
  return 'size-2 rounded-full bg-muted-foreground'
}
