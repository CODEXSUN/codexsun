import { TaskDashboard } from "./pages/task-dashboard"

export function TaskWorkspaceSection({ sectionId }: { sectionId?: string }) {
  if (sectionId === "kanban") {
    return <TaskDashboard />
  }

  // Fallback to overview or any other section
  if (sectionId === "overview") {
    return <TaskDashboard />
  }

  // By default, just return the dashboard or null
  return <TaskDashboard />
}
