export interface SystemTaskTable {
  created_at: string
  data: string
  id: string
  project_id: string | null
  status: string
  type: string
  updated_at: string
}

export interface SystemTaskStepTable {
  completed_at: string
  data: string
  id: string
  task_id: string
}

export interface SystemTasksDatabase {
  zetro_system_task_steps: SystemTaskStepTable
  zetro_system_tasks: SystemTaskTable
}
