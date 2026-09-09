import { createContext, useContext } from 'react'
import type {
  EditorOption,
  GitAction,
  GitComparison,
  GitWorkspaceStatus,
  ProjectToolSettings,
  ToolSettings,
} from './developer-tools.types'

export type DeveloperToolsContextValue = {
  busy: boolean
  editors: EditorOption[]
  effective: ToolSettings | null
  error: string | null
  global: ToolSettings | null
  project: ProjectToolSettings | null
  status: GitWorkspaceStatus | null
  compare(base: string): Promise<GitComparison>
  launch(target: 'editor' | 'files' | 'terminal'): Promise<void>
  refresh(): Promise<void>
  run(action: GitAction): Promise<void>
  saveGlobal(settings: ToolSettings): Promise<void>
  saveProject(settings: ProjectToolSettings): Promise<void>
}

export const DeveloperToolsContext = createContext<DeveloperToolsContextValue | null>(null)
export function useDeveloperTools() {
  const value = useContext(DeveloperToolsContext)
  if (!value) throw new Error('useDeveloperTools must be used inside DeveloperToolsProvider.')
  return value
}
