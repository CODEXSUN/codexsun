import { Plus, RefreshCw } from 'lucide-react'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { TaskForm } from './tasks.form'
import { useTasks } from './tasks.hooks'
import { TaskList } from './tasks.list'

interface TaskWorkspaceProps {
  draftTitle: string
  isCreating: boolean
  onCloseForm(): void
  onOpenForm(): void
}

export function TaskWorkspace({
  draftTitle,
  isCreating,
  onCloseForm,
  onOpenForm,
}: TaskWorkspaceProps) {
  const tasks = useTasks()
  const topology = useMdiTopology()
  const openCount = tasks.tasks.filter((task) => task.status !== 'done').length

  return (
    <TopologyRegion as="aside" className="task-workspace" id="12" topology={topology}>
      <TopologyRegion as="header" className="task-header" id="12.1" topology={topology}>
        <div>
          <p className="eyebrow">Execution</p>
          <h2>Tasks</h2>
        </div>
        <span className="task-count">{openCount} open</span>
      </TopologyRegion>

      {isCreating ? (
        <TaskForm
          initialTitle={draftTitle}
          onCancel={onCloseForm}
          onSubmit={async (input) => {
            const created = await tasks.addTask(input)
            if (created) onCloseForm()
            return Boolean(created)
          }}
        />
      ) : (
        <TopologyRegion id="12.2" topology={topology}>
          <button className="new-task-button" onClick={onOpenForm} type="button">
            <Plus /> Add a task
          </button>
        </TopologyRegion>
      )}

      {tasks.error && (
        <div className="task-error" role="alert">
          <span>{tasks.error}</span>
          <button onClick={() => void tasks.refresh()} type="button">
            <RefreshCw /> Retry
          </button>
        </div>
      )}
      {tasks.isLoading ? (
        <div className="tasks-loading">Loading tasks…</div>
      ) : (
        <TaskList onChangeStatus={tasks.changeStatus} tasks={tasks.tasks} />
      )}
    </TopologyRegion>
  )
}
