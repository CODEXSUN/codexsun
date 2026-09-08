import { Check, Circle, Clock3 } from 'lucide-react'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import type { TaskStatus, ZetroTask } from './tasks.types'

const nextStatus: Record<TaskStatus, TaskStatus> = {
  done: 'todo',
  in_progress: 'done',
  todo: 'in_progress',
}

interface TaskListProps {
  onChangeStatus(taskId: string, status: TaskStatus): void
  tasks: readonly ZetroTask[]
}

export function TaskList({ onChangeStatus, tasks }: TaskListProps) {
  const topology = useMdiTopology()

  if (tasks.length === 0) {
    return (
      <TopologyRegion className="tasks-empty" id="12.3" topology={topology}>
        <Circle />
        <p>No tasks yet</p>
        <span>Capture a next step here or turn a Zetro reply into a task.</span>
      </TopologyRegion>
    )
  }

  return (
    <TopologyRegion className="task-list" id="12.3" topology={topology}>
      {tasks.map((task) => (
        <article className={`task-row task-${task.status}`} key={task.id}>
          <button
            aria-label={`Move ${task.title} to ${formatStatus(nextStatus[task.status])}`}
            className="task-status"
            onClick={() => onChangeStatus(task.id, nextStatus[task.status])}
            type="button"
          >
            {task.status === 'done' ? (
              <Check />
            ) : task.status === 'in_progress' ? (
              <Clock3 />
            ) : (
              <Circle />
            )}
          </button>
          <div className="task-copy">
            <p>{task.title}</p>
            <span>{formatStatus(task.status)}</span>
          </div>
          <span
            className={`priority-dot priority-${task.priority}`}
            title={`${task.priority} priority`}
          />
        </article>
      ))}
    </TopologyRegion>
  )
}

function formatStatus(status: TaskStatus): string {
  return status === 'in_progress' ? 'In progress' : status === 'done' ? 'Done' : 'To do'
}
