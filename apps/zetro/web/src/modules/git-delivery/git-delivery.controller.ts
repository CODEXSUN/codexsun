import { createContext, useContext } from 'react'
import type {
  GitDeliveryFlowInput,
  GitDeliveryFlowRecord,
  GitDeliveryPreview,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types'

export type GitDeliveryContextValue = {
  busy: boolean
  effective: GitDeliverySettings | null
  error: string | null
  flows: GitDeliveryFlowRecord[]
  global: GitDeliverySettings | null
  preview: GitDeliveryPreview | null
  project: ProjectGitDeliverySettings | null
  refresh(title?: string): Promise<void>
  run(input: GitDeliveryFlowInput): Promise<GitDeliveryFlowRecord>
  saveGlobal(settings: GitDeliverySettings): Promise<void>
  saveProject(settings: ProjectGitDeliverySettings): Promise<void>
}

export const GitDeliveryContext = createContext<GitDeliveryContextValue | null>(null)

export function useGitDelivery() {
  const value = useContext(GitDeliveryContext)
  if (!value) throw new Error('useGitDelivery must be used inside GitDeliveryProvider.')
  return value
}
