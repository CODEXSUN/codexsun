import { useState, useRef, useEffect } from "react";

export interface TodoItem {
  id: string;
  label: string;
  completed: boolean;
  inProgress?: boolean;
}

export interface ActionCard {
  type: "edit" | "write" | "explore" | "command";
  target: string;
  added?: number;
  removed?: number;
  output?: string;
}

export interface ChangedFileItem {
  path: string;
  filename: string;
  added: number;
  removed: number;
  diffContent?: string;
}

export interface ChangedFilesSummary {
  totalFiles: number;
  totalAdded: number;
  totalRemoved: number;
  files: ChangedFileItem[];
}

export interface TaskReport {
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

export interface ChatMessage {
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

export interface ChatSession {
  id: string;
  projectId?: string;
  title: string;
  fullTitle?: string;
  timeAgo: string;
  updatedTime?: string;
  status?: "active" | "completed" | "idle";
  phase?: "intake" | "grounding" | "planning" | "execution" | "verification" | "review" | "completed" | "in_progress";
  priority?: "low" | "medium" | "high" | "critical";
  messages: ChatMessage[];
  taskId?: string;
  pinned?: boolean;
  archived?: boolean;
  unread?: boolean;
  summary?: string;
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

export function useCodeitzState() {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDrawer, setActiveDrawer] = useState<"none" | "learning" | "skills" | "queue" | "graph" | "git" | "memory" | "capabilities">("none");
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
  const [selectedSkillForDetails, setSelectedSkillForDetails] = useState<any | null>(null);
  const [skillToast, setSkillToast] = useState<string | null>(null);

  // Task Execution State
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
  const [selectedGraphNode, setSelectedGraphNode] = useState<any | null>(null);
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

  // Project 3-dot Dropdown & Settings Modal State
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<{
    project: any;
    top: number;
    left: number;
  } | null>(null);
  const projectMenuOpenId = projectMenuAnchor?.project.id ?? null;
  const setProjectMenuOpenId = (id: string | null) => {
    if (!id) setProjectMenuAnchor(null);
  };
  const [settingsModalProject, setSettingsModalProject] = useState<any | null>(null);
  const [settingName, setSettingName] = useState("");
  const [settingBranch, setSettingBranch] = useState("");
  const [settingIsWorktree, setSettingIsWorktree] = useState(false);
  const [settingDefaultModel, setSettingDefaultModel] = useState("Gemini 3.8 Flash (Medium)");
  const [settingRigor, setSettingRigor] = useState<"full" | "fast" | "advisory">("full");
  const [settingAutoRollback, setSettingAutoRollback] = useState(true);
  const [settingConcurrency, setSettingConcurrency] = useState(2);
  const [projectToast, setProjectToast] = useState<string | null>(null);

  // Conversation 3-dot Dropdown, Pin, Archive & Hover Tooltip Card State
  const [convMenuAnchor, setConvMenuAnchor] = useState<{
    session: any;
    projectId: string;
    projectName: string;
    top: number;
    left: number;
  } | null>(null);
  const [convSubmenuOpen, setConvSubmenuOpen] = useState<"copy" | "split" | null>(null);
  const convMenuOpenId = convMenuAnchor?.session.id ?? null;
  const setConvMenuOpenId = (id: string | null) => {
    if (!id) {
      setConvMenuAnchor(null);
      setConvSubmenuOpen(null);
    }
  };
  const [hoveredConv, setHoveredConv] = useState<{
    session: any;
    projectName: string;
    top: number;
    left: number;
  } | null>(null);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showArchivedProjects, setShowArchivedProjects] = useState<Record<string, boolean>>({});
  const hoverTimerRef = useRef<any>(null);

  // Close menus on outside click or scroll
  useEffect(() => {
    const handleCloseMenus = () => {
      setConvMenuAnchor(null);
      setConvSubmenuOpen(null);
      setProjectMenuAnchor(null);
    };
    window.addEventListener("click", handleCloseMenus);
    window.addEventListener("scroll", handleCloseMenus, true);
    return () => {
      window.removeEventListener("click", handleCloseMenus);
      window.removeEventListener("scroll", handleCloseMenus, true);
    };
  }, []);

  return {
    // UI State
    sidebarOpen, setSidebarOpen,
    activeDrawer, setActiveDrawer,
    queueTab, setQueueTab,

    // Memory Bank State
    memorySection, setMemorySection,
    memorySectionDraft, setMemorySectionDraft,
    memorySearch, setMemorySearch,
    newMemoryKey, setNewMemoryKey,
    newMemoryContent, setNewMemoryContent,
    newMemoryCategory, setNewMemoryCategory,
    newMemoryTags, setNewMemoryTags,
    newMemoryImportance, setNewMemoryImportance,
    memoryToast, setMemoryToast,

    // Skill Organiser State
    skillCategoryFilter, setSkillCategoryFilter,
    skillSearch, setSkillSearch,
    selectedSkillForDetails, setSelectedSkillForDetails,
    skillToast, setSkillToast,

    // Task Execution State
    enqueueTitle, setEnqueueTitle,
    enqueuePriority, setEnqueuePriority,
    steerOpen, setSteerOpen,
    optionsOpen, setOptionsOpen,
    activeSteeringRules, setActiveSteeringRules,
    customSteerInput, setCustomSteerInput,
    execMode, setExecMode,
    verificationRigor, setVerificationRigor,
    autoRollback, setAutoRollback,
    taskPriority, setTaskPriority,
    model, setModel,
    inputPrompt, setInputPrompt,
    isExecuting, setIsExecuting,
    thinkingExpanded, setThinkingExpanded,
    commandExpanded, setCommandExpanded,
    todosOpen, setTodosOpen,
    selectedDiffFile, setSelectedDiffFile,
    expandedFilesMap, setExpandedFilesMap,

    // Capabilities State
    webSearchActive, setWebSearchActive,
    browserActive, setBrowserActive,
    computerUseActive, setComputerUseActive,
    imageGenActive, setImageGenActive,
    attachedFiles, setAttachedFiles,
    attachMenuOpen, setAttachMenuOpen,
    ttsPlayingMessageId, setTtsPlayingMessageId,
    spellingSuggestion, setSpellingSuggestion,
    autoCorrectSpelling, setAutoCorrectSpelling,
    ttsEnabled, setTtsEnabled,

    // Codebase Graph & Git State
    graphSearch, setGraphSearch,
    selectedGraphCluster, setSelectedGraphCluster,
    selectedGraphNode, setSelectedGraphNode,
    gitDiffExpandedFile, setGitDiffExpandedFile,

    // Projects, Conversations & Isolated Worktrees State
    activeProjectId, setActiveProjectId,
    expandedProjects, setExpandedProjects,
    projectSearch, setProjectSearch,
    isNewProjectOpen, setIsNewProjectOpen,
    newProjectName, setNewProjectName,
    newProjectBranch, setNewProjectBranch,
    newProjectIsWorktree, setNewProjectIsWorktree,
    isNewConvOpen, setIsNewConvOpen,
    newConvProjectId, setNewConvProjectId,
    newConvTitle, setNewConvTitle,

    // Parallel Task Runner Concurrency
    runnerConcurrency, setRunnerConcurrency,

    // Tools, Presets & Execution Options Pop-up Menu
    toolsMenuOpen, setToolsMenuOpen,

    // Project 3-dot Dropdown & Settings Modal State
    projectMenuAnchor, setProjectMenuAnchor,
    projectMenuOpenId, setProjectMenuOpenId,
    settingsModalProject, setSettingsModalProject,
    settingName, setSettingName,
    settingBranch, setSettingBranch,
    settingIsWorktree, setSettingIsWorktree,
    settingDefaultModel, setSettingDefaultModel,
    settingRigor, setSettingRigor,
    settingAutoRollback, setSettingAutoRollback,
    settingConcurrency, setSettingConcurrency,
    projectToast, setProjectToast,

    // Conversation 3-dot Dropdown, Pin, Archive & Hover Tooltip Card State
    convMenuAnchor, setConvMenuAnchor,
    convMenuOpenId, setConvMenuOpenId,
    convSubmenuOpen, setConvSubmenuOpen,
    hoveredConv, setHoveredConv,
    renamingConvId, setRenamingConvId,
    renameValue, setRenameValue,
    showArchivedProjects, setShowArchivedProjects,
    hoverTimerRef,

    // Constants
    DEFAULT_APPROVAL_QUESTIONS,
  };
}
