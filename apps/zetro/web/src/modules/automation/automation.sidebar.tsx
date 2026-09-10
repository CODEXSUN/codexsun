import { Activity, History } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Badge } from '@codexsun/ui/components/badge'
import { useSystemTasks } from '../system-tasks'
import { isLiveRun } from './automation.run-model'

export function AutomationSidebar() {
  const runs = useSystemTasks()
  return (
    <div className="grid gap-4 p-2">
      {[true, false].map((live) => (
        <section key={String(live)} className="grid gap-1">
          <h2 className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground">
            {live ? <Activity className="size-3" /> : <History className="size-3" />}
            {live ? 'Active runs' : 'Recent history'}
          </h2>
          {runs.tasks
            .filter((task) => isLiveRun(task) === live)
            .slice(0, 20)
            .map((task) => (
              <Button
                key={task.id}
                variant={runs.selected?.id === task.id ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start gap-2 px-2 py-2 text-left"
                onClick={() => void runs.select(task.id)}
              >
                <span className="min-w-0 flex-1 truncate text-xs" title={task.title}>
                  {task.title}
                </span>
                <Badge variant={task.status === 'failed' ? 'destructive' : 'outline'}>
                  {task.status}
                </Badge>
              </Button>
            ))}
          {!runs.tasks.some((task) => isLiveRun(task) === live) && (
            <p className="px-2 text-xs text-muted-foreground">
              {live ? 'No active runs.' : 'No history yet.'}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
