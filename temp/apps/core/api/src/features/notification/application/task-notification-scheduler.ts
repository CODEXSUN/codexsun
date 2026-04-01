import type { NotificationService } from './notification-service'
import type { TaskRepository } from '../../task/data/task-repository'

function startOfUtcDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

function parseDate(value: string | null) {
  if (!value) {
    return null
  }

  const parsedValue = new Date(value)
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue
}

function buildOverdueMessage(overdueDays: number, title: string) {
  if (overdueDays >= 7) {
    return `Critical: ${title} is overdue by ${overdueDays} days. Resolve it now.`
  }

  if (overdueDays >= 3) {
    return `${title} is overdue by ${overdueDays} days. It needs immediate attention.`
  }

  return `${title} is overdue. Open the task and move it forward today.`
}

export function startTaskNotificationScheduler(repository: TaskRepository, notificationService: NotificationService) {
  let active = false

  async function run() {
    if (active) {
      return
    }

    active = true
    try {
      const tasks = await repository.listAllTasks()
      const today = startOfUtcDay()
      const dueSoonBoundary = addDays(today, 1)
      const dayKey = toDateKey(today)

      for (const task of tasks) {
        if (!task.assigneeId || task.status === 'finalized') {
          continue
        }

        const dueDate = parseDate(task.dueDate)
        if (!dueDate) {
          continue
        }

        if (dueDate < today) {
          const overdueDays = Math.max(1, Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000))
          await notificationService.createNotification({
            userId: task.assigneeId,
            type: 'task_overdue',
            title: `Task overdue: ${task.title}`,
            message: buildOverdueMessage(overdueDays, task.title),
            entityType: task.entityType,
            entityId: task.entityId,
            taskId: task.id,
            dedupeKey: `task_overdue:${task.id}:${dayKey}`,
          })
          continue
        }

        if (dueDate <= dueSoonBoundary) {
          await notificationService.createNotification({
            userId: task.assigneeId,
            type: 'task_due_soon',
            title: `Task due tomorrow: ${task.title}`,
            message: `${task.title} is due within 24 hours. Review it before it turns overdue.`,
            entityType: task.entityType,
            entityId: task.entityId,
            taskId: task.id,
            dedupeKey: `task_due_soon:${task.id}:${dayKey}`,
          })
        }
      }
    } catch (error) {
      console.error('Task notification scheduler failed.', error)
    } finally {
      active = false
    }
  }

  void run()
  return setInterval(() => {
    void run()
  }, 60 * 60 * 1000)
}
