export interface SweTaskItem {
  id: string;
  title: string;
  prompt: string;
  phase: string;
  status: string;
  targetPaths: string[];
  createdAt: string;
}

export interface HeuristicItem {
  id: string;
  category: string;
  rule: string;
  triggerKeywords: string[];
  reinforcementCount: number;
  effectivenessScore: number;
}

export interface ExperienceItem {
  id: string;
  taskId: string;
  outcome: string;
  domain: string;
  symptoms: string[];
  rootCause: string;
  resolution: string;
  confidence: number;
  createdAt: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  scope: string;
  markdown: string;
}

export async function fetchCodeitzHealth(fetchFn: typeof fetch = fetch): Promise<{ status: string; providers: string[] }> {
  const res = await fetchFn("/api/v1/codeitz/health");
  if (!res.ok) throw new Error(`Health request failed: ${res.status}`);
  return res.json();
}

export async function fetchSweTasks(fetchFn: typeof fetch = fetch): Promise<SweTaskItem[]> {
  const res = await fetchFn("/api/v1/codeitz/swe/tasks");
  if (!res.ok) throw new Error(`Tasks request failed: ${res.status}`);
  return res.json();
}

export async function createSweTask(
  data: { title: string; prompt: string; targetPaths?: string[] },
  fetchFn: typeof fetch = fetch,
): Promise<SweTaskItem> {
  const res = await fetchFn("/api/v1/codeitz/swe/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create task failed: ${res.status}`);
  return res.json();
}

export async function fetchHeuristics(fetchFn: typeof fetch = fetch): Promise<HeuristicItem[]> {
  const res = await fetchFn("/api/v1/codeitz/learning/heuristics");
  if (!res.ok) throw new Error(`Heuristics request failed: ${res.status}`);
  return res.json();
}

export async function fetchExperiences(fetchFn: typeof fetch = fetch): Promise<ExperienceItem[]> {
  const res = await fetchFn("/api/v1/codeitz/learning/experiences");
  if (!res.ok) throw new Error(`Experiences request failed: ${res.status}`);
  return res.json();
}

export async function fetchSkills(fetchFn: typeof fetch = fetch): Promise<SkillItem[]> {
  const res = await fetchFn("/api/v1/codeitz/skills");
  if (!res.ok) throw new Error(`Skills request failed: ${res.status}`);
  return res.json();
}

export interface PhaseHistoryItem {
  phase: string;
  enteredAt: string;
  completedAt?: string;
  actionSummary?: string;
}

export interface QueueItem {
  id: string;
  taskId: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "queued" | "in_progress" | "paused" | "completed" | "failed";
  currentPhase: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  autoProgress: boolean;
  phaseHistory: PhaseHistoryItem[];
  task?: SweTaskItem;
}

export interface ActiveRunnerSlot {
  runnerId: string;
  taskId: string;
  taskTitle: string;
  projectId?: string;
  conversationId?: string;
  phase: string;
  progress: number;
  startedAt: string;
}

export interface RunnerState {
  status: "idle" | "running" | "paused";
  activeTaskId: string | null;
  maxConcurrency: number;
  activeRunners: ActiveRunnerSlot[];
  autoProgress: boolean;
  stepIntervalMs: number;
  processedCount: number;
  lastRunAt: string | null;
}

export interface RunnerLogEntry {
  id: string;
  timestamp: string;
  taskId?: string;
  taskTitle?: string;
  level: "info" | "warn" | "error" | "action";
  phase?: string;
  message: string;
}

export interface QueueStateResponse {
  queue: QueueItem[];
  runnerState: RunnerState;
  logs: RunnerLogEntry[];
}

export interface RunnerStepResult {
  success: boolean;
  action: string;
  runnerId?: string;
  taskId?: string;
  taskTitle?: string;
  previousPhase?: string;
  currentPhase?: string;
  message: string;
  completed: boolean;
}

export interface ParallelStepResult {
  results: RunnerStepResult[];
  activeCount: number;
  maxConcurrency: number;
}

export interface ConversationItem {
  id: string;
  projectId: string;
  title: string;
  relativeTime: string;
  active: boolean;
  messagesCount: number;
  activeTaskId?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  rootPath: string;
  worktreeBranch: string;
  isWorktree: boolean;
  worktreeStatus: "active" | "isolated" | "detached";
  conversations: ConversationItem[];
  defaultModel?: string;
  verificationRigor?: "full" | "fast" | "advisory";
  autoRollback?: boolean;
  runnerConcurrency?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProjectInput {
  name?: string;
  worktreeBranch?: string;
  isWorktree?: boolean;
  defaultModel?: string;
  verificationRigor?: "full" | "fast" | "advisory";
  autoRollback?: boolean;
  runnerConcurrency?: number;
}

export async function fetchQueueState(fetchFn: typeof fetch = fetch): Promise<QueueStateResponse> {
  const res = await fetchFn("/api/v1/codeitz/swe/queue");
  if (!res.ok) throw new Error(`Fetch queue failed: ${res.status}`);
  return res.json();
}

export async function enqueueTask(
  data: { taskId: string; priority?: "low" | "medium" | "high" | "critical"; autoProgress?: boolean },
  fetchFn: typeof fetch = fetch,
): Promise<QueueItem> {
  const res = await fetchFn("/api/v1/codeitz/swe/queue/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Enqueue task failed: ${res.status}`);
  return res.json();
}

export async function dequeueTask(taskId: string, fetchFn: typeof fetch = fetch): Promise<{ success: boolean }> {
  const res = await fetchFn(`/api/v1/codeitz/swe/queue/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Dequeue task failed: ${res.status}`);
  return res.json();
}

export async function startRunner(
  config?: { autoProgress?: boolean; stepIntervalMs?: number; maxConcurrency?: number },
  fetchFn: typeof fetch = fetch,
): Promise<RunnerState> {
  const res = await fetchFn("/api/v1/codeitz/swe/runner/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config ?? {}),
  });
  if (!res.ok) throw new Error(`Start runner failed: ${res.status}`);
  return res.json();
}

export async function pauseRunner(fetchFn: typeof fetch = fetch): Promise<RunnerState> {
  const res = await fetchFn("/api/v1/codeitz/swe/runner/pause", {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Pause runner failed: ${res.status}`);
  return res.json();
}

export async function stepRunner(fetchFn: typeof fetch = fetch): Promise<RunnerStepResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/runner/step", {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Step runner failed: ${res.status}`);
  return res.json();
}

export async function continueTaskRunner(taskId: string, fetchFn: typeof fetch = fetch): Promise<RunnerStepResult> {
  const res = await fetchFn(`/api/v1/codeitz/swe/runner/continue/${taskId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Continue task failed: ${res.status}`);
  return res.json();
}

export async function fetchRunnerLogs(limit: number = 100, fetchFn: typeof fetch = fetch): Promise<RunnerLogEntry[]> {
  const res = await fetchFn(`/api/v1/codeitz/swe/runner/logs?limit=${limit}`);
  if (!res.ok) throw new Error(`Fetch runner logs failed: ${res.status}`);
  return res.json();
}

// Capabilities
export interface CapabilityItem {
  id: string;
  name: string;
  description: string;
  category: "core" | "multimodal" | "reasoning" | "automation";
  icon: string;
  enabled: boolean;
  supportedFormats?: string[];
}

export interface PromptSpellCheckResult {
  original: string;
  corrected: string;
  hasCorrections: boolean;
  corrections: Array<{ originalWord: string; correctedWord: string; offset: number }>;
}

export async function fetchCapabilities(fetchFn: typeof fetch = fetch): Promise<CapabilityItem[]> {
  const res = await fetchFn("/api/v1/codeitz/capabilities");
  if (!res.ok) throw new Error(`Capabilities request failed: ${res.status}`);
  return res.json();
}

export async function checkPromptSpelling(
  prompt: string,
  fetchFn: typeof fetch = fetch,
): Promise<PromptSpellCheckResult> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/spellcheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Spellcheck request failed: ${res.status}`);
  return res.json();
}

// Codebase Knowledge Graph
export interface CodebaseGraphNode {
  id: string;
  name: string;
  type: "app" | "devkit" | "package" | "module" | "core";
  path: string;
  packageJsonName?: string;
  dependencies: string[];
  fileCount: number;
  cluster: string;
}

export interface CodebaseGraphEdge {
  source: string;
  target: string;
  type: "dependency" | "import" | "host_link" | "contract";
  weight: number;
}

export interface CodebaseGraphResult {
  nodes: CodebaseGraphNode[];
  edges: CodebaseGraphEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    clustersCount: number;
    circularDependenciesDetected: boolean;
    densityScore: number;
  };
  clusters: string[];
}

export async function fetchCodebaseGraph(fetchFn: typeof fetch = fetch): Promise<CodebaseGraphResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/codebase-graph");
  if (!res.ok) throw new Error(`Codebase graph request failed: ${res.status}`);
  return res.json();
}

// Git Ops & Diff Management
export interface GitFileStatus {
  path: string;
  status: "modified" | "added" | "deleted" | "untracked" | "renamed";
  staged: boolean;
}

export interface GitStatusResult {
  branch: string;
  clean: boolean;
  files: GitFileStatus[];
  summary: {
    modified: number;
    added: number;
    deleted: number;
    untracked: number;
    total: number;
  };
}

export interface GitDiffChunk {
  filePath: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface GitDiffResult {
  files: GitDiffChunk[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface AutoCommitResult {
  success: boolean;
  commitHash: string;
  message: string;
  filesCommitted: string[];
  timestamp: string;
}

export interface UndoChangesResult {
  success: boolean;
  mode: string;
  undoneFiles: string[];
  message: string;
}

export async function fetchGitStatus(fetchFn: typeof fetch = fetch): Promise<GitStatusResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/git/status");
  if (!res.ok) throw new Error(`Git status request failed: ${res.status}`);
  return res.json();
}

export async function fetchGitDiff(file?: string, fetchFn: typeof fetch = fetch): Promise<GitDiffResult> {
  const url = file ? `/api/v1/codeitz/swe/git/diff?file=${encodeURIComponent(file)}` : "/api/v1/codeitz/swe/git/diff";
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Git diff request failed: ${res.status}`);
  return res.json();
}

export async function autoCommitGit(
  data?: {
    message?: string;
    stageAll?: boolean;
    context?: {
      taskTitle?: string;
      prompt?: string;
      targetPaths?: string[];
      verificationPassed?: boolean;
      checksCount?: number;
    };
  },
  fetchFn: typeof fetch = fetch,
): Promise<AutoCommitResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/git/auto-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(`Auto commit failed: ${res.status}`);
  return res.json();
}

export async function undoGitChanges(
  data?: { mode?: "working_tree" | "last_commit" | "file"; targetFile?: string },
  fetchFn: typeof fetch = fetch,
): Promise<UndoChangesResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/git/undo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(`Undo changes failed: ${res.status}`);
  return res.json();
}

export async function stepParallelRunners(fetchFn: typeof fetch = fetch): Promise<ParallelStepResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/runner/step-parallel", { method: "POST" });
  if (!res.ok) throw new Error(`Step parallel failed: ${res.status}`);
  return res.json();
}

export async function fetchProjects(fetchFn: typeof fetch = fetch): Promise<ProjectItem[]> {
  const res = await fetchFn("/api/v1/codeitz/swe/projects");
  if (!res.ok) throw new Error(`Fetch projects failed: ${res.status}`);
  return res.json();
}

export async function createProject(
  data: { name: string; worktreeBranch?: string; isWorktree?: boolean; isolatedWorktreePath?: string },
  fetchFn: typeof fetch = fetch,
): Promise<ProjectItem> {
  const res = await fetchFn("/api/v1/codeitz/swe/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create project failed: ${res.status}`);
  return res.json();
}

export async function fetchConversations(projectId: string, fetchFn: typeof fetch = fetch): Promise<ConversationItem[]> {
  const res = await fetchFn(`/api/v1/codeitz/swe/projects/${projectId}/conversations`);
  if (!res.ok) throw new Error(`Fetch conversations failed: ${res.status}`);
  return res.json();
}

export async function createConversation(
  projectId: string,
  data: { title: string; summary?: string; activeTaskId?: string },
  fetchFn: typeof fetch = fetch,
): Promise<ConversationItem> {
  const res = await fetchFn(`/api/v1/codeitz/swe/projects/${projectId}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create conversation failed: ${res.status}`);
  return res.json();
}

export async function activateConversation(
  projectId: string,
  conversationId: string,
  fetchFn: typeof fetch = fetch,
): Promise<ConversationItem> {
  const res = await fetchFn(`/api/v1/codeitz/swe/projects/${projectId}/conversations/${conversationId}/activate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Activate conversation failed: ${res.status}`);
  return res.json();
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput,
  fetchFn: typeof fetch = fetch,
): Promise<ProjectItem> {
  const res = await fetchFn(`/api/v1/codeitz/swe/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Update project failed: ${res.status}`);
  return res.json();
}

export interface VoiceToTextInput {
  audioData?: string;
  mimeType?: string;
  sampleRate?: number;
  language?: string;
  simulatedTranscript?: string;
}

export interface VoiceToTextResult {
  transcript: string;
  confidence: number;
  language: string;
  durationSec: number;
}

export async function transcribeVoice(
  data: VoiceToTextInput = {},
  fetchFn: typeof fetch = fetch,
): Promise<VoiceToTextResult> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/voice-to-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Voice to text failed: ${res.status}`);
  return res.json();
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebSearchApiResponse {
  query: string;
  totalResults: number;
  results: WebSearchResultItem[];
}

export async function performWebSearchApi(
  query: string,
  maxResults: number = 5,
  fetchFn: typeof fetch = fetch,
): Promise<WebSearchApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/web-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, maxResults }),
  });
  if (!res.ok) throw new Error(`Web search failed: ${res.status}`);
  return res.json();
}

export interface BrowserAutomationApiResponse {
  action: string;
  status: string;
  pageTitle?: string;
  url?: string;
  domSnapshot?: string;
  logs: string[];
}

export async function runBrowserAutomationApi(
  action: "navigate" | "click" | "input" | "extract" | "screenshot",
  url?: string,
  fetchFn: typeof fetch = fetch,
): Promise<BrowserAutomationApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/browser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, url }),
  });
  if (!res.ok) throw new Error(`Browser automation failed: ${res.status}`);
  return res.json();
}

export interface ComputerUseApiResponse {
  action: string;
  success: boolean;
  output: string;
  sandboxStatus: string;
  auditLog: string;
}

export async function performComputerUseApi(
  action: "terminal_exec" | "mouse_click" | "key_combination" | "app_focus",
  command?: string,
  fetchFn: typeof fetch = fetch,
): Promise<ComputerUseApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/computer-use", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, command }),
  });
  if (!res.ok) throw new Error(`Computer use failed: ${res.status}`);
  return res.json();
}

export interface ImageGenApiResponse {
  prompt: string;
  style: string;
  imageUrl: string;
  svgData?: string;
  description: string;
}

export async function generateImageApi(
  prompt: string,
  style: "diagram" | "ui_mockup" | "flowchart" | "icon" = "diagram",
  fetchFn: typeof fetch = fetch,
): Promise<ImageGenApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/image-gen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, style }),
  });
  if (!res.ok) throw new Error(`Image gen failed: ${res.status}`);
  return res.json();
}

export interface ExcelAnalysisApiResponse {
  filename: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  summaryMetrics: {
    totalRows: number;
    columns: number;
    hasHeaderRow: boolean;
    completenessPercent: number;
    numericColumnsIdentified: number;
  };
  insights: string[];
  formulaAudit: string[];
}

export async function analyzeExcelApi(
  filename: string,
  csvContent?: string,
  fetchFn: typeof fetch = fetch,
): Promise<ExcelAnalysisApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, csvContent }),
  });
  if (!res.ok) throw new Error(`Excel analysis failed: ${res.status}`);
  return res.json();
}

export interface PdfAnalysisApiResponse {
  filename: string;
  pageCount: number;
  sections: Array<{ title: string; content: string }>;
  extractedRequirements: string[];
  summary: string;
}

export async function analyzePdfApi(
  filename: string,
  fetchFn: typeof fetch = fetch,
): Promise<PdfAnalysisApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error(`PDF analysis failed: ${res.status}`);
  return res.json();
}

export interface VisionAnalysisApiResponse {
  filename: string;
  visualSummary: string;
  detectedElements: string[];
  ocrExtractedText?: string;
  layoutHierarchy: string[];
}

export async function analyzeVisionApi(
  filename?: string,
  imageData?: string,
  fetchFn: typeof fetch = fetch,
): Promise<VisionAnalysisApiResponse> {
  const res = await fetchFn("/api/v1/codeitz/capabilities/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, imageData }),
  });
  if (!res.ok) throw new Error(`Vision analysis failed: ${res.status}`);
  return res.json();
}

export function redactSensitiveData(input: string): string {
  if (!input) return "";
  return input
    .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]{15,}/gi, "$1[REDACTED]")
    .replace(/(api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_\-\.]{10,}/gi, "$1[REDACTED]")
    .replace(/(password\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/(ghp_[a-zA-Z0-9]{30,})/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/(sk-[a-zA-Z0-9]{20,})/g, "[REDACTED_API_KEY]");
}

export interface MergeWorktreeInput {
  sourceBranch: string;
  targetBranch?: string;
  commitMessage?: string;
  deleteAfterMerge?: boolean;
}

export interface MergeWorktreeResult {
  success: boolean;
  mergedCommitHash: string;
  sourceBranch: string;
  targetBranch: string;
  message: string;
  filesChanged: string[];
}

export async function mergeWorktreeApi(
  data: MergeWorktreeInput,
  fetchFn: typeof fetch = fetch,
): Promise<MergeWorktreeResult> {
  const res = await fetchFn("/api/v1/codeitz/swe/git/merge-worktree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Merge worktree failed: ${res.status}`);
  return res.json();
}

export function connectSweEventStream(
  onEvent: (type: string, data: unknown) => void,
  EventSourceClass: typeof EventSource = typeof EventSource !== "undefined" ? EventSource : (class {} as any),
): () => void {
  if (typeof EventSourceClass !== "function") return () => {};
  try {
    const source = new EventSourceClass("/api/v1/codeitz/swe/stream");
    const eventTypes = ["task_enqueued", "task_updated", "task_dequeued", "runner_stepped", "parallel_stepped", "log_added"];

    for (const type of eventTypes) {
      source.addEventListener(type, (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data);
          onEvent(type, data);
        } catch {}
      });
    }

    return () => {
      source.close();
    };
  } catch {
    return () => {};
  }
}

// Memory Bank Contracts & API
export interface MemoryEntryItem {
  id: string;
  projectId: string;
  category: "product" | "active" | "pattern" | "tech" | "progress" | "task_fact" | "custom";
  key: string;
  content: string;
  tags: string[];
  importance: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryBankStateResult {
  projectId: string;
  productContext: string;
  activeContext: string;
  systemPatterns: string;
  techContext: string;
  progress: string;
  entries: MemoryEntryItem[];
  stats: {
    totalEntries: number;
    sectionsCount: number;
    sqliteConnected: boolean;
  };
  lastSyncAt: string;
}

export async function fetchMemoryBank(
  projectId: string = "global",
  fetchFn: typeof fetch = fetch,
): Promise<MemoryBankStateResult> {
  const res = await fetchFn(`/api/v1/codeitz/memory?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) throw new Error(`Memory bank fetch failed: ${res.status}`);
  return res.json();
}

export async function updateMemorySectionApi(
  section: "productContext" | "activeContext" | "systemPatterns" | "techContext" | "progress",
  content: string,
  projectId: string = "global",
  fetchFn: typeof fetch = fetch,
): Promise<{ section: string; title: string; markdown: string }> {
  const res = await fetchFn("/api/v1/codeitz/memory/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, content, projectId }),
  });
  if (!res.ok) throw new Error(`Update memory section failed: ${res.status}`);
  return res.json();
}

export async function createMemoryEntryApi(
  data: {
    projectId?: string;
    category?: "product" | "active" | "pattern" | "tech" | "progress" | "task_fact" | "custom";
    key: string;
    content: string;
    tags?: string[];
    importance?: number;
  },
  fetchFn: typeof fetch = fetch,
): Promise<MemoryEntryItem> {
  const res = await fetchFn("/api/v1/codeitz/memory/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Create memory entry failed: ${res.status}`);
  return res.json();
}

export async function deleteMemoryEntryApi(
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ success: boolean; id: string }> {
  const res = await fetchFn(`/api/v1/codeitz/memory/entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete memory entry failed: ${res.status}`);
  return res.json();
}

export async function syncMemoryBankApi(
  projectId: string = "global",
  fetchFn: typeof fetch = fetch,
): Promise<MemoryBankStateResult> {
  const res = await fetchFn("/api/v1/codeitz/memory/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error(`Sync memory bank failed: ${res.status}`);
  return res.json();
}

// Skill Library & Organiser API
export interface ParsedSkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  domain: string;
  tags: string[];
  sourcePath: string;
  workflow: string[];
  verificationCriteria: string[];
  guardrails: string[];
  exclusions: string[];
  markdown: string;
  scripts: string[];
  references: string[];
  valid: boolean;
  validationErrors: string[];
  rating: number;
  usageCount: number;
  updatedAt: string;
}

export interface SkillCatalogResult {
  totalCount: number;
  categories: Array<{ name: string; count: number }>;
  skills: ParsedSkillItem[];
  lastScannedAt: string;
}

export interface SkillRecommendationResult {
  skill: ParsedSkillItem;
  score: number;
  reason: string;
  matchedKeywords: string[];
}

export async function fetchSkillsLibraryApi(
  category?: string,
  fetchFn: typeof fetch = fetch,
): Promise<SkillCatalogResult> {
  const url = category && category !== "all"
    ? `/api/v1/codeitz/skills/library?category=${encodeURIComponent(category)}`
    : "/api/v1/codeitz/skills/library";
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Fetch skills library failed: ${res.status}`);
  return res.json();
}

export async function scanSkillsApi(
  paths?: string[],
  forceReindex: boolean = false,
  fetchFn: typeof fetch = fetch,
): Promise<SkillCatalogResult> {
  const res = await fetchFn("/api/v1/codeitz/skills/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths, forceReindex }),
  });
  if (!res.ok) throw new Error(`Scan skills failed: ${res.status}`);
  return res.json();
}

export async function recommendSkillsApi(
  prompt: string,
  limit: number = 3,
  fetchFn: typeof fetch = fetch,
): Promise<SkillRecommendationResult[]> {
  const res = await fetchFn("/api/v1/codeitz/skills/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, limit }),
  });
  if (!res.ok) throw new Error(`Recommend skills failed: ${res.status}`);
  return res.json();
}

export async function organizeSkillApi(
  data: { name: string; category?: string; tags?: string[]; rating?: number },
  fetchFn: typeof fetch = fetch,
): Promise<ParsedSkillItem> {
  const res = await fetchFn("/api/v1/codeitz/skills/organize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Organize skill failed: ${res.status}`);
  return res.json();
}






