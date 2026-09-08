import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { TopologyMarker } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import type { CreateTaskInput, TaskPriority } from './tasks.types'

interface TaskFormProps {
  initialTitle: string
  onCancel(): void
  onSubmit(input: CreateTaskInput): Promise<boolean>
}

export function TaskForm({ initialTitle, onCancel, onSubmit }: TaskFormProps) {
  const topology = useMdiTopology()
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => setTitle(initialTitle), [initialTitle])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return

    if (await onSubmit({ description: '', priority, title: title.trim() })) {
      setTitle('')
    }
  }

  return (
    <form
      className={`task-form ${topology.highlightClassName('12.2')}`}
      onSubmit={(event) => void handleSubmit(event)}
      {...topology.regionProps('12.2')}
    >
      <TopologyMarker id="12.2" topology={topology} />
      <label htmlFor="task-title">Task</label>
      <input
        autoFocus
        id="task-title"
        maxLength={160}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs to happen?"
        value={title}
      />
      <div className="task-form-row">
        <select
          aria-label="Task priority"
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          value={priority}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <button className="text-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="primary-button" type="submit">
          Add task <ArrowUpRight />
        </button>
      </div>
    </form>
  )
}
