import { createContext, useContext } from 'react'
import type { ProjectUpdate, ZetroProject } from './projects.types'

export type ProjectView = 'automation' | 'chat' | 'tasks'

export type ProjectController = {
  activeProject: ZetroProject | null
  error: string | null
  isLoading: boolean
  projects: ZetroProject[]
  view: ProjectView
  addProject(input: { name: string; repositoryPath: string }): Promise<void>
  selectProject(projectId: string): void
  setView(view: ProjectView): void
  updateProject(projectId: string, input: ProjectUpdate): Promise<ZetroProject>
}

export const ProjectContext = createContext<ProjectController | null>(null)

export function useProjects() {
  const controller = useContext(ProjectContext)
  if (!controller) throw new Error('useProjects must be used inside ProjectProvider.')
  return controller
}
