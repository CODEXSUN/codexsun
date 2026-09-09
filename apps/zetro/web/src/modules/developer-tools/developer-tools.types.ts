export type EditorId = 'auto' | 'cursor' | 'vscode' | 'windsurf'

export type ToolSettings = {
  allowForceWithLease: boolean
  allowPullRequests: boolean
  allowPush: boolean
  autoRefreshSeconds: 5 | 15 | 30 | 60
  branchPrefix: string
  commitInstructions: string
  compareBranch: string
  desktopNotifications: boolean
  editor: EditorId
  protectedBranches: string[]
  trustedRepository: boolean
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

export type GitChangedFile = {
  conflict: boolean
  indexStatus: string
  path: string
  worktreeStatus: string
}
export type GitFileDiff = {
  after: string
  before: string
  hunks: number
  patch: string
  path: string
  staged: boolean
}
export type GitBranchSummary = { current: boolean; merged: boolean; name: string }
export type GitStashSummary = { index: number; message: string; reference: string }
export type GitFileHistoryEntry = GitCommitSummary & { author: string }
export type GitBlameLine = {
  author: string
  authoredAt: string
  commit: string
  content: string
  line: number
}
export type GitConflictFile = { content: string; path: string }
