export const taskTableNames = {
  boards: "task_boards",
  boardStages: "task_board_stages",
  labels: "task_labels",
  routines: "task_routines",
  templates: "task_templates",
  tasks: "tasks", // Wait, is it better to call it task_payloads or just tasks? TASK.md says `tasks`.
  taskHeaders: "task_headers",
  taskEntityLinks: "task_entity_links",
  taskPerformanceMetrics: "task_performance_metrics",
} as const
