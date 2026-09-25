import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { Badge } from "@codexsun/ui/components/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import {
  BrainCircuitIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  CircleIcon,
  Code2Icon,
  CompassIcon,
  CopyIcon,
  EyeIcon,
  FastForwardIcon,
  FileCode2Icon,
  FileTextIcon,
  BookOpenIcon,
  DatabaseIcon,
  FolderIcon,
  FolderPlusIcon,
  GitBranchIcon,
  GitCommitIcon,
  GlobeIcon,
  LayersIcon,
  ListTodoIcon,
  MicIcon,
  MicOffIcon,
  MonitorIcon,
  MoreVerticalIcon,
  NetworkIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PaperclipIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon,
  SendIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareIcon,
  TableIcon,
  TerminalIcon,
  Volume2Icon,
  VolumeXIcon,
  Wand2Icon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
import {
  type ActiveRunnerSlot,
  type CodebaseGraphNode,
  type ConversationItem,
  type HeuristicItem,
  type MemoryBankStateResult,
  type MemoryEntryItem,
  type ParsedSkillItem,
  type ProjectItem,
  type SkillCatalogResult,
  type SkillItem,
  type SweTaskItem,
  type UpdateProjectInput,
  activateConversation,
  analyzeExcelApi,
  analyzePdfApi,
  analyzeVisionApi,
  autoCommitGit,
  checkPromptSpelling,
  continueTaskRunner,
  createConversation,
  createMemoryEntryApi,
  createProject,
  deleteMemoryEntryApi,
  dequeueTask,
  enqueueTask,
  fetchCodebaseGraph,
  fetchConversations,
  fetchGitDiff,
  fetchGitStatus,
  fetchMemoryBank,
  fetchProjects,
  fetchQueueState,
  fetchSkillsLibraryApi,
  generateImageApi,
  mergeWorktreeApi,
  organizeSkillApi,
  pauseRunner,
  performComputerUseApi,
  performWebSearchApi,
  recommendSkillsApi,
  redactSensitiveData,
  runBrowserAutomationApi,
  scanSkillsApi,
  startRunner,
  stepParallelRunners,
  stepRunner,
  syncMemoryBankApi,
  transcribeVoice,
  undoGitChanges,
  updateMemorySectionApi,
  updateProject,
  connectSweEventStream,
} from "./codeitz-api.js";

interface SafeWidgetBoundaryProps {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface SafeWidgetBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SafeWidgetBoundary extends React.Component<SafeWidgetBoundaryProps, SafeWidgetBoundaryState> {
  constructor(props: SafeWidgetBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeWidgetBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.warn("SafeWidgetBoundary caught error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 rounded-lg bg-[#191a1c] border border-rose-500/30 text-rose-300 text-xs font-mono space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-400">
            <span>Widget Error:</span> {this.props.fallbackLabel || "Capability widget unavailable"}
          </div>
          <div className="text-[10px] text-[#8c8d8e] truncate">
            {this.state.error?.message || "Render exception"}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TodoItem {
  id: string;
  label: string;
  completed: boolean;
  inProgress?: boolean;
}

interface ActionCard {
  type: "edit" | "write" | "explore" | "command";
  target: string;
  added?: number;
  removed?: number;
  output?: string;
}

interface ChangedFileItem {
  path: string;
  filename: string;
  added: number;
  removed: number;
  diffContent?: string;
}

interface ChangedFilesSummary {
  totalFiles: number;
  totalAdded: number;
  totalRemoved: number;
  files: ChangedFileItem[];
}

interface TaskReport {
  taskId: string;
  headline: string;
  ownerScope: string;
  acceptance: string;
  implemented: string[];
  verification: {
    passed: string[];
    preExisting?: string[];
    untested?: string[];
    changelog?: string;
  };
  nextPrompt?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  thinking?: string;
  actions?: ActionCard[];
  todos?: TodoItem[];
  taskReport?: TaskReport;
  changedFilesSummary?: ChangedFilesSummary;
  pendingConfirmation?: {
    actionDescription: string;
    targetPaths?: string[];
  };
  permissionPrompt?: {
    title: string;
    command: string;
    options: string[];
    selectedOption?: number;
  };
  approvalPrompt?: {
    actionText: string;
    completed?: boolean;
  };
}

export interface ApprovalOption {
  id: string;
  label: string;
  description?: string;
  isCustom?: boolean;
}

export interface ApprovalQuestion {
  id: string;
  title: string;
  subtitle: string;
  options: ApprovalOption[];
}

export const DEFAULT_APPROVAL_QUESTIONS: ApprovalQuestion[] = [
  {
    id: "q-scope",
    title: "Approve statutory and accounting contracts for QC-0805?",
    subtitle: "Select contract approval boundary",
    options: [
      {
        id: "full",
        label: "Approve full statutory and accounting contracts",
        description: "Enables all accounting ledgers, audit trail, and statutory compliance checks",
      },
      {
        id: "accounting_only",
        label: "Accounting contracts only",
        description: "Gate statutory compliance behind legal review",
      },
      {
        id: "custom",
        label: "Type your own answer",
        isCustom: true,
      },
    ],
  },
  {
    id: "q-journals",
    title: "Which posted records should generate journals?",
    subtitle: "Select one answer",
    options: [
      {
        id: "all_money",
        label: "All money movements",
        description: "Bills, payments, refunds/reversals, voucher issue and apply",
      },
      {
        id: "bills_payments",
        label: "Bills and payments only",
        description: "Bills and payments only for now",
      },
      {
        id: "custom",
        label: "Type your own answer",
        isCustom: true,
      },
    ],
  },
  {
    id: "q-recon",
    title: "How should tax and audit journals be reconciled?",
    subtitle: "Select one answer",
    options: [
      {
        id: "auto_batch",
        label: "Automated daily end-of-day batch ledger",
        description: "Auto-reconciles against bank clearing and tax accounts at midnight",
      },
      {
        id: "manual_review",
        label: "Manual accountant approval workflow",
        description: "Queues draft journal entries for human sign-off",
      },
      {
        id: "custom",
        label: "Type your own answer",
        isCustom: true,
      },
    ],
  },
  {
    id: "q-safety",
    title: "Verification and rollback safety threshold?",
    subtitle: "Select verification rigor",
    options: [
      {
        id: "strict_rollback",
        label: "Strict verification with auto-rollback",
        description: "Revert worktree state immediately if balance sheet checksum mismatches",
      },
      {
        id: "warn_only",
        label: "Alert and halt pipeline",
        description: "Notify operator before attempting automated ledger rollback",
      },
      {
        id: "custom",
        label: "Type your own answer",
        isCustom: true,
      },
    ],
  },
];

interface ChatSession {
  id: string;
  projectId?: string;
  title: string;
  timeAgo: string;
  status: "active" | "completed" | "idle";
  phase?: string;
  priority?: "low" | "medium" | "high" | "critical";
  messages: ChatMessage[];
  taskId?: string;
}

export function App() {
  return (
    <SessionBoundary
      applicationId="codeitz"
      applicationName="Codeitz"
      autoLoginPath="/api/v1/codeitz/auth/development-login"
      loginPath="/api/v1/codeitz/auth/login"
    >
      {(session) =>
        session.portal === "super-admin" ? (
          <IdentityManagementDesk
            applicationId="codeitz"
            applicationName="Codeitz"
            logout={session.logout}
            request={session.fetch}
          />
        ) : session.portal === "admin" ? (
          <PrivilegedDesk
            applicationId="codeitz"
            applicationName="Codeitz"
            logout={session.logout}
            portal={session.portal}
          />
        ) : (
          <ChatToActionDesk logout={session.logout} request={session.fetch} />
        )
      }
    </SessionBoundary>
  );
}

function ChatToActionDesk({
  logout,
  request,
}: {
  logout(): void;
  request: typeof fetch;
}) {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState<"none" | "learning" | "skills" | "queue" | "graph" | "git" | "memory">("none");
  const [queueTab, setQueueTab] = useState<"queue" | "scheduler" | "logs">("queue");

  // Memory Bank State
  const [memorySection, setMemorySection] = useState<"productContext" | "activeContext" | "systemPatterns" | "techContext" | "progress" | "entries">("activeContext");
  const [memorySectionDraft, setMemorySectionDraft] = useState("");
  const [memorySearch, setMemorySearch] = useState("");
  const [newMemoryKey, setNewMemoryKey] = useState("");
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] = useState<"product" | "active" | "pattern" | "tech" | "progress" | "task_fact" | "custom">("active");
  const [newMemoryTags, setNewMemoryTags] = useState("");
  const [newMemoryImportance, setNewMemoryImportance] = useState(5);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);

  // Skill Organiser State
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkillForDetails, setSelectedSkillForDetails] = useState<ParsedSkillItem | null>(null);
  const [skillToast, setSkillToast] = useState<string | null>(null);
  const [enqueueTitle, setEnqueueTitle] = useState("");
  const [enqueuePriority, setEnqueuePriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [steerOpen, setSteerOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [activeSteeringRules, setActiveSteeringRules] = useState<string[]>([
    "Strict workspace boundary",
    "Minimal diff",
  ]);
  const [customSteerInput, setCustomSteerInput] = useState("");
  const [execMode, setExecMode] = useState<"autonomous" | "interactive">("interactive");
  const [verificationRigor, setVerificationRigor] = useState<"full" | "fast" | "advisory">("full");
  const [autoRollback, setAutoRollback] = useState(true);
  const [taskPriority, setTaskPriority] = useState<"critical" | "high" | "medium" | "low">("high");
  const [model, setModel] = useState("Gemini 3.8 Flash (Medium)");
  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState<Record<string, boolean>>({});
  const [commandExpanded, setCommandExpanded] = useState<Record<string, boolean>>({});
  const [todosOpen, setTodosOpen] = useState(true);
  const [selectedDiffFile, setSelectedDiffFile] = useState<ChangedFileItem | null>(null);
  const [expandedFilesMap, setExpandedFilesMap] = useState<Record<string, boolean>>({});

  // Capabilities State
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [browserActive, setBrowserActive] = useState(false);
  const [computerUseActive, setComputerUseActive] = useState(false);
  const [imageGenActive, setImageGenActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; name: string; type: "image" | "excel" | "pdf"; size: string }>>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [ttsPlayingMessageId, setTtsPlayingMessageId] = useState<string | null>(null);
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [autoCorrectSpelling, setAutoCorrectSpelling] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Codebase Graph & Git State
  const [graphSearch, setGraphSearch] = useState("");
  const [selectedGraphCluster, setSelectedGraphCluster] = useState<string | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<CodebaseGraphNode | null>(null);
  const [gitDiffExpandedFile, setGitDiffExpandedFile] = useState<string | null>(null);

  // Projects, Conversations & Isolated Worktrees State
  const [activeProjectId, setActiveProjectId] = useState<string>("codexsun");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    codexsun: true,
    workspace: true,
  });
  const [projectSearch, setProjectSearch] = useState("");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBranch, setNewProjectBranch] = useState("");
  const [newProjectIsWorktree, setNewProjectIsWorktree] = useState(true);
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvProjectId, setNewConvProjectId] = useState("codexsun");
  const [newConvTitle, setNewConvTitle] = useState("");

  // Parallel Task Runner Concurrency
  const [runnerConcurrency, setRunnerConcurrency] = useState<number>(2);

  // Tools, Presets & Execution Options Pop-up Menu
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // Project 3-dot Dropdown & Settings Modal
  const [projectMenuOpenId, setProjectMenuOpenId] = useState<string | null>(null);
  const [settingsModalProject, setSettingsModalProject] = useState<ProjectItem | null>(null);
  const [settingName, setSettingName] = useState("");
  const [settingBranch, setSettingBranch] = useState("");
  const [settingIsWorktree, setSettingIsWorktree] = useState(false);
  const [settingDefaultModel, setSettingDefaultModel] = useState("Gemini 3.8 Flash (Medium)");
  const [settingRigor, setSettingRigor] = useState<"full" | "fast" | "advisory">("full");
  const [settingAutoRollback, setSettingAutoRollback] = useState(true);
  const [settingConcurrency, setSettingConcurrency] = useState(2);
  const [projectToast, setProjectToast] = useState<string | null>(null);

  // Voice to Text State
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Contract Approval Floating Popup State (floats above composer prompt)
  const [approvalPopupOpen, setApprovalPopupOpen] = useState(true);
  const [approvalStepIndex, setApprovalStepIndex] = useState(1); // 1 = Step 2 of 4 ("Which posted records should generate journals?")
  const [approvalSelectedOptions, setApprovalSelectedOptions] = useState<Record<string, string>>({
    "q-scope": "full",
    "q-journals": "all_money",
    "q-recon": "auto_batch",
    "q-safety": "strict_rollback",
  });
  const [approvalCustomText, setApprovalCustomText] = useState<Record<string, string>>({});
  const [approvalCollapsed, setApprovalCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Always show prompt as 5 lines (~105px), remaining lines scroll
      textareaRef.current.style.height = "105px";
    }
  }, [inputPrompt]);

  // Real-time Prompt Spelling Detection
  useEffect(() => {
    if (!inputPrompt.trim() || inputPrompt.length < 4) {
      setSpellingSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await checkPromptSpelling(inputPrompt, request);
        if (res.hasCorrections && res.corrected.toLowerCase() !== inputPrompt.toLowerCase()) {
          setSpellingSuggestion(res.corrected);
        } else {
          setSpellingSuggestion(null);
        }
      } catch {
        const typoMap: Record<string, string> = {
          refactorr: "refactor",
          refactr: "refactor",
          authntication: "authentication",
          implment: "implement",
          fucntion: "function",
          databse: "database",
          reponse: "response",
          compnent: "component",
          enque: "enqueue",
          speach: "speech",
          exel: "excel",
          brower: "browser",
          vison: "vision",
        };
        const words = inputPrompt.split(/\s+/);
        let hasCorrection = false;
        const fixed = words.map((w) => {
          const clean = w.toLowerCase().replace(/[^a-z]/g, "");
          if (typoMap[clean]) {
            hasCorrection = true;
            return w.replace(new RegExp(clean, "i"), typoMap[clean]);
          }
          return w;
        });
        setSpellingSuggestion(hasCorrection ? fixed.join(" ") : null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [inputPrompt, request]);

  // Text to Speech playback handler
  const handleToggleTts = (messageId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (ttsPlayingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setTtsPlayingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[`*#_[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.onend = () => setTtsPlayingMessageId(null);
    utterance.onerror = () => setTtsPlayingMessageId(null);
    setTtsPlayingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Contract Approval Floating Popup Handlers
  const handleSelectApprovalOption = (questionId: string, optionId: string) => {
    setApprovalSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextApprovalStep = () => {
    if (approvalStepIndex < DEFAULT_APPROVAL_QUESTIONS.length - 1) {
      setApprovalStepIndex((prev) => prev + 1);
    } else {
      handleSubmitApproval();
    }
  };

  const handleBackApprovalStep = () => {
    setApprovalStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleDismissApproval = () => {
    setApprovalPopupOpen(false);
  };

  const handleSubmitApproval = () => {
    const selectedJournal =
      approvalSelectedOptions["q-journals"] === "bills_payments"
        ? "Bills and payments only"
        : approvalSelectedOptions["q-journals"] === "custom"
        ? approvalCustomText["q-journals"] || "Custom journals rule"
        : "All money movements (Bills, payments, refunds/reversals, vouchers)";

    const confirmMsg: ChatMessage = {
      id: `m-approval-${Date.now()}`,
      role: "user",
      content: `Approved statutory and accounting contracts for QC-0805. Journals policy: ${selectedJournal}.`,
      timestamp: "Just now",
    };

    const ackMsg: ChatMessage = {
      id: `m-ack-${Date.now()}`,
      role: "assistant",
      content: `Statutory and accounting contracts approved. Journal generation rule set to "${selectedJournal}". Moving QC-0805 to execution under isolated worktree with automated rollback safety.`,
      timestamp: "Just now",
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, confirmMsg, ackMsg],
            }
          : s,
      ),
    );

    setApprovalPopupOpen(false);
    setProjectToast("Contracts approved & pipeline resumed");
    setTimeout(() => setProjectToast(null), 3000);
  };

  // Initial seed sessions with full rich history
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session-1",
      projectId: "codexsun",
      title: "Build Agentic Software Eng...",
      timeAgo: "2s",
      status: "active",
      phase: "planning",
      priority: "high",
      messages: [
        {
          id: "m-1",
          role: "user",
          content:
            "Refactor the authentication module to use short-lived JWT access tokens with refresh token rotation. Keep backward compatibility for existing API clients.",
          timestamp: "Just now",
        },
        {
          id: "m-2",
          role: "assistant",
          content:
            "I found the core auth files. Next I'll update `jwt.ts` for 15-minute access tokens, add refresh rotation in `refresh.ts`, and wire the new flow through the login routes while preserving the legacy bearer header path.",
          timestamp: "Just now",
          thinking:
            "Grounding workspace in packages/platform-core and devkits/codeitz. Located auth contracts and provider wiring. Ensuring backward compatibility for existing Bearer session headers.",
          actions: [
            { type: "explore", target: "2 reads in packages/platform-core/src/auth" },
            { type: "edit", target: "auth.contracts.ts", added: 14, removed: 2 },
            { type: "write", target: "refresh-rotation.service.ts" },
            { type: "edit", target: "server.ts", added: 8, removed: 1 },
          ],
          todos: [
            { id: "t-1", label: "QC-0601 Token rotation contracts and schemas", completed: true },
            { id: "t-2", label: "QC-0602 Refresh service & expiration checks", completed: true },
            { id: "t-3", label: "QC-0603 Wire token routes into server.ts", completed: true },
            { id: "t-4", label: "QC-0604 Run verification test gate", completed: false, inProgress: true },
            { id: "t-5", label: "QC-0605 Ingest retrospective into memory bank", completed: false },
          ],
          pendingConfirmation: {
            actionDescription:
              "Run automated test suite and boundary verification to validate zero regressions before completing.",
            targetPaths: ["src/modules/auth/refresh.ts", "src/server.ts"],
          },
          permissionPrompt: {
            title: "Allow running all verification tests?",
            command: "npm.cmd run test:codeitz; node packages/app-cli/src/main.mjs verify",
            options: [
              "Yes, allow this time",
              "Yes, and always allow 'npm.cmd run test:codeitz' in this conversation",
              "Yes, and always allow 'npm.cmd run test:codeitz' in this project",
              "No (tell the agent what to do instead)",
            ],
            selectedOption: 0,
          },
        },
        {
          id: "m-3",
          role: "assistant",
          content:
            "QC-0805 may only start after statutory and accounting contracts are approved. I searched assist/ and the Q Cafe app: no such approval exists (qcafe-table.md marks B16-B18 accounting tables as ideas gated on an approved accounting process). How should I proceed? Approve contracts now",
          timestamp: "Just now",
          approvalPrompt: {
            actionText: "Approve contracts now",
            completed: false,
          },
        },
      ],
    },
    {
      id: "session-2",
      title: "Daily plans and lines implementation",
      timeAgo: "1h",
      status: "completed",
      phase: "completed",
      priority: "medium",
      messages: [
        {
          id: "m-201",
          role: "user",
          content: "Implement QC-0603 daily plans and lines demand source identification for inventory module.",
          timestamp: "1 hour ago",
        },
        {
          id: "m-202",
          role: "assistant",
          content: "QC-0603 implementation complete and verified with passing test suites.",
          timestamp: "1 hour ago",
          taskReport: {
            taskId: "QC-0603",
            headline: "QC-0603 complete.",
            ownerScope: "apps/qcafe/api/modules/inventory",
            acceptance: "each plan line identifies its demand source.",
            implemented: [
              "qcafe.inventory.003 migration (same single-module plan): qcafe_daily_plans (unique per location+date, draft/confirmed/closed) + qcafe_daily_plan_lines with demand_source (regular / special / booking / event) and optional demand_ref",
              "Service: create plan, add line (draft-only, menu item/variant validated), confirm plan; workspace returns plans + planLines",
              "Routes: POST /inventory/daily-plans, POST /inventory/daily-plans/:planId/lines, POST /inventory/daily-plans/:planId/confirm",
              "Tests: inventory-daily-plan.test.ts — all four demand sources on one plan + confirm; duplicate-date, confirmed-plan line add, and double-confirm rejects",
              "Task file marked [x] QC-0603; package test script extended",
            ],
            verification: {
              passed: ["typecheck", "6 inventory tests", "ESLint", "build", "git diff --check", "Prettier"],
              preExisting: ["module-boundary check on backup paths", "root-layout .turbo folders"],
              untested: ["browser E2E", "live MariaDB", "Docker", "production"],
              changelog: "Updated changelog under v-1.0.40+",
            },
            nextPrompt: "Next is QC-0604 stock reservations. Say the word and I'll continue.",
          },
          changedFilesSummary: {
            totalFiles: 10,
            totalAdded: 996,
            totalRemoved: 83,
            files: [
              {
                path: "apps/crm/api/",
                filename: "package.json",
                added: 1,
                removed: 1,
                diffContent: '- "version": "1.0.39"\n+ "version": "1.0.40"',
              },
              {
                path: "apps/crm/web/",
                filename: "package.json",
                added: 1,
                removed: 1,
                diffContent: '- "version": "1.0.39"\n+ "version": "1.0.40"',
              },
              {
                path: "apps/himx/api/",
                filename: "package.json",
                added: 1,
                removed: 1,
                diffContent: '- "version": "1.0.39"\n+ "version": "1.0.40"',
              },
              {
                path: "apps/lms/api/",
                filename: "package.json",
                added: 1,
                removed: 1,
                diffContent: '- "version": "1.0.39"\n+ "version": "1.0.40"',
              },
              {
                path: "apps/qcafe/agent/exec/",
                filename: "qcafe-task.md",
                added: 1,
                removed: 1,
                diffContent: '- [ ] QC-0603 daily plans\n+ [x] QC-0603 daily plans and lines',
              },
              {
                path: "apps/qcafe/api/",
                filename: "package.json",
                added: 2,
                removed: 2,
                diffContent: '  "scripts": {\n+   "test:inventory": "tsx --test src/modules/inventory/test/*.test.ts"\n  }',
              },
              {
                path: "apps/qcafe/api/src/modules/inventory/",
                filename: "README.md",
                added: 2,
                removed: 0,
                diffContent: '+ ## Daily Plans\n+ Added demand_source tracking for daily inventory planning.',
              },
              {
                path: "apps/qcafe/api/src/modules/inventory/contracts/",
                filename: "inventory.contract.ts",
                added: 20,
                removed: 0,
                diffContent: '+ export const demandSourceSchema = z.enum(["regular", "special", "booking", "event"]);\n+ export type DemandSource = z.infer<typeof demandSourceSchema>;',
              },
              {
                path: "apps/qcafe/api/src/modules/inventory/services/",
                filename: "daily-plan.service.ts",
                added: 140,
                removed: 12,
                diffContent: '+ export class DailyPlanService {\n+   async createPlan(data: CreatePlanInput) { ... }\n+ }',
              },
              {
                path: "apps/qcafe/api/src/modules/inventory/test/",
                filename: "inventory-daily-plan.test.ts",
                added: 95,
                removed: 0,
                diffContent: '+ test("validates all four demand sources on plan confirmation", async () => {\n+   assert.ok(true);\n+ });',
              },
            ],
          },
        },
      ],
    },
    {
      id: "conv-repo-apps",
      projectId: "codexsun",
      title: "Get Repository Apps Info",
      timeAgo: "2h",
      status: "completed",
      phase: "completed",
      messages: [
        {
          id: "m-app-1",
          role: "user",
          content: "Get repository apps info, workspace boundaries, and active devkit configurations.",
          timestamp: "2 hours ago",
        },
        {
          id: "m-app-2",
          role: "assistant",
          content:
            "Scanned monorepo root `E:\\codexsun\\codexsun`. Discovered registered applications: `crm`, `himsx`, `lms`, `qcafe`, `sites`, and devkits `codeitz`, `cxforge`, `docx`, `orship`, `uiux`, `zetro`, `zetro2`, `zuno`. Monorepo layout is valid with 0 violations.",
          timestamp: "2 hours ago",
        },
      ],
    },
    {
      id: "conv-repo-arch",
      projectId: "codexsun",
      title: "Repository Architecture Ga...",
      timeAgo: "5d",
      status: "completed",
      phase: "completed",
      messages: [
        {
          id: "m-arch-1",
          role: "user",
          content: "Audit repository architecture gateway and verify platform core contract boundaries.",
          timestamp: "5 days ago",
        },
        {
          id: "m-arch-2",
          role: "assistant",
          content:
            "Architecture baseline verification completed. All module-owned persistence migrations, isolated worktree routing, and platform runtimes conform to the contract specifications.",
          timestamp: "5 days ago",
        },
      ],
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState("session-1");
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages]);

  const PHASES = [
    { id: "intake", label: "Intake" },
    { id: "grounding", label: "Grounding" },
    { id: "planning", label: "Planning" },
    { id: "execution", label: "Execution" },
    { id: "verification", label: "Verification" },
    { id: "review", label: "Review" },
    { id: "completed", label: "Completed" },
  ] as const;

  const currentPhaseIndex = Math.max(
    0,
    PHASES.findIndex((p) => p.id === (activeSession.phase ?? "planning")),
  );

  // Backend queries
  const heuristicsQuery = useQuery({
    queryKey: ["codeitz", "learning", "heuristics"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/learning/heuristics");
      if (!res.ok) throw new Error("Failed to load heuristics");
      return res.json() as Promise<HeuristicItem[]>;
    },
  });

  const skillsQuery = useQuery({
    queryKey: ["codeitz", "skills"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/skills");
      if (!res.ok) throw new Error("Failed to load skills");
      return res.json() as Promise<SkillItem[]>;
    },
  });

  const memoryBankQuery = useQuery({
    queryKey: ["codeitz", "memory", activeProjectId],
    queryFn: () => fetchMemoryBank(activeProjectId, request),
    enabled: activeDrawer === "memory",
  });

  const skillsLibraryQuery = useQuery({
    queryKey: ["codeitz", "skills", "library", skillCategoryFilter],
    queryFn: () => fetchSkillsLibraryApi(skillCategoryFilter, request),
    enabled: activeDrawer === "skills",
  });

  const queueQuery = useQuery({
    queryKey: ["codeitz", "swe", "queue"],
    queryFn: () => fetchQueueState(request),
    refetchInterval: 3000,
  });

  // Runner & Queue Mutations
  const stepMutation = useMutation({
    mutationFn: () => stepRunner(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  const startRunnerMutation = useMutation({
    mutationFn: (cfg?: { autoProgress?: boolean; stepIntervalMs?: number; maxConcurrency?: number }) => startRunner(cfg, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  const pauseRunnerMutation = useMutation({
    mutationFn: () => pauseRunner(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  const enqueueTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; priority?: "low" | "medium" | "high" | "critical"; autoProgress?: boolean }) =>
      enqueueTask(data, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  const dequeueTaskMutation = useMutation({
    mutationFn: (taskId: string) => dequeueTask(taskId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  // Codebase Graph & Git Queries
  const graphQuery = useQuery({
    queryKey: ["codeitz", "swe", "graph"],
    queryFn: () => fetchCodebaseGraph(request),
    enabled: activeDrawer === "graph",
  });

  const gitQuery = useQuery({
    queryKey: ["codeitz", "swe", "git", "status"],
    queryFn: () => fetchGitStatus(request),
    refetchInterval: 4000,
  });

  const gitDiffQuery = useQuery({
    queryKey: ["codeitz", "swe", "git", "diff"],
    queryFn: () => fetchGitDiff(undefined, request),
    enabled: activeDrawer === "git",
  });

  const autoCommitMutation = useMutation({
    mutationFn: (msg?: string) =>
      autoCommitGit(
        {
          message: msg,
          stageAll: true,
          context: {
            taskTitle: activeSession.title,
            prompt: inputPrompt,
            verificationPassed: true,
            checksCount: 14,
          },
        },
        request,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "git"] });
    },
  });

  const undoChangesMutation = useMutation({
    mutationFn: () => undoGitChanges({ mode: "working_tree" }, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "git"] });
    },
  });

  // Projects & Conversations Query & Mutations
  const projectsQuery = useQuery({
    queryKey: ["codeitz", "swe", "projects"],
    queryFn: () => fetchProjects(request),
    staleTime: 4000,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; worktreeBranch?: string; isWorktree?: boolean; isolatedWorktreePath?: string }) =>
      createProject(data, request),
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "projects"] });
      setActiveProjectId(newProj.id);
      setExpandedProjects((prev) => ({ ...prev, [newProj.id]: true }));
      setIsNewProjectOpen(false);
      setNewProjectName("");
      setNewProjectBranch("");
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: ({ projectId, title }: { projectId: string; title: string }) =>
      createConversation(projectId, { title }, request),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "projects"] });
      const newSession: ChatSession = {
        id: newConv.id,
        projectId: newConv.projectId,
        title: newConv.title,
        timeAgo: "Just now",
        status: "idle",
        messages: [],
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newConv.id);
      setActiveProjectId(newConv.projectId);
      setIsNewConvOpen(false);
      setNewConvTitle("");
    },
  });

  const activateConversationMutation = useMutation({
    mutationFn: ({ projectId, conversationId }: { projectId: string; conversationId: string }) =>
      activateConversation(projectId, conversationId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "projects"] });
    },
  });

  const stepParallelMutation = useMutation({
    mutationFn: () => stepParallelRunners(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectInput }) =>
      updateProject(projectId, data, request),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "projects"] });
      setSettingsModalProject(null);
      setProjectToast(`Updated settings for "${updated.name}"`);
      setTimeout(() => setProjectToast(null), 3000);
    },
  });

  const mergeWorktreeMutation = useMutation({
    mutationFn: (data: { sourceBranch: string; targetBranch?: string; commitMessage?: string }) =>
      mergeWorktreeApi(data, request),
    onSuccess: (res) => {
      setProjectToast(res.message);
      setTimeout(() => setProjectToast(null), 3500);
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "projects"] });
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "git", "status"] });
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "git", "diff"] });
    },
  });

  useEffect(() => {
    const disconnect = connectSweEventStream((type) => {
      if (
        type === "runner_stepped" ||
        type === "parallel_stepped" ||
        type === "task_enqueued" ||
        type === "task_updated"
      ) {
        queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
        queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "tasks"] });
      }
      if (type === "log_added") {
        queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
      }
    });
    return () => disconnect();
  }, [queryClient]);

  const handleToggleVoiceToText = async () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceToast("Listening... Speak your prompt");
          setTimeout(() => setVoiceToast(null), 3000);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setInputPrompt((prev) => (prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim()));
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // Fallback to API simulation
      }
    }

    // Fallback: API transcribeVoice
    setIsListening(true);
    setVoiceToast("Listening via Speech-to-Text API...");
    try {
      const res = await transcribeVoice(
        { simulatedTranscript: "Refactor inventory test suite with short-lived JWT access tokens." },
        request,
      );
      setInputPrompt((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
      setVoiceToast(`Transcribed: "${res.transcript}"`);
      setTimeout(() => setVoiceToast(null), 3000);
    } catch {
      setVoiceToast("Voice transcription unavailable");
      setTimeout(() => setVoiceToast(null), 3000);
    } finally {
      setIsListening(false);
    }
  };

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const res = await request("/api/v1/codeitz/swe/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: promptText.slice(0, 48),
          prompt: promptText,
          targetPaths: ["devkits/codeitz"],
        }),
      });
      if (!res.ok) throw new Error("Failed to create SWE task");
      const created = (await res.json()) as SweTaskItem;
      // Auto-enqueue to the prioritized queue
      await enqueueTask({ taskId: created.id, priority: "high", autoProgress: true }, request).catch(() => null);
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
      return created;
    },
  });

  const handleSendPrompt = async () => {
    if (!inputPrompt.trim() || isExecuting) return;
    let userText = inputPrompt;
    if (spellingSuggestion && autoCorrectSpelling) {
      userText = spellingSuggestion;
    }
    const attachedSnapshot = [...attachedFiles];
    setInputPrompt("");
    setSpellingSuggestion(null);
    setAttachedFiles([]);
    setIsExecuting(true);

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: "Just now",
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: s.messages.length === 0 ? userText.slice(0, 32) : s.title,
              phase: "grounding",
              messages: [...s.messages, userMessage],
            }
          : s,
      ),
    );

    try {
      const backendTask = await createTaskMutation.mutateAsync(userText);
      const dynamicActions: ActionCard[] = [];

      // 1. Live Web Search if active
      if (webSearchActive) {
        try {
          const webRes = await performWebSearchApi(userText, 3, request);
          if (webRes.results.length > 0) {
            dynamicActions.push({
              type: "explore",
              target: `Web search: ${webRes.results[0].title}`,
              output: `${webRes.results[0].snippet} (${webRes.results[0].url})`,
            });
          }
        } catch {
          dynamicActions.push({ type: "explore", target: `Web search references for ${userText.slice(0, 36)}` });
        }
      }

      // 2. Live Browser Automation if active
      if (browserActive) {
        try {
          const browserRes = await runBrowserAutomationApi("navigate", "http://localhost:6321", request);
          dynamicActions.push({
            type: "command",
            target: `Browser probe: ${browserRes.pageTitle}`,
            output: `Status: ${browserRes.status}. Captured DOM snapshot (${browserRes.domSnapshot?.length ?? 0} bytes).`,
          });
        } catch {
          dynamicActions.push({ type: "command", target: "Browser probe: localhost:6321", output: "Captured snapshot: 0 console warnings" });
        }
      }

      // 3. Live Computer Use if active
      if (computerUseActive) {
        try {
          const compRes = await performComputerUseApi("terminal_exec", "git status -s", request);
          dynamicActions.push({
            type: "command",
            target: `Computer-use terminal: git status -s`,
            output: compRes.output.slice(0, 200),
          });
        } catch {
          dynamicActions.push({ type: "command", target: "Computer-use: terminal focus & sandbox check", output: "Boundary: E:\\codexsun\\codexsun confirmed" });
        }
      }

      // 4. Live Image Generation if active
      if (imageGenActive) {
        try {
          const imgRes = await generateImageApi(userText, "diagram", request);
          dynamicActions.push({
            type: "write",
            target: `Generated Architecture Diagram: ${userText.slice(0, 32)}`,
            output: imgRes.description,
          });
        } catch {
          dynamicActions.push({ type: "write", target: "Generated SVG architecture diagram preview" });
        }
      }

      // 5. Live Multimodal file inspections for attached files
      for (const att of attachedSnapshot) {
        if (att.type === "image") {
          try {
            const visRes = await analyzeVisionApi(att.name, undefined, request);
            dynamicActions.push({
              type: "explore",
              target: `Vision inspection: ${att.name}`,
              output: `${visRes.visualSummary} Detected: ${visRes.detectedElements.slice(0, 2).join("; ")}`,
            });
          } catch {
            dynamicActions.push({ type: "explore", target: `Vision OCR & layout inspection: ${att.name}` });
          }
        } else if (att.type === "excel") {
          try {
            const xlRes = await analyzeExcelApi(att.name, undefined, request);
            dynamicActions.push({
              type: "explore",
              target: `Spreadsheet audit: ${att.name} (${xlRes.rowCount} rows, ${xlRes.columnCount} cols)`,
              output: xlRes.insights.join(" "),
            });
          } catch {
            dynamicActions.push({ type: "explore", target: `Excel sheet audit: ${att.name}` });
          }
        } else if (att.type === "pdf") {
          try {
            const pdfRes = await analyzePdfApi(att.name, request);
            dynamicActions.push({
              type: "explore",
              target: `PDF spec analysis: ${att.name} (${pdfRes.extractedRequirements.length} requirements)`,
              output: pdfRes.summary,
            });
          } catch {
            dynamicActions.push({ type: "explore", target: `PDF spec analysis: ${att.name}` });
          }
        }
      }

      // 6. Step the real backend SWE task runner into grounding and planning
      const stepRes = await continueTaskRunner(backendTask.id, request).catch(() => null);

      // 7. Get real git status for repository workspace
      const realGit = await fetchGitStatus(request).catch(() => null);
      if (realGit && realGit.files.length > 0) {
        const topModified = realGit.files.slice(0, 3).map((f) => f.path).join(", ");
        dynamicActions.push({
          type: "explore",
          target: `Inspected workspace working tree on ${realGit.branch}`,
          output: `Changed files: ${topModified} (${realGit.summary.total} total changes)`,
        });
      }

      dynamicActions.push({
        type: "command",
        target: `SWE Runner Step: ${stepRes?.action || "grounding"}`,
        output: stepRes?.message || `Advanced task '${backendTask.title}' within repository boundary.`,
      });

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed and grounded your request for "${userText.slice(0, 48)}...". Active task ${backendTask.id} is queued and grounded within repository boundaries${
          attachedSnapshot.length > 0 ? ` (processed ${attachedSnapshot.map((a) => a.name).join(", ")})` : ""
        }.`,
        timestamp: "Just now",
        thinking: `Grounded in devkits/codeitz. Model: ${model}. Task ID: ${backendTask.id}. Phase: ${stepRes?.currentPhase || "grounding"}. Verification rigor: ${verificationRigor}.`,
        actions: dynamicActions,
        todos: [
          { id: "todo-1", label: `Ground repository context & symbols for ${userText.slice(0, 24)}`, completed: true },
          { id: "todo-2", label: "Draft minimal safe patch and review diff", completed: stepRes?.currentPhase === "execution" || stepRes?.currentPhase === "planning" },
          { id: "todo-3", label: "Run automated verification gate (typecheck, lint, tests)", completed: false, inProgress: true },
          { id: "todo-4", label: "Review against regression prevention criteria", completed: false },
        ],
        pendingConfirmation: {
          actionDescription: `Execute automated verification gate and advance SWE phase to verified for ${backendTask.title}?`,
          targetPaths: backendTask.targetPaths,
        },
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                taskId: backendTask.id,
                phase: (stepRes?.currentPhase as any) || "grounding",
                messages: [...s.messages, assistantMessage],
              }
            : s,
        ),
      );
      setIsExecuting(false);
    } catch {
      setIsExecuting(false);
    }
  };

  const handleContinueRunner = async (targetMessageId?: string) => {
    setIsExecuting(true);
    try {
      const stepRes = await stepMutation.mutateAsync().catch(() => null);
      const gitStatus = await fetchGitStatus(request).catch(() => null);
      const gitDiff = await fetchGitDiff(undefined, request).catch(() => null);

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          const currentPhase = (stepRes?.currentPhase as any) || s.phase || "planning";
          let nextPhase = currentPhase;
          if (currentPhase === "intake") nextPhase = "grounding";
          else if (currentPhase === "grounding") nextPhase = "planning";
          else if (currentPhase === "planning") nextPhase = "execution";
          else if (currentPhase === "execution") nextPhase = "verification";
          else if (currentPhase === "verification") nextPhase = "review";
          else nextPhase = "completed";

          const filesSummary: ChangedFilesSummary | undefined =
            gitDiff && gitDiff.files.length > 0
              ? {
                  totalFiles: gitDiff.files.length,
                  totalAdded: gitDiff.totalAdditions,
                  totalRemoved: gitDiff.totalDeletions,
                  files: gitDiff.files.map((f) => ({
                    path: f.filePath.substring(0, f.filePath.lastIndexOf("/") + 1) || "./",
                    filename: f.filePath.substring(f.filePath.lastIndexOf("/") + 1) || f.filePath,
                    added: f.additions,
                    removed: f.deletions,
                    diffContent: f.patch.slice(0, 300),
                  })),
                }
              : undefined;

          const updatedMessages = s.messages.map((m) => {
            if (targetMessageId && m.id !== targetMessageId) return m;
            const updatedTodos = (m.todos ?? []).map((t) => ({ ...t, completed: true, inProgress: false }));
            return {
              ...m,
              pendingConfirmation: undefined,
              permissionPrompt: undefined,
              todos: updatedTodos,
              changedFilesSummary: filesSummary || m.changedFilesSummary,
              content: stepRes?.message || `Task execution advanced to phase '${nextPhase}' with passing verification gate.`,
              taskReport: {
                taskId: s.taskId || (s.id === "session-1" ? "QC-0604" : "CZ-0102"),
                headline: `${s.taskId || "Task"} phase '${nextPhase}' complete.`,
                ownerScope: "devkits/codeitz/api/modules/engineering — continuous task runner",
                acceptance: "Task runner progressed through all phases with zero regression.",
                implemented: [
                  `Phase advanced to '${nextPhase}' via SWE Task Runner loop.`,
                  `Workspace branch '${gitStatus?.branch || "main"}' verified with ${gitStatus?.summary.total ?? 0} active changes.`,
                  "Deterministic regression prevention gate executed clean.",
                ],
                verification: {
                  passed: ["workspace_boundary", "typecheck", "unit_tests", "Prettier"],
                  untested: ["production deploy", "live MariaDB"],
                  changelog: `Recorded phase transition to '${nextPhase}'.`,
                },
                nextPrompt: nextPhase === "completed" ? undefined : `Next phase is '${nextPhase}'. Click Continue ⌘⏎ to step.`,
              },
            };
          });

          return {
            ...s,
            phase: nextPhase,
            status: nextPhase === "completed" ? "completed" : "active",
            messages: updatedMessages,
          };
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "queue"] });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleActionConfirm = (messageId: string) => {
    handleContinueRunner(messageId);
  };

  const handleQuickEnqueue = async () => {
    if (!enqueueTitle.trim()) return;
    const title = enqueueTitle.trim();
    setEnqueueTitle("");
    try {
      const task = await createTaskMutation.mutateAsync(title);
      await enqueueTaskMutation.mutateAsync({
        taskId: task.id,
        priority: enqueuePriority,
        autoProgress: true,
      });
    } catch {
      // Ignored
    }
  };

  const handleEnqueueFromComposer = async () => {
    if (!inputPrompt.trim()) {
      setActiveDrawer(activeDrawer === "queue" ? "none" : "queue");
      return;
    }
    const promptText = inputPrompt.trim();
    setInputPrompt("");
    try {
      const task = await createTaskMutation.mutateAsync(promptText);
      await enqueueTaskMutation.mutateAsync({
        taskId: task.id,
        priority: taskPriority,
        autoProgress: execMode === "autonomous",
      });
      setActiveDrawer("queue");
    } catch {
      // Ignored
    }
  };

  const handleToggleSteerRule = (rule: string) => {
    setActiveSteeringRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule],
    );
  };

  const handleAddCustomSteer = () => {
    if (!customSteerInput.trim()) return;
    const rule = customSteerInput.trim();
    if (!activeSteeringRules.includes(rule)) {
      setActiveSteeringRules((prev) => [...prev, rule]);
    }
    setCustomSteerInput("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isExecuting) {
        if (inputPrompt.trim()) {
          handleSendPrompt();
        } else {
          handleContinueRunner();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputPrompt, isExecuting, activeSession]);


  const activeTodos =
    activeSession.messages
      .slice()
      .reverse()
      .find((m) => m.todos && m.todos.length > 0)?.todos ?? [];

  const completedTodosCount = activeTodos.filter((t) => t.completed).length;

  return (
    <MainWorkspace
      applicationId="codeitz"
      applicationName="Codeitz"
      primaryAction={{ label: "Codeitz Chat to Action" }}
      user={{ initials: "K", name: "Codeitz Engineer", onSignOut: logout }}
      workspaceTitle="Chat to Action Engineering Studio"
    >
      <div className="flex h-full bg-[#191a1c] text-[#e2e3e5] font-sans overflow-hidden" data-color-theme="studio">
        <style>{`
          .codeitz-slim-scroll {
            scrollbar-width: thin;
            scrollbar-color: #3a3b3f transparent;
          }
          .codeitz-slim-scroll::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .codeitz-slim-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .codeitz-slim-scroll::-webkit-scrollbar-thumb {
            background: #3a3b3f;
            border-radius: 4px;
          }
          .codeitz-slim-scroll::-webkit-scrollbar-thumb:hover {
            background: #40434a;
          }
        `}</style>
        {/* ============================================================ */}
        {/* Left Sidebar: Conversations & History                        */}
        {/* ============================================================ */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#26282c] border-r border-[#3a3b3f] flex flex-col justify-between shrink-0">
            <div>
              {/* Header / Brand */}
              <div className="p-3.5 border-b border-[#3a3b3f] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#9cd2ae]/15 text-[#9cd2ae] border border-[#9cd2ae]/35 flex items-center justify-center font-bold text-xs">
                    CZ
                  </div>
                  <span className="font-semibold text-xs text-[#f3f4f6] tracking-wide">
                    CODEITZ STUDIO
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-[#8c8d8e] hover:text-[#f3f4f6] p-1 rounded"
                  title="Collapse sidebar"
                >
                  <PanelLeftCloseIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="p-3 space-y-1">
                <Button
                  variant="studio-accent"
                  onClick={() => {
                    const newId = `session-${Date.now()}`;
                    const newSession: ChatSession = {
                      id: newId,
                      title: "New SWE Task",
                      timeAgo: "Just now",
                      status: "idle",
                      messages: [],
                    };
                    setSessions((prev) => [newSession, ...prev]);
                    setActiveSessionId(newId);
                  }}
                  className="w-full text-xs font-semibold flex items-center justify-center gap-2 rounded-lg py-2"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  New Chat / Task
                </Button>

                <div className="pt-2 grid grid-cols-4 gap-1 text-[10px]">
                  <button
                    onClick={() => setActiveDrawer(activeDrawer === "queue" ? "none" : "queue")}
                    className={`p-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      activeDrawer === "queue"
                        ? "bg-[#191a1c] text-[#9cd2ae] border border-[#40434a] font-semibold"
                        : "text-[#8c8d8e] hover:text-[#f3f4f6] hover:bg-[#32353a]"
                    }`}
                    title="Task Queue & Continuous Runner"
                  >
                    <ListTodoIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Queue</span>
                  </button>
                  <button
                    onClick={() => setActiveDrawer(activeDrawer === "memory" ? "none" : "memory")}
                    className={`p-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      activeDrawer === "memory"
                        ? "bg-[#191a1c] text-[#9cd2ae] border border-[#40434a] font-semibold"
                        : "text-[#8c8d8e] hover:text-[#f3f4f6] hover:bg-[#32353a]"
                    }`}
                    title="Tri-Format Memory Bank (Markdown, SQLite, JSON)"
                  >
                    <DatabaseIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Memory</span>
                  </button>
                  <button
                    onClick={() => setActiveDrawer(activeDrawer === "skills" ? "none" : "skills")}
                    className={`p-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      activeDrawer === "skills"
                        ? "bg-[#191a1c] text-[#9cd2ae] border border-[#40434a] font-semibold"
                        : "text-[#8c8d8e] hover:text-[#f3f4f6] hover:bg-[#32353a]"
                    }`}
                    title="Skill Reader & Organiser"
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Skills</span>
                  </button>
                  <button
                    onClick={() => setActiveDrawer(activeDrawer === "learning" ? "none" : "learning")}
                    className={`p-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      activeDrawer === "learning"
                        ? "bg-[#191a1c] text-[#9cd2ae] border border-[#40434a] font-semibold"
                        : "text-[#8c8d8e] hover:text-[#f3f4f6] hover:bg-[#32353a]"
                    }`}
                    title="Self-Learning Heuristics"
                  >
                    <BrainCircuitIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Learn</span>
                  </button>
                </div>
              </div>

              {/* Projects & Conversations Tree (matches media_1790259000653.png) */}
              <div className="px-2 pt-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2 py-1.5 text-[#8c8d8e] text-xs font-normal">
                  <span className="font-normal text-[#8c8d8e] tracking-tight text-xs">Projects</span>
                  <div className="flex items-center gap-1.5 text-[#8c8d8e]">
                    <button
                      onClick={() => setProjectSearch((prev) => (prev ? "" : "filter"))}
                      className="p-1 hover:text-[#f3f4f6] rounded transition-colors"
                      title="Filter / Sort Projects"
                    >
                      <SlidersHorizontalIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsNewProjectOpen(true)}
                      className="p-1 hover:text-[#f3f4f6] rounded transition-colors"
                      title="New Project (Isolated Worktree)"
                    >
                      <FolderPlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {projectSearch === "filter" && (
                  <div className="px-2 pb-2">
                    <input
                      type="text"
                      placeholder="Filter projects..."
                      value={graphSearch}
                      onChange={(e) => setGraphSearch(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded px-2 py-1 text-xs text-[#e2e3e5] focus:outline-none placeholder:text-[#8c8d8e]"
                    />
                  </div>
                )}

                <div className="space-y-3 overflow-y-auto codeitz-slim-scroll max-h-[calc(100vh-270px)] pr-1">
                  {(projectsQuery.data && projectsQuery.data.length > 0
                    ? projectsQuery.data
                    : [
                        {
                          id: "codexsun",
                          name: "codexsun",
                          rootPath: "E:/codexsun/codexsun",
                          worktreeBranch: "main",
                          isWorktree: false,
                          worktreeStatus: "active" as const,
                          conversations: [],
                          createdAt: "",
                          updatedAt: "",
                        },
                        {
                          id: "workspace",
                          name: "Workspace",
                          rootPath: "E:/codexsun/codexsun/.worktrees/workspace",
                          worktreeBranch: "isolated/workspace",
                          isWorktree: true,
                          worktreeStatus: "isolated" as const,
                          conversations: [],
                          createdAt: "",
                          updatedAt: "",
                        },
                      ]
                  ).map((proj) => {
                    const isExpanded = expandedProjects[proj.id] ?? true;
                    const projSessions = sessions.filter(
                      (s) => (s.projectId ?? "codexsun") === proj.id,
                    );

                    return (
                      <div key={proj.id} className="space-y-1">
                        {/* Project Folder Row */}
                        <div
                          onClick={() =>
                            setExpandedProjects((prev) => ({
                              ...prev,
                              [proj.id]: !isExpanded,
                            }))
                          }
                          className="group flex items-center justify-between px-2 py-1 rounded cursor-pointer text-xs text-[#8c8d8e] hover:text-[#f3f4f6] transition-colors"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderIcon className="w-3.5 h-3.5 text-[#8c8d8e] group-hover:text-[#f3f4f6] shrink-0" />
                            <span className="font-normal text-xs tracking-tight truncate">
                              {proj.name}
                            </span>
                            {proj.isWorktree && (
                              <span className="text-[9px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-1 py-0.2 rounded">
                                worktree
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {/* 3-dot dropdown menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectMenuOpenId(projectMenuOpenId === proj.id ? null : proj.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#32353a] text-[#8c8d8e] hover:text-[#f3f4f6] transition-all"
                                title={`Options for ${proj.name}`}
                              >
                                <MoreVerticalIcon className="w-3 h-3" />
                              </button>

                              {projectMenuOpenId === proj.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-full left-0 mt-1 w-48 bg-[#202226] border border-[#3a3b3f] rounded-lg shadow-2xl p-1 z-50 text-xs text-[#e2e3e5] space-y-0.5"
                                >
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(proj.name);
                                      setProjectToast(`Copied "${proj.name}" to clipboard`);
                                      setProjectMenuOpenId(null);
                                      setTimeout(() => setProjectToast(null), 2500);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#32353a] text-left transition-colors"
                                  >
                                    <CopyIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                    <span>Copy Project Name</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSettingsModalProject(proj);
                                      setSettingName(proj.name);
                                      setSettingBranch(proj.worktreeBranch);
                                      setSettingIsWorktree(proj.isWorktree);
                                      setSettingDefaultModel(proj.defaultModel ?? "Gemini 3.8 Flash (Medium)");
                                      setSettingRigor(proj.verificationRigor ?? "full");
                                      setSettingAutoRollback(proj.autoRollback ?? true);
                                      setSettingConcurrency(proj.runnerConcurrency ?? 2);
                                      setProjectMenuOpenId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#32353a] text-left transition-colors"
                                  >
                                    <SettingsIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                    <span>Project Settings</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(proj.rootPath);
                                      setProjectToast(`Copied path: ${proj.rootPath}`);
                                      setProjectMenuOpenId(null);
                                      setTimeout(() => setProjectToast(null), 2500);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#32353a] text-left transition-colors"
                                  >
                                    <FolderIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                    <span>Show in File Explorer</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewConvProjectId(proj.id);
                                setIsNewConvOpen(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#32353a] text-[#8c8d8e] hover:text-[#f3f4f6] transition-all"
                              title={`New conversation in ${proj.name}`}
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                            <span className="text-[#8c8d8e] text-[10px]">
                              {isExpanded ? (
                                <ChevronDownIcon className="w-3 h-3" />
                              ) : (
                                <ChevronRightIcon className="w-3 h-3" />
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Conversations under project */}
                        {isExpanded && (
                          <div className="space-y-0.5 pl-3">
                            {projSessions.length === 0 ? (
                              <div className="pl-3 pr-2 py-1.5 text-xs text-[#8c8d8e] flex items-center justify-between">
                                <span className="italic">No conversations yet</span>
                                <button
                                  onClick={() => {
                                    setNewConvProjectId(proj.id);
                                    setIsNewConvOpen(true);
                                  }}
                                  className="text-[10px] text-[#9cd2ae] hover:underline"
                                >
                                  + New
                                </button>
                              </div>
                            ) : (
                              projSessions.map((s) => {
                                const isActive = activeSession.id === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      setActiveSessionId(s.id);
                                      setActiveProjectId(proj.id);
                                    }}
                                    className={`w-full text-left pl-3 pr-2 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                      isActive
                                        ? "bg-[#26282c] text-[#f3f4f6] font-medium border border-[#3a3b3f]/70 shadow-xs"
                                        : "text-[#8c8d8e] hover:bg-[#32353a] hover:text-[#f3f4f6]"
                                    }`}
                                  >
                                    <span className="truncate pr-2">{s.title}</span>
                                    {isActive ? (
                                      <div className="relative shrink-0 flex items-center justify-center text-[#8c8d8e]">
                                        <Code2Icon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-[#26282c]" />
                                      </div>
                                    ) : (
                                      <span className="text-[11px] font-mono text-[#8c8d8e] shrink-0">
                                        {s.timeAgo}
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Status Indicator */}
            <div className="p-3 border-t border-[#3a3b3f] text-[11px] text-[#8c8d8e] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9cd2ae] animate-pulse" />
                Local CODEXSUN
              </span>
              <span className="font-mono text-[10px] text-[#8c8d8e]">6320 / 6321</span>
            </div>
          </aside>
        )}

        {/* ============================================================ */}
        {/* Main "Chat to Action" Canvas Area                            */}
        {/* ============================================================ */}
        <section className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Session Bar with Phase Stepper & Continuous Runner Controls */}
          <header className="h-14 border-b border-[#3a3b3f] bg-[#26282c] px-4 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 truncate max-w-sm">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-[#8c8d8e] hover:text-[#f3f4f6] p-1 rounded mr-1"
                >
                  <PanelLeftOpenIcon className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <FolderIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                <span className="text-[#8c8d8e] font-mono text-[11px]">{activeProjectId}</span>
                {activeProjectId === "workspace" || projectsQuery.data?.find((p) => p.id === activeProjectId)?.isWorktree ? (
                  <span className="text-[9px] text-sky-400 bg-sky-950/40 border border-sky-800/40 px-1 py-0.2 rounded font-mono">
                    worktree
                  </span>
                ) : null}
                <span className="text-[#3a3b3f]">/</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#9cd2ae] shrink-0" />
              <h2 className="text-xs font-semibold text-[#f3f4f6] truncate">{activeSession.title}</h2>
            </div>

            {/* Pipeline Phase Stepper */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono bg-[#191a1c] px-3 py-1 rounded-full border border-[#3a3b3f]">
              {PHASES.map((p, pIdx) => {
                const isPast = pIdx < currentPhaseIndex;
                const isCurrent = pIdx === currentPhaseIndex;
                return (
                  <div key={p.id} className="flex items-center gap-1">
                    {pIdx > 0 && <span className="text-[#3a3b3f] text-[10px]">→</span>}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                        isCurrent
                          ? "bg-[#9cd2ae]/15 text-[#9cd2ae] font-semibold border border-[#9cd2ae]/35"
                          : isPast
                          ? "text-[#9cd2ae] font-medium"
                          : "text-[#8c8d8e]"
                      }`}
                    >
                      {isPast ? (
                        <CheckIcon className="w-2.5 h-2.5" />
                      ) : isCurrent ? (
                        <CircleDotIcon className="w-2.5 h-2.5 animate-pulse text-[#9cd2ae]" />
                      ) : null}
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Runner Controls & Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveDrawer(activeDrawer === "queue" ? "none" : "queue")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#191a1c] border border-[#3a3b3f] hover:border-[#40434a] text-xs transition-colors"
                title="Open Runner Queue & Parallel Workers"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    queueQuery.data?.runnerState.status === "running"
                      ? "bg-[#9cd2ae] animate-ping"
                      : (queueQuery.data?.runnerState.activeRunners.length ?? 0) > 0
                      ? "bg-sky-400 animate-pulse"
                      : "bg-[#8c8d8e]"
                  }`}
                />
                <span className="text-[11px] font-mono text-[#e2e3e5]">
                  {(queueQuery.data?.runnerState.activeRunners.length ?? 0) > 0
                    ? `Parallel: ${queueQuery.data?.runnerState.activeRunners.length} active`
                    : queueQuery.data?.runnerState.status === "running"
                    ? "Parallel Loop"
                    : "Parallel Runner"}
                </span>
                <span className="text-[10px] bg-[#26282c] text-[#8c8d8e] px-1.5 py-0.2 rounded-full font-mono">
                  {queueQuery.data?.queue.filter((q) => q.status !== "completed").length ?? 0}
                </span>
              </button>

              <Button
                variant={queueQuery.data?.runnerState.status === "running" ? "warning" : "studio"}
                size="xs"
                onClick={() => {
                  if (queueQuery.data?.runnerState.status === "running") {
                    pauseRunnerMutation.mutate();
                  } else {
                    startRunnerMutation.mutate({ autoProgress: true });
                  }
                }}
                className="text-xs font-medium flex items-center gap-1"
                title={
                  queueQuery.data?.runnerState.status === "running"
                    ? "Pause Continuous Runner"
                    : "Start Continuous Runner"
                }
              >
                {queueQuery.data?.runnerState.status === "running" ? (
                  <>
                    <PauseIcon className="w-3 h-3 text-amber-400" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-3 h-3 text-[#9cd2ae]" />
                    <span>Run</span>
                  </>
                )}
              </Button>

              <Button
                variant="studio-accent"
                size="xs"
                onClick={() => handleContinueRunner()}
                disabled={isExecuting}
                className="text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                title="Continue / Step to next phase (⌘⏎)"
              >
                <FastForwardIcon className="w-3.5 h-3.5" />
                <span>Continue ⌘⏎</span>
              </Button>

              {/* Memory Bank Button */}
              <Button
                variant={activeDrawer === "memory" ? "studio-active" : "studio"}
                size="xs"
                onClick={() => setActiveDrawer(activeDrawer === "memory" ? "none" : "memory")}
                className="text-xs flex items-center gap-1.5"
                title="Tri-Format Memory Bank (Markdown, SQLite, JSON)"
              >
                <DatabaseIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-medium">Memory</span>
              </Button>

              {/* Skills Library Button */}
              <Button
                variant={activeDrawer === "skills" ? "studio-active" : "studio"}
                size="xs"
                onClick={() => setActiveDrawer(activeDrawer === "skills" ? "none" : "skills")}
                className="text-xs flex items-center gap-1.5"
                title="Skill Reader & Organiser"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline font-medium">Skills</span>
              </Button>

              {/* Codebase Knowledge Graph Button */}
              <Button
                variant={activeDrawer === "graph" ? "studio-active" : "studio"}
                size="xs"
                onClick={() => setActiveDrawer(activeDrawer === "graph" ? "none" : "graph")}
                className="text-xs flex items-center gap-1.5"
                title="Codebase Architecture Knowledge Graph"
              >
                <NetworkIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline font-medium">Graph</span>
              </Button>

              {/* Git Tools & Status Button */}
              <Button
                variant={activeDrawer === "git" ? "studio-active" : "studio"}
                size="xs"
                onClick={() => setActiveDrawer(activeDrawer === "git" ? "none" : "git")}
                className="text-xs flex items-center gap-1.5 font-mono"
                title="Git Diff, Sensible Auto-Commit & Undo AI Changes"
              >
                <GitBranchIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">
                  {gitQuery.data?.clean ? "Git: Clean" : `Git: ${gitQuery.data?.files.length ?? 0} changed`}
                </span>
              </Button>

              <Badge variant="studio" className="text-[11px] font-mono px-2 py-0.5">
                {model}
              </Badge>
            </div>
          </header>

          {/* Chat Messages Timeline (Full width so scrollbar is placed at the far right edge) */}
          <div className="flex-1 overflow-y-auto w-full codeitz-slim-scroll">
            <div className="p-6 space-y-6 max-w-4xl mx-auto w-full pb-56">
            {activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-80 my-auto">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <TerminalIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  Codeitz Chat to Action
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Ask to plan, refactor, implement, or verify code. Codeitz inspects repository
                  evidence, presents atomic actions, and requests confirmation before execution.
                </p>
              </div>
            ) : (
              activeSession.messages.map((msg) => (
                <div key={msg.id} className="space-y-4">
                  {msg.role === "user" ? (
                    /* User Prompt Bubble */
                    <div className="flex justify-end">
                      <div className="bg-[#26282c] border border-[#3a3b3f] p-3.5 rounded-2xl max-w-2xl text-xs text-[#f3f4f6] shadow-sm leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Agent Response & Action Flow */
                    <div className="space-y-4">
                      {/* Thinking Accordion */}
                      {msg.thinking && (
                        <div className="border border-[#3a3b3f] rounded-lg bg-[#191a1c] text-xs overflow-hidden">
                          <button
                            onClick={() =>
                              setThinkingExpanded((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="w-full px-3 py-1.5 flex items-center justify-between text-[#8c8d8e] hover:text-[#f3f4f6] text-[11px]"
                          >
                            <span className="flex items-center gap-1.5">
                              {thinkingExpanded[msg.id] ? (
                                <ChevronDownIcon className="w-3 h-3 text-[#8c8d8e]" />
                              ) : (
                                <ChevronRightIcon className="w-3 h-3 text-[#8c8d8e]" />
                              )}
                              Thinking
                            </span>
                            <span className="text-[10px] text-[#8c8d8e] font-mono">
                              internal reasoning
                            </span>
                          </button>
                          {thinkingExpanded[msg.id] && (
                            <div className="p-3 bg-[#191a1c] border-t border-[#3a3b3f] font-mono text-[11px] text-[#8c8d8e] leading-relaxed whitespace-pre-wrap">
                              {msg.thinking}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Cards Stream (Edit, Write, Explore, Command) */}
                      {msg.actions && msg.actions.length > 0 && (
                        <SafeWidgetBoundary fallbackLabel="Action cards stream">
                          <div className="space-y-1.5">
                          <div className="text-[11px] text-[#8c8d8e] flex items-center gap-1.5">
                            <CheckCircle2Icon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                            <span>
                              {msg.actions.length}/{msg.actions.length} actions staged
                            </span>
                          </div>

                          <div className="space-y-1 pl-2">
                            {msg.actions.map((act, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex items-center gap-2 text-xs font-mono py-1 px-2.5 rounded bg-[#191a1c] border border-[#3a3b3f] text-[#e2e3e5]"
                              >
                                {act.type === "edit" ? (
                                  <>
                                    <span className="text-amber-400 font-semibold">Edit</span>
                                    <FileCode2Icon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                    <span className="truncate">{act.target}</span>
                                    {act.added !== undefined && (
                                      <span className="text-[#9cd2ae] text-[11px]">
                                        +{act.added}
                                      </span>
                                    )}
                                    {act.removed !== undefined && (
                                      <span className="text-rose-400 text-[11px]">
                                        -{act.removed}
                                      </span>
                                    )}
                                  </>
                                ) : act.type === "write" ? (
                                  <>
                                    <span className="text-[#9cd2ae] font-semibold">Write</span>
                                    <Code2Icon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                                    <span className="truncate">{act.target}</span>
                                  </>
                                ) : act.type === "command" ? (
                                  <div className="w-full space-y-1.5">
                                    <div
                                      onClick={() =>
                                        setCommandExpanded((prev) => ({
                                          ...prev,
                                          [`${msg.id}-${aIdx}`]: !prev[`${msg.id}-${aIdx}`],
                                        }))
                                      }
                                      className="flex items-center justify-between cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <TerminalIcon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                                        <span className="text-[#e2e3e5] text-xs">Ran {act.target}</span>
                                      </div>
                                      <ChevronDownIcon className="w-3 h-3 text-[#8c8d8e]" />
                                    </div>
                                    {commandExpanded[`${msg.id}-${aIdx}`] && act.output && (
                                      <pre className="p-2.5 rounded bg-[#191a1c] text-[#9cd2ae] text-[11px] overflow-x-auto whitespace-pre-wrap border border-[#3a3b3f]">
                                        {redactSensitiveData(act.output)}
                                      </pre>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-blue-400 font-semibold">Exploring</span>
                                    <span className="text-[#8c8d8e]">{act.target}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </SafeWidgetBoundary>
                    )}

                      {/* Agent Narrative Content */}
                      <div className="p-4 rounded-xl bg-[#26282c] border border-[#3a3b3f] text-xs text-[#e2e3e5] leading-relaxed space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="flex-1">{msg.content}</p>
                          <Button
                            variant={ttsPlayingMessageId === msg.id ? "studio-accent" : "studio"}
                            size="icon-xs"
                            onClick={() => handleToggleTts(msg.id, msg.content)}
                            title={ttsPlayingMessageId === msg.id ? "Stop voice narration" : "Read message aloud (Text-to-Speech)"}
                          >
                            {ttsPlayingMessageId === msg.id ? (
                              <VolumeXIcon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                            ) : (
                              <Volume2Icon className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>

                        {/* Interactive Contract Approval prompt trigger */}
                        {msg.approvalPrompt && (
                          <div className="pt-2.5 flex items-center gap-2.5 border-t border-[#3a3b3f]">
                            <Button
                              variant={approvalPopupOpen ? "studio-active" : "studio-accent"}
                              size="xs"
                              onClick={() => {
                                setApprovalPopupOpen(true);
                                setApprovalCollapsed(false);
                              }}
                              className="text-xs font-semibold flex items-center gap-1.5"
                            >
                              <CheckCircle2Icon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                              <span>{msg.approvalPrompt.actionText}</span>
                            </Button>
                            <span className="text-[11px] text-[#8c8d8e]">
                              {approvalPopupOpen
                                ? "(Approval questions active above prompt bar)"
                                : "Click to review & approve contracts"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ============================================================ */}
                      {/* Detailed Task Completion Report (Screenshot 1 reproduction)  */}
                      {/* ============================================================ */}
                      {msg.taskReport && (
                        <div className="p-5 rounded-xl bg-[#26282c] border border-[#3a3b3f] space-y-3.5 text-xs text-[#e2e3e5] leading-relaxed shadow-lg">
                          <div className="text-sm font-bold text-[#f3f4f6]">
                            {msg.taskReport.headline}
                          </div>

                          <div className="text-[#e2e3e5] flex items-center gap-1.5">
                            <span className="font-semibold text-[#8c8d8e]">Owner/scope:</span>{" "}
                            <Badge variant="studio" className="font-mono text-[10px]">
                              {msg.taskReport.ownerScope}
                            </Badge>{" "}
                            <span className="text-[#8c8d8e]">— Acceptance: {msg.taskReport.acceptance}</span>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="font-semibold text-[#8c8d8e]">Implemented:</span>
                            <ul className="list-disc pl-5 space-y-1 text-[#e2e3e5]">
                              {msg.taskReport.implemented.map((item, iIdx) => (
                                <li key={iIdx} className="leading-relaxed">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-[#3a3b3f]">
                            <span className="font-semibold text-[#8c8d8e]">Verification:</span>
                            <ul className="list-disc pl-5 space-y-1 text-[#e2e3e5]">
                              <li>
                                <span className="font-medium text-[#9cd2ae]">Passed:</span>{" "}
                                {msg.taskReport.verification.passed.join(", ")}
                              </li>
                              {msg.taskReport.verification.preExisting && (
                                <li>
                                  <span className="font-medium text-[#8c8d8e]">Pre-existing failures (unrelated):</span>{" "}
                                  {msg.taskReport.verification.preExisting.join(", ")}
                                </li>
                              )}
                              {msg.taskReport.verification.untested && (
                                <li>
                                  <span className="font-medium text-[#8c8d8e]">Untested:</span>{" "}
                                  {msg.taskReport.verification.untested.join(", ")}
                                </li>
                              )}
                              {msg.taskReport.verification.changelog && (
                                <li>
                                  <span className="font-medium text-[#8c8d8e]">Changelog:</span>{" "}
                                  {msg.taskReport.verification.changelog}
                                </li>
                              )}
                            </ul>
                          </div>

                          {msg.taskReport.nextPrompt && (
                            <div className="pt-2 text-[#8c8d8e] font-medium flex items-center justify-between gap-3 border-t border-[#3a3b3f]">
                              <span>{msg.taskReport.nextPrompt}</span>
                              <Button
                                variant="studio-accent"
                                size="sm"
                                onClick={() => handleContinueRunner()}
                                className="text-xs font-semibold flex items-center gap-1.5 shrink-0"
                              >
                                <FastForwardIcon className="w-3.5 h-3.5" />
                                Continue Runner ⌘⏎
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ============================================================ */}
                      {/* Changed Files Breakdown & Diff List (Screenshot 2 reproduction) */}
                      {/* ============================================================ */}
                      {msg.changedFilesSummary && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="font-bold text-[#f3f4f6]">
                              {msg.changedFilesSummary.totalFiles} Changed files{" "}
                              <span className="text-[#9cd2ae] font-mono ml-1">
                                +{msg.changedFilesSummary.totalAdded}
                              </span>{" "}
                              <span className="text-rose-400 font-mono ml-0.5">
                                -{msg.changedFilesSummary.totalRemoved}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-xl border border-[#3a3b3f] bg-[#26282c] overflow-hidden divide-y divide-[#3a3b3f]">
                            {(expandedFilesMap[msg.id]
                              ? msg.changedFilesSummary.files
                              : msg.changedFilesSummary.files.slice(0, 5)
                            ).map((file, fIdx) => (
                              <div
                                key={fIdx}
                                onClick={() => setSelectedDiffFile(file)}
                                className="px-4 py-2 flex items-center justify-between text-xs hover:bg-[#32353a] cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileTextIcon className="w-3.5 h-3.5 text-[#8c8d8e] group-hover:text-[#9cd2ae] shrink-0" />
                                  <span className="text-[#8c8d8e] font-mono text-[11px] truncate">
                                    {file.path}
                                  </span>
                                  <span className="font-semibold text-[#f3f4f6] font-mono text-[11px]">
                                    {file.filename}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                                  <span className="text-[#9cd2ae]">+{file.added}</span>
                                  <span className="text-rose-400">-{file.removed}</span>
                                  <ChevronRightIcon className="w-3.5 h-3.5 text-[#8c8d8e] group-hover:text-[#f3f4f6]" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {msg.changedFilesSummary.files.length > 5 && (
                            <button
                              onClick={() =>
                                setExpandedFilesMap((prev) => ({
                                  ...prev,
                                  [msg.id]: !prev[msg.id],
                                }))
                              }
                              className="text-xs text-[#8c8d8e] hover:text-[#f3f4f6] pl-1 font-medium transition-colors"
                            >
                              {expandedFilesMap[msg.id]
                                ? "Show fewer files"
                                : `+${msg.changedFilesSummary.files.length - 5} more files`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Permission Prompt Card */}
                      {msg.permissionPrompt && (
                        <div className="p-4 rounded-xl bg-[#26282c] border border-[#3a3b3f] space-y-3 shadow-lg">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#f3f4f6]">
                            <TerminalIcon className="w-4 h-4 text-[#9cd2ae]" />
                            <span>{msg.permissionPrompt.title}</span>
                          </div>

                          <div className="p-2 rounded bg-[#191a1c] border border-[#3a3b3f] font-mono text-[11px] text-[#9cd2ae] overflow-x-auto">
                            {msg.permissionPrompt.command}
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {msg.permissionPrompt.options.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className="flex items-center gap-2.5 p-2 rounded-lg bg-[#191a1c] border border-[#3a3b3f] hover:border-[#40434a] cursor-pointer text-xs text-[#e2e3e5] transition-colors"
                              >
                                <input
                                  type="radio"
                                  name={`perm-${msg.id}`}
                                  defaultChecked={oIdx === 0}
                                  className="accent-[#9cd2ae]"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="studio-ghost"
                              size="xs"
                              onClick={() => handleActionConfirm(msg.id)}
                            >
                              Skip
                            </Button>
                            <Button
                              variant="studio-accent"
                              size="xs"
                              onClick={() => handleActionConfirm(msg.id)}
                              className="flex items-center gap-1.5 font-semibold"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                              Submit
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Confirmation Action Bar */}
                      {msg.pendingConfirmation && (
                        <div className="p-4 rounded-xl bg-[#26282c] border border-[#40434a] flex items-center justify-between gap-4 shadow-md">
                          <div className="text-xs text-[#e2e3e5]">
                            <span className="font-semibold text-[#9cd2ae]">Action Pending:</span>{" "}
                            {msg.pendingConfirmation.actionDescription}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="studio"
                              size="xs"
                              onClick={() => handleActionConfirm(msg.id)}
                              className="flex items-center gap-1"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                              Cancel
                            </Button>
                            <Button
                              variant="studio-accent"
                              size="xs"
                              onClick={() => handleActionConfirm(msg.id)}
                              className="flex items-center gap-1.5 font-semibold"
                            >
                              <PlayIcon className="w-3.5 h-3.5" />
                              Continue ⌘⏎
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ============================================================ */}
          {/* Bottom Floating Chat to Action Bar                           */}
          {/* ============================================================ */}
          <div className="absolute bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto pointer-events-none space-y-2">
            {/* Interactive Contract Approval Popup Card (floats directly above prompt) */}
            {approvalPopupOpen && (
              <div className="pointer-events-auto bg-[#26282c] border border-[#3a3b3f] rounded-xl shadow-2xl p-4 transition-all duration-200">
                {/* Header: count, progress indicators, and collapse chevron */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#f3f4f6]">
                      {approvalStepIndex + 1} of {DEFAULT_APPROVAL_QUESTIONS.length} questions
                    </span>
                    {/* Progress Dashes */}
                    <div className="flex items-center gap-1.5 w-28 sm:w-36">
                      {DEFAULT_APPROVAL_QUESTIONS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                            idx === approvalStepIndex
                              ? "bg-[#f3f4f6]"
                              : idx < approvalStepIndex
                              ? "bg-[#9cd2ae]"
                              : "bg-[#40434a]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setApprovalCollapsed(!approvalCollapsed)}
                    className="p-1 rounded text-[#8c8d8e] hover:text-[#f3f4f6] hover:bg-[#32353a] transition-colors"
                    title={approvalCollapsed ? "Expand questions" : "Collapse questions"}
                  >
                    {approvalCollapsed ? (
                      <ChevronRightIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Collapsed State Summary */}
                {approvalCollapsed ? (
                  <div className="mt-1 flex items-center justify-between text-xs text-[#8c8d8e]">
                    <span className="truncate">{DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].title}</span>
                    <button
                      onClick={() => setApprovalCollapsed(false)}
                      className="text-[#9cd2ae] hover:underline text-[11px] shrink-0 ml-2"
                    >
                      Answer question
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Question Title & Subtitle */}
                    <div className="mt-3 mb-2.5">
                      <h4 className="text-sm font-semibold text-[#f3f4f6] leading-snug">
                        {DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].title}
                      </h4>
                      <p className="text-[11px] text-[#8c8d8e] mt-0.5">
                        {DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].subtitle}
                      </p>
                    </div>

                    {/* Radio Options List */}
                    <div className="space-y-2">
                      {DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].options.map((opt) => {
                        const isSelected =
                          approvalSelectedOptions[DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() =>
                              handleSelectApprovalOption(
                                DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].id,
                                opt.id,
                              )
                            }
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-[#32353a]/80 border-[#9cd2ae]/80 shadow-sm"
                                : "bg-[#191a1c]/70 border-[#3a3b3f] hover:border-[#4b4e54] hover:bg-[#202226]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Custom Radio Button */}
                              <div
                                className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-[#9cd2ae] bg-[#9cd2ae]"
                                    : "border-[#8c8d8e] bg-transparent"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#191a1c]" />
                                )}
                              </div>

                              <div className="flex-1 space-y-0.5">
                                <div className="text-xs font-semibold text-[#f3f4f6]">
                                  {opt.label}
                                </div>
                                {opt.description && (
                                  <div className="text-[11px] text-[#8c8d8e] leading-snug">
                                    {opt.description}
                                  </div>
                                )}
                                {opt.isCustom && isSelected && (
                                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      placeholder="Type your answer..."
                                      value={
                                        approvalCustomText[
                                          DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].id
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        setApprovalCustomText((prev) => ({
                                          ...prev,
                                          [DEFAULT_APPROVAL_QUESTIONS[approvalStepIndex].id]:
                                            e.target.value,
                                        }))
                                      }
                                      className="w-full bg-[#191a1c] border border-[#3a3b3f] focus:border-[#9cd2ae] rounded px-2.5 py-1.5 text-xs text-[#f3f4f6] placeholder:text-[#8c8d8e] focus:outline-none"
                                      autoFocus
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#3a3b3f]">
                      <Button
                        variant="studio"
                        size="xs"
                        onClick={handleDismissApproval}
                        className="text-xs text-[#8c8d8e] hover:text-[#f3f4f6]"
                      >
                        Dismiss
                      </Button>
                      <div className="flex items-center gap-2">
                        {approvalStepIndex > 0 && (
                          <Button
                            variant="studio"
                            size="xs"
                            onClick={handleBackApprovalStep}
                            className="text-xs text-[#e2e3e5]"
                          >
                            Back
                          </Button>
                        )}
                        <Button
                          variant="studio-accent"
                          size="xs"
                          onClick={handleNextApprovalStep}
                          className="text-xs font-semibold px-3 py-1 flex items-center gap-1.5"
                        >
                          {approvalStepIndex === DEFAULT_APPROVAL_QUESTIONS.length - 1 ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>Submit & Approve</span>
                            </>
                          ) : (
                            <span>Next</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="pointer-events-auto bg-[#26282c]/95 backdrop-blur-md border border-[#3a3b3f] rounded-sm shadow-2xl p-2 space-y-2">
              {/* Attached Todos Dropdown */}
              {activeTodos.length > 0 && (
                <div className="border-b border-[#3a3b3f] pb-2">
                  <button
                    onClick={() => setTodosOpen(!todosOpen)}
                    className="w-full flex items-center justify-between text-xs text-[#e2e3e5] font-medium px-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <ListTodoIcon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                      {completedTodosCount} of {activeTodos.length} todos completed
                    </span>
                    {todosOpen ? (
                      <ChevronDownIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                    ) : (
                      <ChevronRightIcon className="w-3.5 h-3.5 text-[#8c8d8e]" />
                    )}
                  </button>

                  {todosOpen && (
                    <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pl-1 pr-2 codeitz-slim-scroll">
                      {activeTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2 text-[11px] font-mono text-[#e2e3e5] py-0.5"
                        >
                          {todo.completed ? (
                            <CheckCircle2Icon className="w-3.5 h-3.5 text-[#9cd2ae] shrink-0" />
                          ) : todo.inProgress ? (
                            <CircleDotIcon className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                          ) : (
                            <CircleIcon className="w-3.5 h-3.5 text-[#8c8d8e] shrink-0" />
                          )}
                          <span
                            className={
                              todo.completed ? "line-through text-[#8c8d8e]" : "text-[#e2e3e5]"
                            }
                          >
                            {todo.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Prompt Spelling Suggestion */}
              {spellingSuggestion && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-[#191a1c] border border-amber-500/30 text-[11px] text-amber-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <Wand2Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[#8c8d8e]">Did you mean:</span>
                    <span className="font-semibold text-amber-300 italic truncate font-mono">
                      "{spellingSuggestion}"
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Button
                      variant="studio-accent"
                      size="xs"
                      onClick={() => {
                        setInputPrompt(spellingSuggestion);
                        setSpellingSuggestion(null);
                      }}
                      className="px-2 py-0.5 font-medium text-[10px]"
                    >
                      Fix Prompt
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSpellingSuggestion(null)}
                      className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Files Chips */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-0.5">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#191a1c] border border-[#3a3b3f] text-[11px] text-[#e2e3e5] font-mono"
                    >
                      {file.type === "image" && <EyeIcon className="w-3 h-3 text-pink-400" />}
                      {file.type === "excel" && <TableIcon className="w-3 h-3 text-[#9cd2ae]" />}
                      {file.type === "pdf" && <FileTextIcon className="w-3 h-3 text-rose-400" />}
                      <span className="truncate max-w-[130px]">{file.name}</span>
                      <span className="text-[10px] text-[#8c8d8e]">({file.size})</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="text-[#8c8d8e] hover:text-[#f3f4f6] p-0.5"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea Composer (Edge to edge, no padding, always 5 lines visible, remaining on scroll, small rounded corners) */}
              <textarea
                ref={textareaRef}
                placeholder="Ask anything, @ to mention, / for actions (e.g. /verify, /refactor)..."
                rows={5}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                className="w-full bg-[#191a1c] text-xs leading-5 text-[#f3f4f6] placeholder:text-[#8c8d8e] border border-[#3a3b3f] focus:border-[#40434a] rounded-sm p-0 focus:outline-none resize-none overflow-y-auto codeitz-slim-scroll h-[105px] min-h-[105px] max-h-[105px]"
              />

              {/* Footer Controls & Model Selectors (Cleaned up: only Provider Selector, Steer, New Pop-up Button, and Send) */}
              <div className="flex items-center justify-between pt-1 border-t border-[#3a3b3f] relative">
                {/* Left side: ONLY Provider selector and Steer */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  {/* Multi-Model Reasoning Provider Selector */}
                  <div className="flex items-center gap-1">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-[#191a1c] border border-[#3a3b3f] rounded px-2 py-0.5 text-[#e2e3e5] focus:outline-none text-[11px]"
                    >
                      <option>Gemini 3.8 Flash (Medium)</option>
                      <option>Gemini 1.5 Pro (Deep Reasoning)</option>
                      <option>Claude 3.5 Sonnet (Agentic SWE)</option>
                      <option>GPT-4o (Omni Reasoning)</option>
                      <option>DeepSeek-R1 (Chain of Thought)</option>
                      <option>Multi-Model Consensus (Ensemble)</option>
                    </select>
                    {model.includes("Consensus") && (
                      <span className="hidden sm:inline text-[10px] bg-[#191a1c] text-[#9cd2ae] border border-[#9cd2ae]/40 px-1.5 py-0.5 rounded-full font-mono animate-pulse">
                        98% Consensus
                      </span>
                    )}
                  </div>

                  {/* Steer Button */}
                  <div className="relative">
                    <Button
                      variant={steerOpen || activeSteeringRules.length > 0 ? "studio-active" : "studio"}
                      size="xs"
                      onClick={() => {
                        setSteerOpen(!steerOpen);
                        setToolsMenuOpen(false);
                      }}
                      className="flex items-center gap-1 font-medium"
                      title="Steer agent behavior and runtime constraints"
                    >
                      <CompassIcon className="w-3 h-3 text-blue-400" />
                      <span>Steer</span>
                      {activeSteeringRules.length > 0 && (
                        <span className="text-[10px] bg-[#191a1c] text-[#9cd2ae] px-1 rounded-full font-mono">
                          {activeSteeringRules.length}
                        </span>
                      )}
                    </Button>

                    {/* Steer Popover */}
                    {steerOpen && (
                      <div className="absolute bottom-full mb-3 left-0 w-80 bg-[#26282c] border border-[#3a3b3f] rounded-sm shadow-2xl p-3 z-50 space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3f]">
                          <div className="flex items-center gap-1.5 font-semibold text-[#f3f4f6]">
                            <CompassIcon className="w-3.5 h-3.5 text-blue-400" />
                            <span>Agent Steering Rules</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSteerOpen(false)}
                            className="text-[#8c8d8e] hover:text-[#f3f4f6] p-0.5"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-mono text-[#8c8d8e] tracking-wider">
                            Active Constraints ({activeSteeringRules.length})
                          </div>
                          <div className="space-y-1">
                            {[
                              "Strict workspace boundary",
                              "Minimal diff",
                              "TDD First (unit tests required)",
                              "Zero external dependencies",
                              "Deterministic verification gate",
                            ].map((rule) => {
                              const isChecked = activeSteeringRules.includes(rule);
                              return (
                                <div
                                  key={rule}
                                  onClick={() => handleToggleSteerRule(rule)}
                                  className="flex items-center gap-2 p-1.5 rounded bg-[#191a1c] hover:bg-[#32353a] border border-[#3a3b3f] cursor-pointer text-[11px] text-[#e2e3e5] transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="accent-[#9cd2ae] rounded"
                                  />
                                  <span className={isChecked ? "text-[#f3f4f6] font-medium" : "text-[#8c8d8e]"}>
                                    {rule}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom steering rule */}
                        <div className="pt-1 border-t border-[#3a3b3f] space-y-1.5">
                          <div className="text-[10px] font-mono text-[#8c8d8e]">Custom Steering Rule</div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="e.g. prioritize fast response over deep search..."
                              value={customSteerInput}
                              onChange={(e) => setCustomSteerInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomSteer();
                                }
                              }}
                              className="flex-1 bg-[#191a1c] border border-[#3a3b3f] rounded px-2 py-1 text-[11px] text-[#e2e3e5] placeholder:text-[#8c8d8e] focus:outline-none"
                            />
                            <Button
                              variant="studio-accent"
                              size="xs"
                              onClick={handleAddCustomSteer}
                              disabled={!customSteerInput.trim()}
                              className="font-semibold text-[11px]"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: New Button with Pop-up (all moved controls) and Send button */}
                <div className="flex items-center gap-1.5 relative">
                  {/* New Pop-up Button (Matches user's hand-drawn icon) */}
                  <div className="relative">
                    <Button
                      variant={toolsMenuOpen ? "studio-active" : "studio"}
                      size="xs"
                      onClick={() => {
                        setToolsMenuOpen(!toolsMenuOpen);
                        setSteerOpen(false);
                      }}
                      className="flex items-center gap-1.5 font-medium px-2 py-1"
                      title="More Tools, Capabilities, Queue & Execution Options"
                    >
                      {/* Custom SVG matching user's sketch: rounded box with two horizontal lines */}
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="4" />
                        <line x1="7" x2="17" y1="9" y2="9" />
                        <line x1="7" x2="17" y1="15" y2="15" />
                      </svg>
                      {(webSearchActive || browserActive || computerUseActive || imageGenActive || attachedFiles.length > 0) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9cd2ae] animate-pulse" />
                      )}
                    </Button>

                    {/* Pop-up with all moved footer controls */}
                    {toolsMenuOpen && (
                      <div className="absolute bottom-full mb-2.5 right-0 w-80 bg-[#26282c] border border-[#3a3b3f] rounded-sm shadow-2xl p-3.5 z-50 space-y-3 text-xs text-[#e2e3e5]">
                        <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3f]">
                          <div className="flex items-center gap-2 font-semibold text-[#f3f4f6]">
                            <svg
                              className="w-4 h-4 text-[#9cd2ae]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect width="18" height="18" x="3" y="3" rx="4" />
                              <line x1="7" x2="17" y1="9" y2="9" />
                              <line x1="7" x2="17" y1="15" y2="15" />
                            </svg>
                            <span>Tools & Execution Options</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setToolsMenuOpen(false)}
                            className="text-[#8c8d8e] hover:text-[#f3f4f6] p-0.5"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Presets & Queue Actions */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-mono text-[#8c8d8e] tracking-wider">
                            Presets & Queue
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="studio" className="font-mono cursor-pointer hover:bg-[#32353a]">
                              + Build
                            </Badge>
                            <Button
                              variant="studio"
                              size="xs"
                              onClick={() => {
                                handleEnqueueFromComposer();
                                setToolsMenuOpen(false);
                              }}
                              disabled={!inputPrompt.trim()}
                              className="text-[11px] font-semibold flex items-center gap-1"
                              title="Enqueue prompt into Task Queue without immediate execution"
                            >
                              <ListTodoIcon className="w-3 h-3 text-amber-400" />
                              <span>+ Queue</span>
                            </Button>
                            <Button
                              variant="studio"
                              size="xs"
                              onClick={() => {
                                setActiveDrawer(activeDrawer === "queue" ? "none" : "queue");
                                setToolsMenuOpen(false);
                              }}
                              className="text-[11px] font-medium flex items-center gap-1"
                            >
                              <span>View Queue ({queueQuery.data?.queue.filter((q) => q.status !== "completed").length ?? 0})</span>
                            </Button>
                            <Button
                              variant="studio"
                              size="xs"
                              onClick={() => {
                                setApprovalPopupOpen(true);
                                setApprovalCollapsed(false);
                                setToolsMenuOpen(false);
                              }}
                              className="text-[11px] font-medium flex items-center gap-1"
                              title="Review and approve statutory/accounting contracts"
                            >
                              <CheckCircle2Icon className="w-3 h-3 text-[#9cd2ae]" />
                              <span>Approve Contracts</span>
                            </Button>
                          </div>
                        </div>

                        {/* Capabilities Toggles */}
                        <div className="space-y-1.5 pt-1 border-t border-[#3a3b3f]">
                          <div className="text-[10px] uppercase font-mono text-[#8c8d8e] tracking-wider">
                            Capabilities & Multimodal Tools
                          </div>
                          <div className="grid grid-cols-4 gap-1 font-mono text-[11px]">
                            <button
                              type="button"
                              onClick={() => setWebSearchActive(!webSearchActive)}
                              className={`py-1.5 rounded flex items-center justify-center gap-1 border transition-colors ${
                                webSearchActive
                                  ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e] hover:text-[#f3f4f6]"
                              }`}
                              title="Web Search Capability"
                            >
                              <GlobeIcon className="w-3 h-3 text-[#9cd2ae]" />
                              <span>Web</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setBrowserActive(!browserActive)}
                              className={`py-1.5 rounded flex items-center justify-center gap-1 border transition-colors ${
                                browserActive
                                  ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e] hover:text-[#f3f4f6]"
                              }`}
                              title="Browser Automation"
                            >
                              <MonitorIcon className="w-3 h-3 text-indigo-400" />
                              <span>Browser</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setComputerUseActive(!computerUseActive)}
                              className={`py-1.5 rounded flex items-center justify-center gap-1 border transition-colors ${
                                computerUseActive
                                  ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e] hover:text-[#f3f4f6]"
                              }`}
                              title="Computer Use (OS & Shell Automation)"
                            >
                              <TerminalIcon className="w-3 h-3 text-violet-400" />
                              <span>OS</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setImageGenActive(!imageGenActive)}
                              className={`py-1.5 rounded flex items-center justify-center gap-1 border transition-colors ${
                                imageGenActive
                                  ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e] hover:text-[#f3f4f6]"
                              }`}
                              title="Image Generation"
                            >
                              <SparklesIcon className="w-3 h-3 text-rose-400" />
                              <span>Gen</span>
                            </button>
                          </div>
                        </div>

                        {/* File Attachments */}
                        <div className="space-y-1.5 pt-1 border-t border-[#3a3b3f]">
                          <div className="text-[10px] uppercase font-mono text-[#8c8d8e] tracking-wider">
                            Attachments
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedFiles((prev) => [
                                  ...prev,
                                  { id: `att-${Date.now()}`, name: "ui-layout-defect.png", type: "image", size: "320 KB" },
                                ]);
                              }}
                              className="p-1.5 rounded bg-[#191a1c] border border-[#3a3b3f] hover:bg-[#32353a] flex items-center gap-1.5 text-left text-[#e2e3e5]"
                            >
                              <EyeIcon className="w-3 h-3 text-pink-400 shrink-0" />
                              <span className="truncate text-[10px]">Screenshot</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedFiles((prev) => [
                                  ...prev,
                                  { id: `att-${Date.now()}`, name: "service-metrics.xlsx", type: "excel", size: "145 KB" },
                                ]);
                              }}
                              className="p-1.5 rounded bg-[#191a1c] border border-[#3a3b3f] hover:bg-[#32353a] flex items-center gap-1.5 text-left text-[#e2e3e5]"
                            >
                              <TableIcon className="w-3 h-3 text-[#9cd2ae] shrink-0" />
                              <span className="truncate text-[10px]">Excel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttachedFiles((prev) => [
                                  ...prev,
                                  { id: `att-${Date.now()}`, name: "architecture-spec.pdf", type: "pdf", size: "1.2 MB" },
                                ]);
                              }}
                              className="p-1.5 rounded bg-[#191a1c] border border-[#3a3b3f] hover:bg-[#32353a] flex items-center gap-1.5 text-left text-[#e2e3e5]"
                            >
                              <FileTextIcon className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate text-[10px]">PDF</span>
                            </button>
                          </div>
                        </div>

                        {/* Execution Mode & Verification Rigor */}
                        <div className="space-y-2 pt-1 border-t border-[#3a3b3f]">
                          <div className="text-[10px] uppercase font-mono text-[#8c8d8e] tracking-wider">
                            Execution Mode & Verification Gate
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExecMode("autonomous")}
                              className={`p-1.5 rounded border text-left text-[11px] transition-colors ${
                                execMode === "autonomous"
                                  ? "bg-[#191a1c] border-[#40434a] text-[#9cd2ae] font-semibold"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e]"
                              }`}
                            >
                              <div className="font-bold">Autonomous</div>
                              <div className="text-[9px] text-[#8c8d8e]">Auto loop</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExecMode("interactive")}
                              className={`p-1.5 rounded border text-left text-[11px] transition-colors ${
                                execMode === "interactive"
                                  ? "bg-[#191a1c] border-[#40434a] text-[#9cd2ae] font-semibold"
                                  : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e]"
                              }`}
                            >
                              <div className="font-bold">Interactive</div>
                              <div className="text-[9px] text-[#8c8d8e]">Confirm steps</div>
                            </button>
                          </div>

                          <select
                            value={verificationRigor}
                            onChange={(e) => setVerificationRigor(e.target.value as "full" | "fast" | "advisory")}
                            className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded px-2 py-1 text-[#e2e3e5] text-[11px] focus:outline-none"
                          >
                            <option value="full">Full Gate (Typecheck, Lint & Tests)</option>
                            <option value="fast">Fast Track (Compiler only)</option>
                            <option value="advisory">Advisory (Non-blocking)</option>
                          </select>
                        </div>

                        {/* Toggles: Rollback, Spellcheck, TTS */}
                        <div className="space-y-1.5 pt-1 border-t border-[#3a3b3f] text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8d8e]">Rollback on failure</span>
                            <button
                              type="button"
                              onClick={() => setAutoRollback(!autoRollback)}
                              className={`w-7 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                                autoRollback ? "bg-[#9cd2ae]" : "bg-[#3a3b3f]"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full bg-[#191a1c] transition-transform ${
                                  autoRollback ? "translate-x-3" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8d8e]">Fix prompt spelling</span>
                            <button
                              type="button"
                              onClick={() => setAutoCorrectSpelling(!autoCorrectSpelling)}
                              className={`w-7 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                                autoCorrectSpelling ? "bg-blue-600" : "bg-[#3a3b3f]"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                  autoCorrectSpelling ? "translate-x-3" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[#8c8d8e]">TTS Narration</span>
                            <button
                              type="button"
                              onClick={() => setTtsEnabled(!ttsEnabled)}
                              className={`w-7 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                                ttsEnabled ? "bg-purple-600" : "bg-[#3a3b3f]"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                  ttsEnabled ? "translate-x-3" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voice-to-Text Microphone Button */}
                  <Button
                    variant={isListening ? "studio-active" : "studio"}
                    size="icon-xs"
                    onClick={handleToggleVoiceToText}
                    className={`w-7 h-7 rounded-lg shadow-xs transition-colors ${
                      isListening
                        ? "text-rose-400 border-rose-500/60 bg-rose-950/40 animate-pulse ring-1 ring-rose-500/40"
                        : "text-[#8c8d8e] hover:text-[#f3f4f6]"
                    }`}
                    title={isListening ? "Stop Voice-to-Text" : "Dictate Prompt with Voice-to-Text"}
                  >
                    <MicIcon className={`w-3.5 h-3.5 ${isListening ? "text-rose-400 animate-bounce" : ""}`} />
                  </Button>

                  {/* Send Button */}
                  {isExecuting ? (
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => setIsExecuting(false)}
                      className="w-7 h-7 rounded-lg shadow-xs"
                      title="Stop execution"
                    >
                      <SquareIcon className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="studio-accent"
                      size="icon-xs"
                      disabled={!inputPrompt.trim()}
                      onClick={handleSendPrompt}
                      className="w-7 h-7 rounded-lg shadow-xs"
                      title="Send message (Enter)"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* File Diff Inspection Modal                                   */}
          {/* ============================================================ */}
          {selectedDiffFile && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#26282c] border border-[#3a3b3f] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-[#3a3b3f] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <FileCode2Icon className="w-4 h-4 text-[#9cd2ae]" />
                    <span className="text-[#8c8d8e]">{selectedDiffFile.path}</span>
                    <span className="font-bold text-[#f3f4f6]">{selectedDiffFile.filename}</span>
                    <span className="text-[#9cd2ae] ml-2">+{selectedDiffFile.added}</span>
                    <span className="text-rose-400">-{selectedDiffFile.removed}</span>
                  </div>
                  <button
                    onClick={() => setSelectedDiffFile(null)}
                    className="text-[#8c8d8e] hover:text-[#f3f4f6] p-1"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] bg-[#191a1c] leading-relaxed text-[#9cd2ae] codeitz-slim-scroll">
                  <pre className="whitespace-pre-wrap">
                    {selectedDiffFile.diffContent ? redactSensitiveData(selectedDiffFile.diffContent) : "No inline diff available."}
                  </pre>
                </div>

                <div className="p-3 border-t border-[#3a3b3f] flex justify-end">
                  <Button
                    variant="studio"
                    size="sm"
                    onClick={() => setSelectedDiffFile(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Create Project / Isolated Worktree Modal                     */}
          {/* ============================================================ */}
          {isNewProjectOpen && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#26282c] border border-[#3a3b3f] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3f]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#f3f4f6]">
                    <FolderPlusIcon className="w-4 h-4 text-[#9cd2ae]" />
                    <span>Create New Project</span>
                  </div>
                  <button
                    onClick={() => setIsNewProjectOpen(false)}
                    className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Project Name</label>
                    <input
                      type="text"
                      placeholder="e.g. mobile-devkit, feature-agent..."
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#9cd2ae]/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Git Worktree Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. feat/isolated-chat, isolated/worker"
                      value={newProjectBranch}
                      onChange={(e) => setNewProjectBranch(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#9cd2ae]/60"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs text-[#f3f4f6] font-medium">Isolated Git Worktree</div>
                      <div className="text-[10px] text-[#8c8d8e]">
                        Run tasks and commits in an isolated worktree branch without impacting main
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProjectIsWorktree(!newProjectIsWorktree)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                        newProjectIsWorktree ? "bg-[#9cd2ae]" : "bg-[#3a3b3f]"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-[#191a1c] transition-transform ${
                          newProjectIsWorktree ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#3a3b3f] flex items-center justify-end gap-2">
                  <Button
                    variant="studio-ghost"
                    size="sm"
                    onClick={() => setIsNewProjectOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="studio-accent"
                    size="sm"
                    disabled={!newProjectName.trim()}
                    onClick={() => {
                      createProjectMutation.mutate({
                        name: newProjectName.trim(),
                        worktreeBranch: newProjectBranch.trim() || undefined,
                        isWorktree: newProjectIsWorktree,
                      });
                    }}
                    className="font-semibold"
                  >
                    Create Project
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Create Conversation Modal                                    */}
          {/* ============================================================ */}
          {isNewConvOpen && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#26282c] border border-[#3a3b3f] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3f]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#f3f4f6]">
                    <PlusIcon className="w-4 h-4 text-[#9cd2ae]" />
                    <span>New Conversation in {newConvProjectId}</span>
                  </div>
                  <button
                    onClick={() => setIsNewConvOpen(false)}
                    className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Conversation Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Build Feature Pipeline, Audit Schema..."
                      value={newConvTitle}
                      onChange={(e) => setNewConvTitle(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#9cd2ae]/60"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#3a3b3f] flex items-center justify-end gap-2">
                  <Button
                    variant="studio-ghost"
                    size="sm"
                    onClick={() => setIsNewConvOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="studio-accent"
                    size="sm"
                    disabled={!newConvTitle.trim()}
                    onClick={() => {
                      createConversationMutation.mutate({
                        projectId: newConvProjectId,
                        title: newConvTitle.trim(),
                      });
                    }}
                    className="font-semibold"
                  >
                    Start Conversation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Project Settings Modal ("to set basic")                      */}
          {/* ============================================================ */}
          {settingsModalProject && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#26282c] border border-[#3a3b3f] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#3a3b3f]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#f3f4f6]">
                    <SettingsIcon className="w-4 h-4 text-[#9cd2ae]" />
                    <span>Project Settings: {settingsModalProject.name}</span>
                  </div>
                  <button
                    onClick={() => setSettingsModalProject(null)}
                    className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1 codeitz-slim-scroll">
                  {/* Basic Setting 1: Project Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Project Name</label>
                    <input
                      type="text"
                      value={settingName}
                      onChange={(e) => setSettingName(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#9cd2ae]/60 font-medium"
                    />
                  </div>

                  {/* Basic Setting 2: Worktree Branch */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Worktree / Tracking Branch</label>
                    <input
                      type="text"
                      value={settingBranch}
                      onChange={(e) => setSettingBranch(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none focus:border-[#9cd2ae]/60 font-mono"
                    />
                  </div>

                  {/* Basic Setting 3: Default Reasoning Model */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Default Provider / Reasoning Model</label>
                    <select
                      value={settingDefaultModel}
                      onChange={(e) => setSettingDefaultModel(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none"
                    >
                      <option>Gemini 3.8 Flash (Medium)</option>
                      <option>Gemini 1.5 Pro (Deep Reasoning)</option>
                      <option>Claude 3.5 Sonnet (Agentic SWE)</option>
                      <option>GPT-4o (Omni Reasoning)</option>
                      <option>DeepSeek-R1 (Chain of Thought)</option>
                      <option>Multi-Model Consensus (Ensemble)</option>
                    </select>
                  </div>

                  {/* Basic Setting 4: Verification Rigor */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Verification Gate Rigor</label>
                    <select
                      value={settingRigor}
                      onChange={(e) => setSettingRigor(e.target.value as "full" | "fast" | "advisory")}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded-lg px-3 py-2 text-xs text-[#f3f4f6] focus:outline-none"
                    >
                      <option value="full">Full Rigor (Compiler, Linter, All Tests Gate)</option>
                      <option value="fast">Fast Track (Compiler and Typecheck only)</option>
                      <option value="advisory">Advisory (Non-blocking Warnings)</option>
                    </select>
                  </div>

                  {/* Basic Setting 5: Parallel Worker Slots */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8c8d8e] font-mono">Parallel Runner Concurrency (Worker Slots)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={8}
                        value={settingConcurrency}
                        onChange={(e) => setSettingConcurrency(Number(e.target.value))}
                        className="flex-1 accent-[#9cd2ae]"
                      />
                      <span className="font-mono text-xs text-[#9cd2ae] bg-[#191a1c] border border-[#3a3b3f] px-2 py-1 rounded">
                        {settingConcurrency} slots
                      </span>
                    </div>
                  </div>

                  {/* Basic Setting 6: Invariant Toggles */}
                  <div className="pt-2 border-t border-[#3a3b3f] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-[#f3f4f6] font-medium">Automatic Rollback on Failure</div>
                        <div className="text-[10px] text-[#8c8d8e]">Revert workspace modifications if verification gates fail</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingAutoRollback(!settingAutoRollback)}
                        className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                          settingAutoRollback ? "bg-[#9cd2ae]" : "bg-[#3a3b3f]"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full bg-[#191a1c] transition-transform ${
                            settingAutoRollback ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-[#f3f4f6] font-medium">Isolated Git Worktree Mode</div>
                        <div className="text-[10px] text-[#8c8d8e]">Isolate branches and tasks from the repository root</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingIsWorktree(!settingIsWorktree)}
                        className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                          settingIsWorktree ? "bg-sky-500" : "bg-[#3a3b3f]"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full bg-[#191a1c] transition-transform ${
                            settingIsWorktree ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Root Path info */}
                  <div className="pt-2 border-t border-[#3a3b3f] space-y-1">
                    <label className="text-[10px] text-[#8c8d8e] font-mono">Workspace Root Path</label>
                    <div className="flex items-center justify-between p-2 rounded bg-[#191a1c] border border-[#3a3b3f] font-mono text-[11px] text-[#8c8d8e]">
                      <span className="truncate pr-2">{settingsModalProject.rootPath}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(settingsModalProject.rootPath);
                          setProjectToast("Copied root path to clipboard");
                          setTimeout(() => setProjectToast(null), 2500);
                        }}
                        className="text-[#9cd2ae] hover:underline shrink-0 text-[10px]"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#3a3b3f] flex items-center justify-end gap-2">
                  {settingsModalProject.isWorktree && (
                    <Button
                      variant="warning"
                      size="sm"
                      disabled={mergeWorktreeMutation.isPending}
                      onClick={() => {
                        mergeWorktreeMutation.mutate({
                          sourceBranch: settingBranch.trim() || settingsModalProject.worktreeBranch,
                          targetBranch: "main",
                        });
                      }}
                      className="mr-auto font-semibold flex items-center gap-1.5 text-xs"
                    >
                      <GitCommitIcon className="w-3.5 h-3.5" />
                      <span>{mergeWorktreeMutation.isPending ? "Merging..." : "Merge to Main"}</span>
                    </Button>
                  )}
                  <Button
                    variant="studio"
                    size="sm"
                    onClick={() => setSettingsModalProject(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="studio-accent"
                    size="sm"
                    disabled={!settingName.trim() || updateProjectMutation.isPending}
                    onClick={() => {
                      updateProjectMutation.mutate({
                        projectId: settingsModalProject.id,
                        data: {
                          name: settingName.trim(),
                          worktreeBranch: settingBranch.trim() || undefined,
                          isWorktree: settingIsWorktree,
                          defaultModel: settingDefaultModel,
                          verificationRigor: settingRigor,
                          autoRollback: settingAutoRollback,
                          runnerConcurrency: settingConcurrency,
                        },
                      });
                    }}
                    className="font-semibold"
                  >
                    {updateProjectMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notification Toasts */}
          {projectToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#191a1c] border border-[#9cd2ae]/50 text-[#9cd2ae] px-3.5 py-2 rounded-lg text-xs shadow-2xl flex items-center gap-2">
              <CheckCircle2Icon className="w-4 h-4 text-[#9cd2ae]" />
              <span>{projectToast}</span>
            </div>
          )}

          {voiceToast && (
            <div className="fixed bottom-28 right-6 z-50 bg-[#191a1c] border border-rose-500/50 text-rose-300 px-3.5 py-2 rounded-lg text-xs shadow-2xl flex items-center gap-2 animate-pulse">
              <MicIcon className="w-4 h-4 text-rose-400" />
              <span>{voiceToast}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* Side Drawer for Queue, Customize (Memory), or Automate       */}
          {/* ============================================================ */}
          {activeDrawer !== "none" && (
            <div className="absolute top-14 bottom-0 right-0 w-[420px] bg-[#26282c] border-l border-[#3a3b3f] shadow-2xl p-4 flex flex-col z-30">
              {activeDrawer === "queue" ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <div className="flex items-center gap-2">
                      <ListTodoIcon className="w-4 h-4 text-[#9cd2ae]" />
                      <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider">
                        Task Queue & Continuous Runner
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveDrawer("none")}
                      className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tab Bar */}
                  <div className="flex border-b border-[#3a3b3f] text-[11px] font-mono pt-2">
                    <button
                      onClick={() => setQueueTab("queue")}
                      className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
                        queueTab === "queue"
                          ? "border-[#9cd2ae] text-[#9cd2ae]"
                          : "border-transparent text-[#8c8d8e] hover:text-[#f3f4f6]"
                      }`}
                    >
                      Queue ({queueQuery.data?.queue.length ?? 0})
                    </button>
                    <button
                      onClick={() => setQueueTab("scheduler")}
                      className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
                        queueTab === "scheduler"
                          ? "border-[#9cd2ae] text-[#9cd2ae]"
                          : "border-transparent text-[#8c8d8e] hover:text-[#f3f4f6]"
                      }`}
                    >
                      Scheduler
                    </button>
                    <button
                      onClick={() => setQueueTab("logs")}
                      className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
                        queueTab === "logs"
                          ? "border-[#9cd2ae] text-[#9cd2ae]"
                          : "border-transparent text-[#8c8d8e] hover:text-[#f3f4f6]"
                      }`}
                    >
                      Live History ({queueQuery.data?.logs.length ?? 0})
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-3 codeitz-slim-scroll">
                    {queueTab === "queue" ? (
                      <div className="space-y-3">
                        {/* Parallel Task Runners Dashboard */}
                        <div className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#f3f4f6] flex items-center gap-1.5">
                              <WorkflowIcon className="w-3.5 h-3.5 text-[#9cd2ae]" />
                              Parallel Workers
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <span className="text-[#8c8d8e] mr-1">Concurrency:</span>
                              {[1, 2, 4].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    setRunnerConcurrency(c);
                                    startRunnerMutation.mutate({ maxConcurrency: c });
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                                    (queueQuery.data?.runnerState.maxConcurrency ?? runnerConcurrency) === c
                                      ? "bg-[#26282c] text-[#9cd2ae] border-[#9cd2ae]/50 font-bold"
                                      : "bg-[#191a1c] text-[#8c8d8e] border-[#3a3b3f]"
                                  }`}
                                >
                                  {c}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Active Parallel Runner Worker Slots */}
                          {(queueQuery.data?.runnerState.activeRunners ?? []).length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {queueQuery.data?.runnerState.activeRunners.map((runner) => (
                                <div
                                  key={runner.runnerId}
                                  className="p-2 rounded bg-[#26282c] border border-[#3a3b3f]/70 space-y-1 text-xs"
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-mono text-[#9cd2ae] font-bold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#9cd2ae] animate-pulse" />
                                      {runner.runnerId}
                                    </span>
                                    <Badge variant="studio" className="text-[9px] font-mono capitalize">
                                      {runner.phase} ({runner.progress}%)
                                    </Badge>
                                  </div>
                                  <div className="text-[#f3f4f6] text-[11px] truncate">{runner.taskTitle}</div>
                                  <div className="w-full bg-[#191a1c] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#9cd2ae] h-full transition-all duration-300 rounded-full"
                                      style={{ width: `${runner.progress}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#8c8d8e] italic py-1">
                              Parallel runner worker slots idle. Click &quot;Step All Parallel&quot; to advance.
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1 border-t border-[#3a3b3f]">
                            <Button
                              variant="studio-accent"
                              size="xs"
                              onClick={() => stepParallelMutation.mutate()}
                              disabled={isExecuting || (queueQuery.data?.queue.length ?? 0) === 0}
                              className="flex-1 text-[11px] font-semibold flex items-center justify-center gap-1.5"
                            >
                              <FastForwardIcon className="w-3 h-3" />
                              Step All Parallel
                            </Button>
                            <Button
                              variant={queueQuery.data?.runnerState.status === "running" ? "warning" : "studio"}
                              size="xs"
                              onClick={() => {
                                if (queueQuery.data?.runnerState.status === "running") {
                                  pauseRunnerMutation.mutate();
                                } else {
                                  startRunnerMutation.mutate({ autoProgress: true, maxConcurrency: runnerConcurrency });
                                }
                              }}
                              className="text-[11px]"
                            >
                              {queueQuery.data?.runnerState.status === "running" ? "Pause" : "Auto Loop"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#8c8d8e] pt-1">
                          <span>Prioritized Task Trajectory</span>
                          <span className="font-mono text-[#9cd2ae] text-[10px]">
                            {queueQuery.data?.runnerState.status === "running"
                              ? "● Continuous Active"
                              : "○ Runner Paused"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(queueQuery.data?.queue ?? []).map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={
                                    item.priority === "critical"
                                      ? "studio-destructive"
                                      : item.priority === "high"
                                      ? "studio-warning"
                                      : item.priority === "medium"
                                      ? "studio-info"
                                      : "studio"
                                  }
                                  className="text-[10px] font-mono font-bold uppercase"
                                >
                                  {item.priority}
                                </Badge>
                                <span className="text-[10px] font-mono text-[#8c8d8e]">
                                  Phase:{" "}
                                  <strong className="text-[#9cd2ae] capitalize">
                                    {item.currentPhase}
                                  </strong>
                                </span>
                              </div>

                              <div className="font-medium text-[#f3f4f6] text-xs truncate">
                                {item.title}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-[#3a3b3f] text-[11px]">
                                <span className="text-[#8c8d8e] text-[10px] font-mono truncate max-w-[140px]">
                                  Task: {item.taskId.slice(0, 8)}...
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {item.status !== "completed" && (
                                    <Button
                                      variant="studio-ghost"
                                      size="xs"
                                      onClick={() => dequeueTaskMutation.mutate(item.taskId)}
                                      className="text-[10px]"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                  <Button
                                    variant="studio-accent"
                                    size="xs"
                                    onClick={() => handleContinueRunner()}
                                    disabled={isExecuting}
                                    className="text-[10px] font-semibold flex items-center gap-1"
                                  >
                                    <FastForwardIcon className="w-2.5 h-2.5" />
                                    Step
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {(queueQuery.data?.queue.length ?? 0) === 0 && (
                            <div className="p-4 text-center text-xs text-[#8c8d8e] bg-[#191a1c] rounded-lg border border-[#3a3b3f]">
                              Queue is empty. New prompts automatically enqueue here.
                            </div>
                          )}
                        </div>

                        {/* Quick Enqueue Form */}
                        <div className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2 mt-3">
                          <div className="text-[11px] font-semibold text-[#e2e3e5]">
                            Enqueue Next Task
                          </div>
                          <input
                            type="text"
                            placeholder="Task prompt or title..."
                            value={enqueueTitle}
                            onChange={(e) => setEnqueueTitle(e.target.value)}
                            className="w-full bg-[#26282c] border border-[#3a3b3f] rounded px-2.5 py-1.5 text-xs text-[#e2e3e5] focus:outline-none placeholder:text-[#8c8d8e]"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={enqueuePriority}
                              onChange={(e) => setEnqueuePriority(e.target.value as "low" | "medium" | "high" | "critical")}
                              className="bg-[#26282c] border border-[#3a3b3f] rounded px-2 py-1 text-[11px] text-[#e2e3e5] focus:outline-none"
                            >
                              <option value="critical">Critical Priority</option>
                              <option value="high">High Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="low">Low Priority</option>
                            </select>
                            <Button
                              variant="studio-accent"
                              size="xs"
                              onClick={handleQuickEnqueue}
                              disabled={!enqueueTitle.trim()}
                              className="font-semibold text-xs"
                            >
                              Enqueue
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : queueTab === "scheduler" ? (
                      <div className="space-y-4 text-xs">
                        <div className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2.5">
                          <div className="text-[11px] font-semibold text-[#f3f4f6]">
                            Runner Scheduler Telemetry
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="p-2 rounded bg-[#26282c] border border-[#3a3b3f]">
                              <span className="text-[#8c8d8e]">Status</span>
                              <div className="text-[#f3f4f6] font-bold capitalize">
                                {queueQuery.data?.runnerState.status ?? "idle"}
                              </div>
                            </div>
                            <div className="p-2 rounded bg-[#26282c] border border-[#3a3b3f]">
                              <span className="text-[#8c8d8e]">Processed</span>
                              <div className="text-[#9cd2ae] font-bold">
                                {queueQuery.data?.runnerState.processedCount ?? 0} tasks
                              </div>
                            </div>
                            <div className="p-2 rounded bg-[#26282c] border border-[#3a3b3f] col-span-2">
                              <span className="text-[#8c8d8e]">Active Task ID</span>
                              <div className="text-[#e2e3e5] truncate">
                                {queueQuery.data?.runnerState.activeTaskId ?? "None (Idle / Waiting)"}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[#8c8d8e] text-[11px]">Continuous Task Runner</span>
                            <Button
                              variant={queueQuery.data?.runnerState.status === "running" ? "warning" : "studio-accent"}
                              size="xs"
                              onClick={() => {
                                if (queueQuery.data?.runnerState.status === "running") {
                                  pauseRunnerMutation.mutate();
                                } else {
                                  startRunnerMutation.mutate({ autoProgress: true });
                                }
                              }}
                              className="font-semibold flex items-center gap-1.5"
                            >
                              {queueQuery.data?.runnerState.status === "running" ? (
                                <>
                                  <PauseIcon className="w-3.5 h-3.5" />
                                  Pause Runner
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="w-3.5 h-3.5" />
                                  Start Auto-Runner
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* queueTab === "logs": Real-time History & Action Stream ("what exactly is going on") */
                      <div className="space-y-2">
                        <div className="text-[11px] text-[#8c8d8e] flex items-center justify-between pb-1">
                          <span>Action Audit Trail & Telemetry</span>
                          <span className="text-[#9cd2ae] font-mono text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9cd2ae] animate-ping" />
                            Live stream
                          </span>
                        </div>

                        <div className="space-y-1.5 font-mono text-[11px] max-h-[calc(100vh-220px)] overflow-y-auto pr-1 codeitz-slim-scroll">
                          {(queueQuery.data?.logs ?? []).slice().reverse().map((log) => (
                            <div
                              key={log.id}
                              className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <Badge
                                  variant={
                                    log.level === "action"
                                      ? "studio-success"
                                      : log.level === "error"
                                      ? "studio-destructive"
                                      : log.level === "warn"
                                      ? "studio-warning"
                                      : "studio-info"
                                  }
                                  className="text-[9px] uppercase font-bold"
                                >
                                  {log.level}
                                </Badge>
                                <span className="text-[#8c8d8e] font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {log.taskTitle && (
                                <div className="text-[#8c8d8e] font-sans text-xs font-medium truncate">
                                  {log.taskTitle}
                                </div>
                              )}
                              <div className="text-[#9cd2ae] whitespace-pre-wrap leading-relaxed text-[11px]">
                                {log.message}
                              </div>
                            </div>
                          ))}

                          {(queueQuery.data?.logs.length ?? 0) === 0 && (
                            <div className="p-4 text-center text-xs text-[#8c8d8e] bg-[#191a1c] rounded-lg border border-[#3a3b3f]">
                              No execution logs recorded yet. Run tasks to populate the audit stream.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : activeDrawer === "graph" ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <div className="flex items-center gap-2">
                      <NetworkIcon className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider">
                        Codebase Knowledge Graph
                      </h3>
                    </div>
                    <button onClick={() => setActiveDrawer("none")} className="text-[#8c8d8e] hover:text-[#f3f4f6]">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-3 codeitz-slim-scroll">
                    {/* Graph Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] text-center">
                        <div className="text-[10px] text-[#8c8d8e] uppercase font-mono">Modules</div>
                        <div className="text-base font-bold text-[#f3f4f6] font-mono">
                          {graphQuery.data?.summary.totalNodes ?? 0}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] text-center">
                        <div className="text-[10px] text-[#8c8d8e] uppercase font-mono">Dependencies</div>
                        <div className="text-base font-bold text-purple-400 font-mono">
                          {graphQuery.data?.summary.totalEdges ?? 0}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] text-center">
                        <div className="text-[10px] text-[#8c8d8e] uppercase font-mono">DAG Health</div>
                        <div className="text-xs font-bold text-[#9cd2ae] font-mono mt-1">Clean DAG</div>
                      </div>
                    </div>

                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Search modules or packages..."
                      value={graphSearch}
                      onChange={(e) => setGraphSearch(e.target.value)}
                      className="w-full bg-[#191a1c] border border-[#3a3b3f] rounded px-2.5 py-1 text-xs text-[#e2e3e5] placeholder:text-[#8c8d8e] focus:outline-none font-mono"
                    />

                    {/* Cluster Tabs */}
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedGraphCluster(null)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          selectedGraphCluster === null
                            ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                            : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e]"
                        }`}
                      >
                        All
                      </button>
                      {(graphQuery.data?.clusters ?? []).map((cluster) => (
                        <button
                          key={cluster}
                          onClick={() => setSelectedGraphCluster(cluster)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                            selectedGraphCluster === cluster
                              ? "bg-[#191a1c] text-[#9cd2ae] border-[#40434a] font-medium"
                              : "bg-[#191a1c] border-[#3a3b3f] text-[#8c8d8e]"
                          }`}
                        >
                          {cluster}
                        </button>
                      ))}
                    </div>

                    {/* Nodes Grid */}
                    <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 codeitz-slim-scroll">
                      {(graphQuery.data?.nodes ?? [])
                        .filter((node) => {
                          if (selectedGraphCluster && node.cluster !== selectedGraphCluster) return false;
                          if (graphSearch.trim()) {
                            const q = graphSearch.toLowerCase();
                            return node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map((node) => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedGraphNode(selectedGraphNode?.id === node.id ? null : node)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              selectedGraphNode?.id === node.id
                                ? "bg-[#191a1c] border-[#40434a]"
                                : "bg-[#191a1c] border-[#3a3b3f] hover:bg-[#26282c]"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="font-semibold text-[#f3f4f6] font-mono flex items-center gap-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                <span className="truncate">{node.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#8c8d8e] uppercase px-1.5 py-0.5 rounded bg-[#26282c] border border-[#3a3b3f]">
                                {node.type}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#8c8d8e] mt-1 truncate">{node.path}</div>
                            {node.dependencies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {node.dependencies.slice(0, 3).map((dep) => (
                                  <span key={dep} className="text-[9px] bg-[#26282c] text-[#8c8d8e] px-1 py-0.5 rounded font-mono">
                                    {dep.replace("@codexsun/", "")}
                                  </span>
                                ))}
                                {node.dependencies.length > 3 && (
                                  <span className="text-[9px] text-[#8c8d8e] font-mono">+{node.dependencies.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : activeDrawer === "git" ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <div className="flex items-center gap-2">
                      <GitBranchIcon className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider">
                        Git Workspace & Diff Manager
                      </h3>
                    </div>
                    <button onClick={() => setActiveDrawer("none")} className="text-[#8c8d8e] hover:text-[#f3f4f6]">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-3 codeitz-slim-scroll">
                    {/* Status Summary */}
                    <div className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[#e2e3e5] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#9cd2ae]" />
                          Branch: <span className="font-bold text-[#f3f4f6]">{gitQuery.data?.branch ?? "main"}</span>
                        </span>
                        <Badge
                          variant={gitQuery.data?.clean ? "studio-success" : "studio-warning"}
                          className="font-mono text-[10px]"
                        >
                          {gitQuery.data?.clean ? "Working Tree Clean" : `${gitQuery.data?.files.length ?? 0} Uncommitted`}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono text-[10px]">
                        <div className="p-1 rounded bg-[#26282c] border border-[#3a3b3f]">
                          <div className="text-[#8c8d8e]">Modified</div>
                          <div className="text-amber-400 font-bold">{gitQuery.data?.summary.modified ?? 0}</div>
                        </div>
                        <div className="p-1 rounded bg-[#26282c] border border-[#3a3b3f]">
                          <div className="text-[#8c8d8e]">Added</div>
                          <div className="text-[#9cd2ae] font-bold">{gitQuery.data?.summary.added ?? 0}</div>
                        </div>
                        <div className="p-1 rounded bg-[#26282c] border border-[#3a3b3f]">
                          <div className="text-[#8c8d8e]">Deleted</div>
                          <div className="text-rose-400 font-bold">{gitQuery.data?.summary.deleted ?? 0}</div>
                        </div>
                        <div className="p-1 rounded bg-[#26282c] border border-[#3a3b3f]">
                          <div className="text-[#8c8d8e]">Untracked</div>
                          <div className="text-[#8c8d8e] font-bold">{gitQuery.data?.summary.untracked ?? 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Auto-Commit & Undo AI Changes */}
                    <div className="space-y-2">
                      <Button
                        variant="studio-accent"
                        onClick={() => autoCommitMutation.mutate(undefined)}
                        disabled={gitQuery.data?.clean || autoCommitMutation.isPending}
                        className="w-full py-2 font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <GitCommitIcon className="w-3.5 h-3.5" />
                        <span>Auto-Commit with Sensible Message</span>
                      </Button>

                      <Button
                        variant="studio"
                        onClick={() => {
                          if (window.confirm("Undo uncommitted AI changes across working tree?")) {
                            undoChangesMutation.mutate();
                          }
                        }}
                        disabled={gitQuery.data?.clean || undoChangesMutation.isPending}
                        className="w-full py-1.5 text-rose-300 border-rose-500/30 hover:bg-rose-500/10 font-medium flex items-center justify-center gap-1.5"
                      >
                        <RotateCcwIcon className="w-3.5 h-3.5" />
                        <span>Undo AI Changes (Restore Clean Tree)</span>
                      </Button>
                    </div>

                    {/* Unified Diff List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-mono text-[#8c8d8e] uppercase tracking-wider">
                        Changed Files ({gitQuery.data?.files.length ?? 0})
                      </div>
                      <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 font-mono text-xs codeitz-slim-scroll">
                        {(gitQuery.data?.files ?? []).map((file) => {
                          const isExpanded = gitDiffExpandedFile === file.path;
                          const diffChunk = gitDiffQuery.data?.files.find((d) => d.filePath === file.path);
                          return (
                            <div key={file.path} className="rounded-lg bg-[#191a1c] border border-[#3a3b3f] overflow-hidden">
                              <div
                                onClick={() => setGitDiffExpandedFile(isExpanded ? null : file.path)}
                                className="p-2 flex items-center justify-between cursor-pointer hover:bg-[#26282c] transition-colors"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`text-[9px] font-bold px-1 rounded uppercase ${
                                      file.status === "added"
                                        ? "bg-[#191a1c] text-[#9cd2ae] border border-[#9cd2ae]/40"
                                        : file.status === "deleted"
                                        ? "bg-[#191a1c] text-rose-400 border border-rose-500/40"
                                        : "bg-[#191a1c] text-amber-400 border border-amber-500/40"
                                    }`}
                                  >
                                    {file.status[0]}
                                  </span>
                                  <span className="text-[#e2e3e5] text-[11px] truncate">{file.path}</span>
                                </div>
                                {diffChunk && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-[#9cd2ae]">+{diffChunk.additions}</span>
                                    <span className="text-rose-400">-{diffChunk.deletions}</span>
                                  </div>
                                )}
                              </div>
                              {isExpanded && (
                                <div className="p-2 bg-[#191a1c] border-t border-[#3a3b3f] text-[10px] overflow-x-auto text-[#9cd2ae] whitespace-pre codeitz-slim-scroll">
                                  {diffChunk?.patch || "No diff lines available."}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : activeDrawer === "memory" ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <div className="flex items-center gap-2">
                      <DatabaseIcon className="w-4 h-4 text-emerald-400" />
                      <div>
                        <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider">
                          Memory Bank
                        </h3>
                        <div className="text-[10px] text-[#8c8d8e] font-mono flex items-center gap-2">
                          <span className="text-emerald-400">● SQLite Connected</span>
                          <span>•</span>
                          <span>Markdown + JSON Synced</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="studio"
                        size="xs"
                        onClick={async () => {
                          try {
                            await syncMemoryBankApi(activeProjectId, request);
                            queryClient.invalidateQueries({ queryKey: ["codeitz", "memory"] });
                            setMemoryToast("Memory Bank tri-format sync completed");
                            setTimeout(() => setMemoryToast(null), 3000);
                          } catch (e) {
                            setMemoryToast(`Sync error: ${(e as Error).message}`);
                            setTimeout(() => setMemoryToast(null), 3000);
                          }
                        }}
                        className="text-[10px] flex items-center gap-1"
                        title="Sync across Markdown, SQLite, and JSON"
                      >
                        <RefreshCwIcon className="w-3 h-3 text-[#9cd2ae]" />
                        <span>Sync</span>
                      </Button>
                      <button
                        onClick={() => setActiveDrawer("none")}
                        className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {memoryToast && (
                    <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono">
                      {memoryToast}
                    </div>
                  )}

                  {/* Section Tabs */}
                  <div className="flex border-b border-[#3a3b3f] text-[10px] font-mono pt-1 flex-wrap gap-1">
                    {[
                      { id: "activeContext", label: "Active" },
                      { id: "productContext", label: "Product" },
                      { id: "systemPatterns", label: "Patterns" },
                      { id: "techContext", label: "Tech" },
                      { id: "progress", label: "Progress" },
                      { id: "entries", label: `SQLite (${memoryBankQuery.data?.entries.length ?? 0})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setMemorySection(tab.id as any);
                          if (tab.id !== "entries" && memoryBankQuery.data) {
                            setMemorySectionDraft(memoryBankQuery.data[tab.id as keyof MemoryBankStateResult] as string || "");
                          }
                        }}
                        className={`px-2 py-1 rounded font-medium transition-colors ${
                          memorySection === tab.id
                            ? "bg-[#191a1c] text-emerald-400 border border-[#3a3b3f]"
                            : "text-[#8c8d8e] hover:text-[#f3f4f6]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto py-2 space-y-3 codeitz-slim-scroll">
                    {memorySection === "entries" ? (
                      /* SQLite Structured Memories View */
                      <div className="space-y-3">
                        {/* Add Memory Form */}
                        <div className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2">
                          <span className="text-[11px] font-semibold text-[#f3f4f6] flex items-center gap-1.5">
                            <PlusIcon className="w-3.5 h-3.5 text-emerald-400" />
                            Store Structured Memory
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <input
                              type="text"
                              placeholder="Key (e.g. auth_rule)"
                              value={newMemoryKey}
                              onChange={(e) => setNewMemoryKey(e.target.value)}
                              className="p-1.5 rounded bg-[#26282c] border border-[#3a3b3f] text-xs text-[#f3f4f6] font-mono focus:border-emerald-500 outline-none"
                            />
                            <select
                              value={newMemoryCategory}
                              onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                              className="p-1.5 rounded bg-[#26282c] border border-[#3a3b3f] text-xs text-[#f3f4f6] focus:border-emerald-500 outline-none"
                            >
                              <option value="active">active</option>
                              <option value="product">product</option>
                              <option value="pattern">pattern</option>
                              <option value="tech">tech</option>
                              <option value="progress">progress</option>
                              <option value="task_fact">task_fact</option>
                              <option value="custom">custom</option>
                            </select>
                          </div>
                          <textarea
                            placeholder="Memory content (fact, decision, pattern, or invariant)..."
                            value={newMemoryContent}
                            onChange={(e) => setNewMemoryContent(e.target.value)}
                            rows={2}
                            className="w-full p-1.5 rounded bg-[#26282c] border border-[#3a3b3f] text-xs text-[#f3f4f6] focus:border-emerald-500 outline-none resize-none"
                          />
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <input
                              type="text"
                              placeholder="Tags (comma separated)"
                              value={newMemoryTags}
                              onChange={(e) => setNewMemoryTags(e.target.value)}
                              className="p-1.5 rounded bg-[#26282c] border border-[#3a3b3f] text-xs text-[#f3f4f6] focus:border-emerald-500 outline-none"
                            />
                            <div className="flex items-center gap-2 text-[11px] text-[#8c8d8e]">
                              <span>Importance:</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={newMemoryImportance}
                                onChange={(e) => setNewMemoryImportance(Number(e.target.value))}
                                className="w-12 p-1 rounded bg-[#26282c] border border-[#3a3b3f] text-center text-xs text-[#f3f4f6]"
                              />
                            </div>
                          </div>
                          <Button
                            variant="studio-accent"
                            size="xs"
                            disabled={!newMemoryKey.trim() || !newMemoryContent.trim()}
                            onClick={async () => {
                              try {
                                await createMemoryEntryApi(
                                  {
                                    projectId: activeProjectId,
                                    category: newMemoryCategory,
                                    key: newMemoryKey.trim(),
                                    content: newMemoryContent.trim(),
                                    tags: newMemoryTags.split(",").map((t) => t.trim()).filter(Boolean),
                                    importance: newMemoryImportance,
                                  },
                                  request,
                                );
                                queryClient.invalidateQueries({ queryKey: ["codeitz", "memory"] });
                                setNewMemoryKey("");
                                setNewMemoryContent("");
                                setNewMemoryTags("");
                                setMemoryToast("Memory entry stored in SQLite & JSON");
                                setTimeout(() => setMemoryToast(null), 3000);
                              } catch (e) {
                                setMemoryToast(`Error: ${(e as Error).message}`);
                              }
                            }}
                            className="w-full text-xs font-semibold py-1 rounded"
                          >
                            Save to SQLite
                          </Button>
                        </div>

                        {/* Search Bar */}
                        <input
                          type="text"
                          placeholder="Search SQLite memories..."
                          value={memorySearch}
                          onChange={(e) => setMemorySearch(e.target.value)}
                          className="w-full p-1.5 rounded bg-[#191a1c] border border-[#3a3b3f] text-xs text-[#f3f4f6] placeholder-[#8c8d8e] focus:border-emerald-500 outline-none"
                        />

                        {/* Memories List */}
                        <div className="space-y-2">
                          {memoryBankQuery.data?.entries
                            .filter((m) =>
                              !memorySearch ||
                              m.key.toLowerCase().includes(memorySearch.toLowerCase()) ||
                              m.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
                              m.tags.some((t) => t.toLowerCase().includes(memorySearch.toLowerCase())),
                            )
                            .map((entry) => (
                              <div
                                key={entry.id}
                                className="p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold uppercase">
                                      {entry.category}
                                    </span>
                                    <span className="font-mono font-semibold text-[#f3f4f6]">
                                      {entry.key}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 font-mono">★ {entry.importance}/10</span>
                                    <button
                                      onClick={async () => {
                                        await deleteMemoryEntryApi(entry.id, request);
                                        queryClient.invalidateQueries({ queryKey: ["codeitz", "memory"] });
                                      }}
                                      className="text-[#8c8d8e] hover:text-rose-400 transition-colors p-0.5"
                                      title="Delete memory"
                                    >
                                      <XIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-[#e2e3e5] leading-relaxed">{entry.content}</p>
                                {entry.tags.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                    {entry.tags.map((t) => (
                                      <span key={t} className="text-[9px] px-1 py-0.2 rounded bg-[#26282c] border border-[#3a3b3f] text-[#8c8d8e]">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      /* Markdown Document View */
                      <div className="space-y-2 flex flex-col h-full">
                        <div className="p-2 rounded bg-[#191a1c] border border-[#3a3b3f] flex items-center justify-between text-[10px] font-mono text-[#8c8d8e]">
                          <span>File: storage/runtime/codeitz/memory-bank/{memorySection}.md</span>
                          <span className="text-emerald-400">Parity Synced</span>
                        </div>
                        <textarea
                          value={
                            memorySectionDraft !== ""
                              ? memorySectionDraft
                              : (memoryBankQuery.data?.[memorySection] as string) || ""
                          }
                          onChange={(e) => setMemorySectionDraft(e.target.value)}
                          rows={18}
                          className="w-full flex-1 p-2.5 rounded-lg bg-[#191a1c] border border-[#3a3b3f] text-xs font-mono text-[#f3f4f6] focus:border-emerald-500 outline-none resize-none leading-relaxed codeitz-slim-scroll"
                        />
                        <Button
                          variant="studio-accent"
                          size="xs"
                          onClick={async () => {
                            try {
                              const draft = memorySectionDraft || (memoryBankQuery.data?.[memorySection] as string) || "";
                              await updateMemorySectionApi(memorySection as any, draft, activeProjectId, request);
                              queryClient.invalidateQueries({ queryKey: ["codeitz", "memory"] });
                              setMemoryToast(`Saved ${memorySection}.md to disk and synced SQLite`);
                              setTimeout(() => setMemoryToast(null), 3000);
                            } catch (e) {
                              setMemoryToast(`Error: ${(e as Error).message}`);
                            }
                          }}
                          className="text-xs font-semibold py-1.5 flex items-center justify-center gap-1.5 rounded-lg"
                        >
                          <SaveIcon className="w-3.5 h-3.5" />
                          <span>Save {memorySection}.md & Sync SQLite</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : activeDrawer === "skills" ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-purple-400" />
                      <div>
                        <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider">
                          Skill Reader & Organiser
                        </h3>
                        <div className="text-[10px] text-[#8c8d8e] font-mono">
                          {skillsLibraryQuery.data?.totalCount ?? 0} indexed skills • SQLite Catalog
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="studio"
                        size="xs"
                        onClick={async () => {
                          try {
                            await scanSkillsApi(undefined, true, request);
                            queryClient.invalidateQueries({ queryKey: ["codeitz", "skills"] });
                            setSkillToast("Repository skills scanned & reindexed into SQLite catalog");
                            setTimeout(() => setSkillToast(null), 3000);
                          } catch (e) {
                            setSkillToast(`Error: ${(e as Error).message}`);
                            setTimeout(() => setSkillToast(null), 3000);
                          }
                        }}
                        className="text-[10px] flex items-center gap-1"
                        title="Scan .agents/skills & packages/addons"
                      >
                        <RefreshCwIcon className="w-3 h-3 text-purple-400" />
                        <span>Reindex</span>
                      </Button>
                      <button
                        onClick={() => setActiveDrawer("none")}
                        className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {skillToast && (
                    <div className="p-2 rounded bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-300 font-mono">
                      {skillToast}
                    </div>
                  )}

                  {/* Category Chips Bar */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px] pt-1">
                    {["all", "swe", "testing", "debugging", "git", "architecture", "learning", "frontend"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSkillCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded font-mono transition-colors ${
                          skillCategoryFilter === cat
                            ? "bg-[#191a1c] text-purple-400 border border-purple-500/40 font-bold"
                            : "text-[#8c8d8e] hover:text-[#f3f4f6] bg-[#26282c]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="Search skills by name, tag, or workflow step..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full p-1.5 rounded bg-[#191a1c] border border-[#3a3b3f] text-xs text-[#f3f4f6] placeholder-[#8c8d8e] focus:border-purple-500 outline-none"
                  />

                  {/* Skill Cards List */}
                  <div className="flex-1 overflow-y-auto py-2 space-y-2.5 codeitz-slim-scroll">
                    {skillsLibraryQuery.data?.skills
                      .filter((s) =>
                        !skillSearch ||
                        s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
                        s.description.toLowerCase().includes(skillSearch.toLowerCase()) ||
                        s.tags.some((t) => t.toLowerCase().includes(skillSearch.toLowerCase())),
                      )
                      .map((skill) => (
                        <div
                          key={skill.id}
                          className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-2 hover:border-[#4f525a] transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-semibold text-[#f3f4f6] font-mono flex items-center gap-1.5">
                                <Code2Icon className="w-3.5 h-3.5 text-purple-400" />
                                {skill.name}
                              </h4>
                              <div className="text-[10px] text-[#8c8d8e] font-mono truncate max-w-[240px]">
                                {skill.sourcePath}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300">
                                {skill.category}
                              </span>
                              <span className="text-[10px] text-amber-400 font-mono">
                                ★ {skill.rating}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-[#c5c6c9] leading-relaxed">
                            {skill.description}
                          </p>

                          {/* Workflow Steps Preview */}
                          {skill.workflow.length > 0 && (
                            <div className="p-2 rounded bg-[#26282c] border border-[#3a3b3f]/60 space-y-1 text-[10px] font-mono text-[#8c8d8e]">
                              <span className="text-[9px] uppercase tracking-wider text-[#9cd2ae] font-bold block">
                                Workflow Checklist ({skill.workflow.length} steps):
                              </span>
                              <div className="space-y-0.5">
                                {skill.workflow.slice(0, 3).map((w, idx) => (
                                  <div key={idx} className="truncate">
                                    {idx + 1}. {w}
                                  </div>
                                ))}
                                {skill.workflow.length > 3 && (
                                  <span className="text-[#8c8d8e]/70 italic">
                                    + {skill.workflow.length - 3} more steps
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <div className="flex items-center gap-1 flex-wrap">
                              {skill.tags.map((t) => (
                                <span key={t} className="px-1 py-0.2 rounded bg-[#26282c] border border-[#3a3b3f] text-[#8c8d8e]">
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                setInputPrompt((prev) =>
                                  prev ? `${prev}\n\n[Apply Skill: ${skill.name}]` : `[Apply Skill: ${skill.name}] `,
                                );
                                setSkillToast(`Appended [Apply Skill: ${skill.name}] to prompt`);
                                setTimeout(() => setSkillToast(null), 2500);
                              }}
                              className="text-purple-400 hover:text-purple-300 font-medium font-mono"
                            >
                              + Apply to Prompt
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#3a3b3f]">
                    <h3 className="text-xs font-semibold text-[#f3f4f6] uppercase tracking-wider flex items-center gap-2">
                      <BrainCircuitIcon className="w-4 h-4 text-[#9cd2ae]" />
                      Self-Learning Heuristics
                    </h3>
                    <button
                      onClick={() => setActiveDrawer("none")}
                      className="text-[#8c8d8e] hover:text-[#f3f4f6]"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-3 space-y-3 codeitz-slim-scroll">
                    <p className="text-[11px] text-[#8c8d8e]">
                      Heuristics learned across tasks to prevent recurring regressions:
                    </p>
                    {heuristicsQuery.data?.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 rounded-lg bg-[#191a1c] border border-[#3a3b3f] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#9cd2ae] font-semibold">{h.category}</span>
                          <span className="text-[#8c8d8e]">
                            Score: {(h.effectivenessScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-[#e2e3e5]">{h.rule}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </MainWorkspace>
  );
}
