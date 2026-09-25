import { z } from "zod";

export const sweTaskPhaseSchema = z.enum([
  "intake",
  "grounding",
  "planning",
  "execution",
  "verification",
  "review",
  "completed",
  "failed",
]);

export type SweTaskPhase = z.infer<typeof sweTaskPhaseSchema>;

export const sweTaskStatusSchema = z.enum([
  "queued",
  "in_progress",
  "verified",
  "rejected",
  "completed",
  "failed",
]);

export type SweTaskStatus = z.infer<typeof sweTaskStatusSchema>;

export const sweVerificationCheckSchema = z.object({
  name: z.string().min(1),
  passed: z.boolean(),
  output: z.string().default(""),
  durationMs: z.number().nonnegative().default(0),
});

export type SweVerificationCheck = z.infer<typeof sweVerificationCheckSchema>;

export const sweTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  prompt: z.string().min(1),
  phase: sweTaskPhaseSchema,
  status: sweTaskStatusSchema,
  targetPaths: z.array(z.string()).default([]),
  changeSummary: z.string().default(""),
  verificationChecks: z.array(sweVerificationCheckSchema).default([]),
  reviewNotes: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SweTask = z.infer<typeof sweTaskSchema>;

export const createSweTaskInputSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  targetPaths: z.array(z.string()).optional(),
});

export type CreateSweTaskInput = z.infer<typeof createSweTaskInputSchema>;

export const advancePhaseInputSchema = z.object({
  targetPhase: sweTaskPhaseSchema,
  evidence: z.string().default("").optional(),
  targetPaths: z.array(z.string()).optional(),
  changeSummary: z.string().optional(),
});

export type AdvancePhaseInput = z.infer<typeof advancePhaseInputSchema>;

export const runVerificationInputSchema = z.object({
  checks: z.array(sweVerificationCheckSchema),
});

export type RunVerificationInput = z.infer<typeof runVerificationInputSchema>;

export const queueItemPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export type QueueItemPriority = z.infer<typeof queueItemPrioritySchema>;

export const queueItemStatusSchema = z.enum([
  "queued",
  "in_progress",
  "paused",
  "completed",
  "failed",
]);
export type QueueItemStatus = z.infer<typeof queueItemStatusSchema>;

export const runnerStatusSchema = z.enum(["idle", "running", "paused"]);
export type RunnerStatus = z.infer<typeof runnerStatusSchema>;

export const runnerLogLevelSchema = z.enum(["info", "warn", "error", "action"]);
export type RunnerLogLevel = z.infer<typeof runnerLogLevelSchema>;

export const runnerLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  level: runnerLogLevelSchema,
  phase: sweTaskPhaseSchema.optional(),
  message: z.string(),
});
export type RunnerLogEntry = z.infer<typeof runnerLogEntrySchema>;

export const phaseHistoryEntrySchema = z.object({
  phase: sweTaskPhaseSchema,
  enteredAt: z.string(),
  completedAt: z.string().optional(),
  actionSummary: z.string().optional(),
});
export type PhaseHistoryEntry = z.infer<typeof phaseHistoryEntrySchema>;

export const queueItemSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string(),
  priority: queueItemPrioritySchema,
  status: queueItemStatusSchema,
  currentPhase: sweTaskPhaseSchema,
  enqueuedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  autoProgress: z.boolean().default(true),
  phaseHistory: z.array(phaseHistoryEntrySchema).default([]),
  task: sweTaskSchema.optional(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
});
export type QueueItem = z.infer<typeof queueItemSchema>;

export const activeRunnerSlotSchema = z.object({
  runnerId: z.string(),
  taskId: z.string(),
  taskTitle: z.string(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  phase: sweTaskPhaseSchema,
  progress: z.number().min(0).max(100),
  startedAt: z.string(),
});
export type ActiveRunnerSlot = z.infer<typeof activeRunnerSlotSchema>;

export const runnerStateSchema = z.object({
  status: runnerStatusSchema,
  activeTaskId: z.string().nullable(),
  maxConcurrency: z.number().positive().default(2),
  activeRunners: z.array(activeRunnerSlotSchema).default([]),
  autoProgress: z.boolean(),
  stepIntervalMs: z.number(),
  processedCount: z.number(),
  lastRunAt: z.string().nullable(),
});
export type RunnerState = z.infer<typeof runnerStateSchema>;

export const enqueueTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  priority: queueItemPrioritySchema.default("medium").optional(),
  autoProgress: z.boolean().default(true).optional(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
});
export type EnqueueTaskInput = z.infer<typeof enqueueTaskInputSchema>;

export const configureRunnerInputSchema = z.object({
  autoProgress: z.boolean().optional(),
  stepIntervalMs: z.number().positive().optional(),
  maxConcurrency: z.number().positive().optional(),
});
export type ConfigureRunnerInput = z.infer<typeof configureRunnerInputSchema>;

export const runnerStepResultSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  runnerId: z.string().optional(),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  previousPhase: sweTaskPhaseSchema.optional(),
  currentPhase: sweTaskPhaseSchema.optional(),
  message: z.string(),
  completed: z.boolean(),
});
export type RunnerStepResult = z.infer<typeof runnerStepResultSchema>;

export const parallelStepResultSchema = z.object({
  results: z.array(runnerStepResultSchema),
  activeCount: z.number(),
  maxConcurrency: z.number(),
});
export type ParallelStepResult = z.infer<typeof parallelStepResultSchema>;

// Projects & Isolated Worktrees
export const conversationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  relativeTime: z.string().default("now"),
  active: z.boolean().default(false),
  messagesCount: z.number().default(0),
  activeTaskId: z.string().optional(),
  summary: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  rootPath: z.string().min(1),
  worktreeBranch: z.string().default("main"),
  isWorktree: z.boolean().default(false),
  worktreeStatus: z.enum(["active", "isolated", "detached"]).default("active"),
  conversations: z.array(conversationSchema).default([]),
  defaultModel: z.string().optional(),
  verificationRigor: z.enum(["full", "fast", "advisory"]).optional(),
  autoRollback: z.boolean().optional(),
  runnerConcurrency: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  worktreeBranch: z.string().optional(),
  isWorktree: z.boolean().default(false).optional(),
  isolatedWorktreePath: z.string().optional(),
  defaultModel: z.string().optional(),
  verificationRigor: z.enum(["full", "fast", "advisory"]).optional(),
  autoRollback: z.boolean().optional(),
  runnerConcurrency: z.number().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  name: z.string().min(1).optional(),
  worktreeBranch: z.string().optional(),
  isWorktree: z.boolean().optional(),
  defaultModel: z.string().optional(),
  verificationRigor: z.enum(["full", "fast", "advisory"]).optional(),
  autoRollback: z.boolean().optional(),
  runnerConcurrency: z.number().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const createConversationInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  activeTaskId: z.string().optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

// Codebase Knowledge Graph
export const codebaseGraphNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["app", "devkit", "package", "module", "core"]),
  path: z.string(),
  packageJsonName: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  fileCount: z.number().default(0),
  cluster: z.string(),
});
export type CodebaseGraphNode = z.infer<typeof codebaseGraphNodeSchema>;

export const codebaseGraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(["dependency", "import", "host_link", "contract"]),
  weight: z.number().default(1),
});
export type CodebaseGraphEdge = z.infer<typeof codebaseGraphEdgeSchema>;

export const codebaseGraphSummarySchema = z.object({
  totalNodes: z.number(),
  totalEdges: z.number(),
  clustersCount: z.number(),
  circularDependenciesDetected: z.boolean(),
  densityScore: z.number(),
});
export type CodebaseGraphSummary = z.infer<typeof codebaseGraphSummarySchema>;

export const codebaseGraphResultSchema = z.object({
  nodes: z.array(codebaseGraphNodeSchema),
  edges: z.array(codebaseGraphEdgeSchema),
  summary: codebaseGraphSummarySchema,
  clusters: z.array(z.string()),
});
export type CodebaseGraphResult = z.infer<typeof codebaseGraphResultSchema>;

// Git Operations & Diff Management
export const gitFileStatusSchema = z.object({
  path: z.string(),
  status: z.enum(["modified", "added", "deleted", "untracked", "renamed"]),
  staged: z.boolean(),
});
export type GitFileStatus = z.infer<typeof gitFileStatusSchema>;

export const gitStatusResultSchema = z.object({
  branch: z.string(),
  clean: z.boolean(),
  files: z.array(gitFileStatusSchema),
  summary: z.object({
    modified: z.number(),
    added: z.number(),
    deleted: z.number(),
    untracked: z.number(),
    total: z.number(),
  }),
});
export type GitStatusResult = z.infer<typeof gitStatusResultSchema>;

export const gitDiffChunkSchema = z.object({
  filePath: z.string(),
  additions: z.number(),
  deletions: z.number(),
  patch: z.string(),
});
export type GitDiffChunk = z.infer<typeof gitDiffChunkSchema>;

export const gitDiffResultSchema = z.object({
  files: z.array(gitDiffChunkSchema),
  totalAdditions: z.number(),
  totalDeletions: z.number(),
});
export type GitDiffResult = z.infer<typeof gitDiffResultSchema>;

export const autoCommitInputSchema = z.object({
  message: z.string().optional(),
  stageAll: z.boolean().default(true).optional(),
  context: z
    .object({
      taskTitle: z.string().optional(),
      prompt: z.string().optional(),
      targetPaths: z.array(z.string()).optional(),
      verificationPassed: z.boolean().optional(),
      checksCount: z.number().optional(),
    })
    .optional(),
});
export type AutoCommitInput = z.infer<typeof autoCommitInputSchema>;

export const autoCommitResultSchema = z.object({
  success: z.boolean(),
  commitHash: z.string(),
  message: z.string(),
  filesCommitted: z.array(z.string()),
  timestamp: z.string(),
});
export type AutoCommitResult = z.infer<typeof autoCommitResultSchema>;

export const undoChangesInputSchema = z.object({
  mode: z.enum(["working_tree", "last_commit", "file"]).default("working_tree"),
  targetFile: z.string().optional(),
});
export type UndoChangesInput = z.infer<typeof undoChangesInputSchema>;

export const undoChangesResultSchema = z.object({
  success: z.boolean(),
  mode: z.string(),
  undoneFiles: z.array(z.string()),
  message: z.string(),
});
export type UndoChangesResult = z.infer<typeof undoChangesResultSchema>;

export const mergeWorktreeInputSchema = z.object({
  sourceBranch: z.string().min(1),
  targetBranch: z.string().default("main").optional(),
  commitMessage: z.string().optional(),
  deleteAfterMerge: z.boolean().default(false).optional(),
});
export type MergeWorktreeInput = z.infer<typeof mergeWorktreeInputSchema>;

export const mergeWorktreeResultSchema = z.object({
  success: z.boolean(),
  mergedCommitHash: z.string(),
  sourceBranch: z.string(),
  targetBranch: z.string(),
  message: z.string(),
  filesChanged: z.array(z.string()).default([]),
});
export type MergeWorktreeResult = z.infer<typeof mergeWorktreeResultSchema>;

// Autonomous Patch Engine
export const applyPatchInputSchema = z.object({
  filePath: z.string().min(1),
  targetContent: z.string().optional(),
  replacementContent: z.string().optional(),
  fullContent: z.string().optional(),
  description: z.string().optional(),
});
export type ApplyPatchInput = z.infer<typeof applyPatchInputSchema>;

export const applyPatchResultSchema = z.object({
  success: z.boolean(),
  filePath: z.string(),
  linesChanged: z.number(),
  diffPreview: z.string(),
  message: z.string(),
  backupCreated: z.boolean(),
});
export type ApplyPatchResult = z.infer<typeof applyPatchResultSchema>;

// LangGraph-like Cyclical State Machine Contracts
export const stateGraphNodeSchema = z.object({
  id: sweTaskPhaseSchema,
  label: z.string(),
  description: z.string(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  requiresHumanApproval: z.boolean().default(false),
});
export type StateGraphNode = z.infer<typeof stateGraphNodeSchema>;

export const stateGraphEdgeSchema = z.object({
  from: sweTaskPhaseSchema,
  to: sweTaskPhaseSchema,
  condition: z.enum(["always", "on_passed", "on_failed", "on_human_approved"]),
});
export type StateGraphEdge = z.infer<typeof stateGraphEdgeSchema>;

// Prompt Auto-Enricher
export const promptEnrichInputSchema = z.object({
  rawPrompt: z.string().min(1),
  projectId: z.string().optional(),
});
export type PromptEnrichInput = z.infer<typeof promptEnrichInputSchema>;

export const promptEnrichResultSchema = z.object({
  rawPrompt: z.string(),
  enrichedPrompt: z.string(),
  discoveredFiles: z.array(z.string()),
  relevantSymbols: z.array(z.string()),
  confidence: z.number(),
});
export type PromptEnrichResult = z.infer<typeof promptEnrichResultSchema>;




