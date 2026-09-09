import { z } from 'zod'

export const toolSettingsSchema = z.object({
  allowForceWithLease: z.boolean(),
  allowPullRequests: z.boolean(),
  allowPush: z.boolean(),
  autoRefreshSeconds: z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)]),
  branchPrefix: z.string(),
  commitInstructions: z.string(),
  compareBranch: z.string(),
  desktopNotifications: z.boolean(),
  editor: z.enum(['auto', 'cursor', 'vscode', 'windsurf']),
  protectedBranches: z.array(z.string()),
  trustedRepository: z.boolean(),
})
export const projectToolSettingsSchema = toolSettingsSchema.extend({ inheritGlobal: z.boolean() })
export const editorOptionSchema = z.object({
  available: z.boolean(),
  id: z.enum(['cursor', 'vscode', 'windsurf']),
  label: z.string(),
})
export const globalSettingsResponseSchema = z.object({
  editors: z.array(editorOptionSchema),
  settings: toolSettingsSchema,
})
export const projectSettingsResponseSchema = z.object({
  effective: toolSettingsSchema,
  project: projectToolSettingsSchema,
})
const commitSchema = z.object({
  authoredAt: z.string(),
  hash: z.string(),
  shortHash: z.string(),
  subject: z.string(),
})
export const gitStatusSchema = z.object({
  additions: z.number(),
  ahead: z.number(),
  behind: z.number(),
  branch: z.string(),
  deletions: z.number(),
  detached: z.boolean(),
  files: z.number(),
  generatedAt: z.string(),
  latencyMs: z.number(),
  recentCommits: z.array(commitSchema),
  staged: z.number(),
  untracked: z.number(),
  unstaged: z.number(),
  upstream: z.string().nullable(),
})
export const gitComparisonSchema = z.object({
  additions: z.number(),
  baseBranch: z.string(),
  commitsAhead: z.number(),
  deletions: z.number(),
  files: z.array(z.object({ path: z.string(), status: z.string() })),
  headBranch: z.string(),
})
export const gitActionResponseSchema = z.object({ output: z.string(), status: gitStatusSchema })
export const changedFilesSchema = z.object({
  files: z.array(
    z.object({
      conflict: z.boolean(),
      indexStatus: z.string(),
      path: z.string(),
      worktreeStatus: z.string(),
    }),
  ),
})
export const fileDiffSchema = z.object({
  after: z.string(),
  before: z.string(),
  hunks: z.number(),
  patch: z.string(),
  path: z.string(),
  staged: z.boolean(),
})
export const branchesSchema = z.object({
  branches: z.array(z.object({ current: z.boolean(), merged: z.boolean(), name: z.string() })),
})
export const stashesSchema = z.object({
  stashes: z.array(z.object({ index: z.number(), message: z.string(), reference: z.string() })),
})
export const historySchema = z.object({
  history: z.array(commitSchema.extend({ author: z.string() })),
})
export const blameSchema = z.object({
  lines: z.array(
    z.object({
      author: z.string(),
      authoredAt: z.string(),
      commit: z.string(),
      content: z.string(),
      line: z.number(),
    }),
  ),
})
export const conflictsSchema = z.object({
  files: z.array(z.object({ content: z.string(), path: z.string() })),
})
export const scriptsSchema = z.object({ scripts: z.array(z.string()) })
export const pullRequestResponseSchema = z.object({ url: z.string() })
