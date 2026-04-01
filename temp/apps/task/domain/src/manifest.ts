export interface TaskWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const taskWorkspaceItems: TaskWorkspaceItem[] = [
  {
    id: 'overview',
    name: 'Task Overview',
    route: '/admin/dashboard/task',
    summary: 'Checklist-driven verification, assignment, and follow-through workspace.',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    route: '/admin/dashboard/task/tasks',
    summary: 'Manage assigned work, linked entity tasks, and verification queues.',
  },
  {
    id: 'groups',
    name: 'Task Groups',
    route: '/admin/dashboard/task/groups',
    summary: 'Manage lightweight execution groups for focus, batches, and sprints.',
  },
  {
    id: 'milestones',
    name: 'Milestones',
    route: '/admin/dashboard/task/milestones',
    summary: 'Group related tasks under one execution objective with progress and overdue rollups.',
  },
  {
    id: 'templates',
    name: 'Templates',
    route: '/admin/dashboard/task/templates',
    summary: 'Manage starter templates that prefill task defaults and checklist items.',
  },
  {
    id: 'bulk',
    name: 'Bulk Generator',
    route: '/admin/dashboard/task/bulk',
    summary: 'Generate structured product task runs using milestone overlays, task groups, and starter templates.',
  },
  {
    id: 'insights',
    name: 'Insights',
    route: '/admin/dashboard/task/insights',
    summary: 'Operational command view for workload, urgency, and derived task signals.',
  },
  {
    id: 'audit',
    name: 'Audit',
    route: '/admin/dashboard/task/audit',
    summary: 'Filterable proof-focused task table exposing incomplete verification and overdue execution.',
  },
]
