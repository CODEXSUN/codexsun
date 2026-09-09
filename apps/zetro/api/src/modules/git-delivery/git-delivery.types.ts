export type DeliverySyncStrategy = 'merge' | 'none' | 'rebase'

export interface GitDeliverySettings {
  defaultChangelog: boolean
  defaultDatabaseUpdate: 'auto' | 'no' | 'yes'
  defaultPush: boolean
  defaultSyncStrategy: DeliverySyncStrategy
  defaultVersionBump: boolean
  enabled: boolean
}

export interface ProjectGitDeliverySettings extends GitDeliverySettings {
  inheritGlobal: boolean
}

export interface GitDeliveryRegistry {
  flows: GitDeliveryFlowRecord[]
  global: GitDeliverySettings
  projects: Record<string, ProjectGitDeliverySettings>
}

export interface GitDeliveryPreview {
  branch: string
  canWriteChangelog: boolean
  canBumpVersion: boolean
  changedFiles: string[]
  currentVersion: string | null
  githubUrl: string | null
  head: string
  nextVersion: string | null
  remoteUrl: string | null
  suggestedCommitMessage: string
  upstream: string | null
}

export interface GitDeliveryFlowInput {
  bumpVersion: boolean
  commitMessage: string
  databaseUpdate: 'auto' | 'no' | 'yes'
  expectedFiles: string[]
  expectedHead: string
  note: string
  push: boolean
  syncStrategy: DeliverySyncStrategy
  title: string
  writeChangelog: boolean
}

export type GitDeliveryStepId = 'changelog' | 'commit' | 'push' | 'sync' | 'version'
export type GitDeliveryStepStatus = 'complete' | 'failed' | 'skipped'

export interface GitDeliveryStepResult {
  id: GitDeliveryStepId
  message: string
  status: GitDeliveryStepStatus
}

export interface GitDeliveryFlowRecord {
  completedAt: string
  createdAt: string
  error: string | null
  id: string
  input: GitDeliveryFlowInput
  projectId: string
  status: 'complete' | 'failed' | 'running'
  steps: GitDeliveryStepResult[]
}
