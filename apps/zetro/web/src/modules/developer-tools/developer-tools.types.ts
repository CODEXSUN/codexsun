export type EditorId = 'auto' | 'cursor' | 'vscode' | 'windsurf'

export type ToolSettings = {
  allowForceWithLease: boolean
  allowPush: boolean
  autoRefreshSeconds: 5 | 15 | 30 | 60
  branchPrefix: string
  commitInstructions: string
  compareBranch: string
  editor: EditorId
}

export type ProjectToolSettings = ToolSettings & { inheritGlobal: boolean }
export type EditorOption = { available: boolean; id: Exclude<EditorId, 'auto'>; label: string }
export type GitCommitSummary = {
  authoredAt: string
  hash: string
  shortHash: string
  subject: string
}
export type GitWorkspaceStatus = {
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
export type GitComparison = {
  additions: number
  baseBranch: string
  commitsAhead: number
  deletions: number
  files: Array<{ path: string; status: string }>
  headBranch: string
}
export type GitAction =
  | { action: 'fetch' }
  | { action: 'branch'; name: string }
  | { action: 'commit'; message: string; stageAll: boolean }
  | { action: 'push'; forceWithLease: boolean }
  | { action: 'revert'; commit: string }
