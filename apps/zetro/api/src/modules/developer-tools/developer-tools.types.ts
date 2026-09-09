export type EditorId = 'auto' | 'cursor' | 'vscode' | 'windsurf'

export interface DeveloperToolSettings {
  allowForceWithLease: boolean
  allowPush: boolean
  autoRefreshSeconds: 5 | 15 | 30 | 60
  branchPrefix: string
  commitInstructions: string
  compareBranch: string
  editor: EditorId
}

export interface ProjectToolSettings extends DeveloperToolSettings {
  inheritGlobal: boolean
}

export interface DeveloperToolRegistry {
  global: DeveloperToolSettings
  projects: Record<string, ProjectToolSettings>
}

export interface GitCommitSummary {
  authoredAt: string
  hash: string
  shortHash: string
  subject: string
}

export interface GitWorkspaceStatus {
  additions: number
  ahead: number
  behind: number
  branch: string
  deletions: number
  detached: boolean
  files: number
  generatedAt: string
  latencyMs: number
  recentCommits: GitCommitSummary[]
  staged: number
  untracked: number
  unstaged: number
  upstream: string | null
}

export interface GitComparison {
  additions: number
  baseBranch: string
  commitsAhead: number
  deletions: number
  files: Array<{ path: string; status: string }>
  headBranch: string
}

export interface GitDeliverySnapshot {
  branch: string
  changedFiles: string[]
  head: string
  remoteUrl: string | null
  upstream: string | null
}

export interface EditorOption {
  available: boolean
  id: Exclude<EditorId, 'auto'>
  label: string
}
