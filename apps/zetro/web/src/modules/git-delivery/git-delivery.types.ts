export type DeliverySyncStrategy = 'merge' | 'none' | 'rebase'
export type DatabaseUpdateChoice = 'auto' | 'no' | 'yes'

export type GitDeliverySettings = {
  defaultChangelog: boolean
  defaultDatabaseUpdate: DatabaseUpdateChoice
  defaultPush: boolean
  defaultSyncStrategy: DeliverySyncStrategy
  defaultVersionBump: boolean
  enabled: boolean
}

export type ProjectGitDeliverySettings = GitDeliverySettings & { inheritGlobal: boolean }

export type GitDeliveryPreview = {
  branch: string
  canBumpVersion: boolean
  canWriteChangelog: boolean
  changedFiles: string[]
  currentVersion: string | null
  githubUrl: string | null
  head: string
  nextVersion: string | null
  remoteUrl: string | null
  suggestedCommitMessage: string
  upstream: string | null
}

export type GitDeliveryFlowInput = {
  bumpVersion: boolean
  commitMessage: string
  databaseUpdate: DatabaseUpdateChoice
  expectedFiles: string[]
  expectedHead: string
  note: string
  push: boolean
  syncStrategy: DeliverySyncStrategy
  title: string
  writeChangelog: boolean
}

export type GitDeliveryStepResult = {
  id: 'changelog' | 'commit' | 'push' | 'sync' | 'version'
  message: string
  status: 'blocked' | 'complete' | 'failed' | 'running' | 'skipped'
}

export type GitDeliveryFlowRecord = {
  completedAt: string
  createdAt: string
  error: string | null
  id: string
  input: GitDeliveryFlowInput
  projectId: string
  status: 'blocked' | 'complete' | 'failed' | 'pending' | 'running' | 'stopped'
  steps: GitDeliveryStepResult[]
  systemTaskId: string | null
}
