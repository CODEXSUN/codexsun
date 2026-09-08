import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ProjectContext, type ProjectView } from './projects.controller'
import { createProject, listProjects, updateProject } from './projects.services'
import type { ProjectUpdate, ZetroProject } from './projects.types'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<ZetroProject[]>([])
  const [view, setView] = useState<ProjectView>('chat')

  useEffect(() => {
    void listProjects()
      .then((loaded) => {
        setProjects(loaded)
        setActiveProjectId((current) => current ?? loaded[0]?.id ?? null)
        setError(null)
      })
      .catch((reason: unknown) => setError(toMessage(reason)))
      .finally(() => setIsLoading(false))
  }, [])

  const activeProject = useMemo(
    () => projects.find(({ id }) => id === activeProjectId) ?? projects[0] ?? null,
    [activeProjectId, projects],
  )

  async function addProject(input: { name: string; repositoryPath: string }) {
    const project = await createProject(input)
    setProjects((current) => [...current, project])
    setActiveProjectId(project.id)
    setView('chat')
    setError(null)
  }

  async function changeProject(projectId: string, input: ProjectUpdate) {
    const project = await updateProject(projectId, input)
    const remaining = project.archived
      ? projects.filter(({ id }) => id !== project.id)
      : projects.map((current) => (current.id === project.id ? project : current))
    setProjects(remaining)
    if (project.archived && project.id === activeProject?.id) {
      setActiveProjectId(remaining[0]?.id ?? null)
      setView('chat')
    }
    setError(null)
    return project
  }

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        addProject,
        error,
        isLoading,
        projects,
        selectProject: (projectId) => {
          setActiveProjectId(projectId)
          setView('chat')
        },
        setView,
        updateProject: changeProject,
        view,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

function toMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Zetro could not load projects.'
}
