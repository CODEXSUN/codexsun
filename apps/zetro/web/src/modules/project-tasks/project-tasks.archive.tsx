import { ArchiveRestore, LoaderCircle } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { useProjectTasks } from './project-tasks.controller'

export function ProjectTaskArchive() {
  const tasks = useProjectTasks()

  return (
    <section aria-label="Archived tasks" className="size-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-4/5 min-w-0 max-w-5xl flex-col py-6">
        <header className="border-b pb-4">
          <h1 className="text-xl font-semibold tracking-tight">Archived tasks</h1>
        </header>
        {tasks.isLoadingArchive ? (
          <LoaderCircle className="mx-auto my-12 size-5 animate-spin text-muted-foreground" />
        ) : null}
        {!tasks.isLoadingArchive && tasks.archivedTasks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No archived tasks.</p>
        ) : null}
        <div className="divide-y">
          {tasks.archivedTasks.map((task) => (
            <article className="flex items-center gap-4 py-4" key={task.id}>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-medium">{task.title}</h2>
                {task.description ? (
                  <p className="truncate pt-1 text-sm text-muted-foreground">{task.description}</p>
                ) : null}
              </div>
              <Button
                className="cursor-pointer"
                onClick={() => void tasks.restoreTask(task)}
                size="sm"
                variant="outline"
              >
                <ArchiveRestore /> Restore
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
