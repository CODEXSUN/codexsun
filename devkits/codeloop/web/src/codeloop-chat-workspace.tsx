import { useState, useRef, useEffect, useMemo } from "react";
import type { AgentChatMessage } from "@codexsun/ui/blocks/agent-chat-workspace";
import type { AgentProviderSettingsItem } from "@codexsun/ui/blocks/agent-provider-settings";
import type { ProjectConversation, ProjectDetails, ProjectKnowledgeFile } from "./types";
import type { LiveActivity } from "./live-activity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@codexsun/ui/components/dialog";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Badge } from "@codexsun/ui/components/badge";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  File,
  FileCode2,
  FileText,
  Files,
  FolderKanban,
  FolderOpen,
  Loader2,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  ThumbsUp,
  Undo2,
  X,
} from "lucide-react";

interface BrowsableProjectFile {
  id: string;
  name: string;
  path: string;
  size: string;
  category: "source" | "config" | "docs" | "devkits";
  description: string;
}

const AVAILABLE_PROJECT_FILES: BrowsableProjectFile[] = [
  {
    id: "pkg-json",
    name: "package.json",
    path: "package.json",
    size: "3.4 KB",
    category: "config",
    description: "Root workspace package manifest & scripts",
  },
  {
    id: "tsconfig-json",
    name: "tsconfig.json",
    path: "tsconfig.json",
    size: "1.8 KB",
    category: "config",
    description: "Root TypeScript compiler settings",
  },
  {
    id: "agents-md",
    name: "AGENTS.md",
    path: "AGENTS.md",
    size: "1.2 KB",
    category: "docs",
    description: "Workspace boundaries & agent operational rules",
  },
  {
    id: "readme-md",
    name: "README.md",
    path: "README.md",
    size: "4.5 KB",
    category: "docs",
    description: "Repository overview and setup guide",
  },
  {
    id: "doc-standards",
    name: "standards.md",
    path: "assist/documentation/standards.md",
    size: "5.1 KB",
    category: "docs",
    description: "Documentation format and conventions",
  },
  {
    id: "codeloop-pkg",
    name: "package.json",
    path: "devkits/codeloop/package.json",
    size: "2.1 KB",
    category: "devkits",
    description: "CodeLoop workspace configuration and dependencies",
  },
  {
    id: "codeloop-server",
    name: "server.ts",
    path: "devkits/codeloop/api/src/server.ts",
    size: "6.8 KB",
    category: "source",
    description: "CodeLoop Fastify API entrypoint and routes",
  },
  {
    id: "codeloop-workspace",
    name: "codeloop-chat-workspace.tsx",
    path: "devkits/codeloop/web/src/codeloop-chat-workspace.tsx",
    size: "34.2 KB",
    category: "source",
    description: "Anthropic Claude style chat workspace interface",
  },
  {
    id: "codeloop-types",
    name: "types.ts",
    path: "devkits/codeloop/web/src/types.ts",
    size: "1.5 KB",
    category: "source",
    description: "Core project, conversation, and knowledge types",
  },
  {
    id: "codeloop-identity",
    name: "identity-store.ts",
    path: "devkits/codeloop/api/src/identity-store.ts",
    size: "8.2 KB",
    category: "source",
    description: "SQLite user and identity persistence layer",
  },
  {
    id: "ui-pkg",
    name: "package.json",
    path: "packages/ui/package.json",
    size: "5.3 KB",
    category: "config",
    description: "Design system UI library component exports",
  },
  {
    id: "ui-dialog",
    name: "dialog.tsx",
    path: "packages/ui/src/components/dialog.tsx",
    size: "3.9 KB",
    category: "source",
    description: "Shadcn & Base UI Dialog modal components",
  },
  {
    id: "ui-button",
    name: "button.tsx",
    path: "packages/ui/src/components/button.tsx",
    size: "4.3 KB",
    category: "source",
    description: "Shadcn button with size and variant variants",
  },
  {
    id: "ui-input",
    name: "input.tsx",
    path: "packages/ui/src/components/input.tsx",
    size: "1.1 KB",
    category: "source",
    description: "Standard input component with focus states",
  },
  {
    id: "ui-badge",
    name: "badge.tsx",
    path: "packages/ui/src/components/badge.tsx",
    size: "2.4 KB",
    category: "source",
    description: "Status badge component with shadcn styling",
  },
  {
    id: "docker-compose",
    name: "docker-compose.yml",
    path: "docker-compose.yml",
    size: "2.7 KB",
    category: "config",
    description: "Local development containers and database setup",
  },
];

export interface CodeloopChatWorkspaceProps {
  conversation: ProjectConversation;
  project: ProjectDetails;
  providers: readonly AgentProviderSettingsItem[];
  selectedProviderIds: readonly string[];
  onProviderSelectionChange: (providerIds: readonly string[]) => void;
  onSendMessage: (content: string, attachments?: File[]) => void | Promise<void>;
  isMessageStreaming?: boolean;
  liveActivities?: readonly LiveActivity[];
  runConnectionState?: "connected" | "reconnecting" | "offline" | "idle";
  onRetryRun?: () => void;
  onStopMessage?: () => void;
  onUpdateProjectInstructions?: (instructions: string) => void;
  onAddKnowledgeFile?: (file: Omit<ProjectKnowledgeFile, "id">) => void;
  onRemoveKnowledgeFile?: (fileId: string) => void;
  onOpenTerminal?: () => void;
  pendingApprovals?: readonly PendingToolApproval[];
  onApproveTool?: (approval: PendingToolApproval) => void | Promise<void>;
  onRejectTool?: (approval: PendingToolApproval) => void;
}

export type PendingToolApproval = {
  providerId: string;
  tool: string;
  callId: string;
  arguments: Record<string, unknown>;
  reason: string;
};

const getProviderTheme = (providerId?: string) => {
  switch (providerId) {
    case "ollama":
      return {
        bg: "bg-sky-500/10 dark:bg-sky-400/15",
        text: "text-sky-600 dark:text-sky-400",
        border: "border-sky-500/30",
      };
    case "anthropic":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-400/15",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
      };
    case "openai":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-400/15",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/30",
      };
    case "codex":
      return {
        bg: "bg-violet-500/10 dark:bg-violet-400/15",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-500/30",
      };
    case "gemini":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-400/15",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/30",
      };
    case "openrouter":
      return {
        bg: "bg-purple-500/10 dark:bg-purple-400/15",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500/30",
      };
    default:
      return {
        bg: "bg-neutral-500/10 dark:bg-neutral-400/15",
        text: "text-neutral-600 dark:text-neutral-400",
        border: "border-neutral-500/30",
      };
  }
};

function getProviderStatusLabel(provider?: AgentProviderSettingsItem): string {
  if (!provider?.enabled) return "Disabled";
  if (provider.connectionStatus === "connected") return "Live";
  if (provider.connectionStatus === "checking") return "Checking";
  if (provider.connectionStatus === "error") return "Connection error";
  return "Not verified";
}

function getProviderStatusDot(provider?: AgentProviderSettingsItem): string {
  if (!provider?.enabled) return "bg-neutral-400";
  if (provider.connectionStatus === "connected") return "bg-emerald-500 shadow-xs shadow-emerald-500/50";
  if (provider.connectionStatus === "checking") return "bg-amber-500 animate-pulse";
  if (provider.connectionStatus === "error") return "bg-red-500";
  return "bg-neutral-400";
}

export function CodeloopChatWorkspace({
  conversation,
  project,
  providers,
  selectedProviderIds,
  onProviderSelectionChange,
  onSendMessage,
  isMessageStreaming = false,
  liveActivities = [],
  runConnectionState = "idle",
  onRetryRun,
  onStopMessage,
  onUpdateProjectInstructions,
  onAddKnowledgeFile,
  onRemoveKnowledgeFile,
  onOpenTerminal,
  pendingApprovals = [],
  onApproveTool,
  onRejectTool,
}: CodeloopChatWorkspaceProps) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(project.instructions);
  const [activeTab, setActiveTab] = useState<"instructions" | "knowledge">("instructions");

  // Active provider resolution: prioritize first selectedProviderId, then first enabled, then first available
  const activeProvider = useMemo(() => {
    if (selectedProviderIds.length > 0) {
      const match = providers.find((p) => p.id === selectedProviderIds[0]);
      if (match) return match;
    }
    const enabled = providers.find((p) => p.enabled);
    if (enabled) return enabled;
    return providers[0] || null;
  }, [providers, selectedProviderIds]);

  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target as Node)) {
        setProviderDropdownOpen(false);
      }
    };
    if (providerDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [providerDropdownOpen]);

  const activeTheme = getProviderTheme(activeProvider?.id);
  const ActiveProviderIcon = activeProvider?.icon || Bot;
  const activeProviderStatus = getProviderStatusLabel(activeProvider);

  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [selectedFilePaths, setSelectedFilePaths] = useState<Set<string>>(new Set());
  const [fileCategory, setFileCategory] = useState<"all" | "source" | "config" | "docs" | "devkits">("all");
  const [customFilePath, setCustomFilePath] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingInstructions(project.instructions);
  }, [project.instructions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages, isThinking]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text && !attachments.length) return;

    setIsThinking(true);
    try {
      await onSendMessage(text || "Please review the attached project files.", attachments);
    } finally {
      setIsThinking(false);
    }
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const messageTimesRef = useRef<Record<string, string>>({});

  const getMessageTime = (messageId: string) => {
    if (!messageTimesRef.current[messageId]) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      messageTimesRef.current[messageId] = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    return messageTimesRef.current[messageId];
  };

  const handleRollback = (content: string) => {
    setDraft(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  };

  const [reviewStatus, setReviewStatus] = useState<Record<string, "positive" | null>>({});
  const [sharedMessageId, setSharedMessageId] = useState<string | null>(null);

  const handleToggleReview = (messageId: string) => {
    setReviewStatus((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === "positive" ? null : "positive",
    }));
  };

  const handleShare = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setSharedMessageId(messageId);
    setTimeout(() => setSharedMessageId(null), 2000);
  };

  const handleUndoResponse = () => {
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
    }, 1200);
  };

  const handleToggleFile = (path: string) => {
    setSelectedFilePaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleConfirmAddFiles = () => {
    const filesToAdd: Array<Omit<ProjectKnowledgeFile, "id">> = [];

    for (const filePath of selectedFilePaths) {
      const file = AVAILABLE_PROJECT_FILES.find((f) => f.path === filePath);
      if (file) {
        filesToAdd.push({
          name: file.name,
          path: file.path,
          size: file.size,
          description: file.description,
        });
      }
    }

    if (customFilePath.trim()) {
      const trimmed = customFilePath.trim();
      const name = trimmed.split("/").pop()?.split("\\").pop() || trimmed;
      filesToAdd.push({
        name,
        path: trimmed,
        size: "Custom",
        description: "Custom project path",
      });
    }

    filesToAdd.forEach((file) => onAddKnowledgeFile?.(file));

    setSelectedFilePaths(new Set());
    setCustomFilePath("");
    setFileBrowserOpen(false);
  };

  const filteredFiles = useMemo(() => {
    return AVAILABLE_PROJECT_FILES.filter((file) => {
      const matchesCategory = fileCategory === "all" || file.category === fileCategory;
      const q = fileSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        file.name.toLowerCase().includes(q) ||
        file.path.toLowerCase().includes(q) ||
        file.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [fileCategory, fileSearchQuery]);

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".ts") || fileName.endsWith(".tsx") || fileName.endsWith(".js") || fileName.endsWith(".json")) {
      return <FileCode2 className="size-4 text-sky-500" />;
    }
    if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
      return <FileText className="size-4 text-emerald-500" />;
    }
    return <File className="size-4 text-amber-500" />;
  };

  const getMessageProviderInfo = (msg: AgentChatMessage) => {
    const msgObj = msg as AgentChatMessage & { model?: string; providerId?: string };
    if (msgObj.providerId) {
      const found = providers.find((p) => p.id === msgObj.providerId);
      if (found) return { provider: found, model: msgObj.model || found.model, name: found.name };
    }

    const idParts = msg.id.split("-");
    const lastPart = idParts[idParts.length - 1];
    const foundFromId = providers.find((p) => p.id === lastPart);
    if (foundFromId) {
      return { provider: foundFromId, model: foundFromId.model, name: foundFromId.name };
    }

    const contentLower = msg.content.toLowerCase();
    for (const p of providers) {
      if (contentLower.startsWith(p.id + ":") || contentLower.startsWith(`**${p.id}`)) {
        return { provider: p, model: p.model, name: p.name };
      }
    }

    return {
      provider: activeProvider,
      model: activeProvider?.model || "AI Model",
      name: activeProvider?.name || "AI Assistant",
    };
  };

  const starterSuggestions = [
    {
      title: "Inspect Fastify API & Routes",
      desc: "Review route registration and health contracts in server.ts",
      prompt: "Can you analyze the Fastify API route structure and health verification in devkits/codeloop/api/src/server.ts?",
    },
    {
      title: "Check SQLite Identity Store",
      desc: "Verify LocalIdentityStore schema and migration sequence",
      prompt: "Explain how LocalIdentityStore initializes migrations and dev users in CodeLoop.",
    },
    {
      title: "Verify Model Providers",
      desc: "Test connectivity to Ollama, Anthropic, OpenAI, and Codex",
      prompt: "How does POST /api/v1/codeloop/providers/verify validate connection to configured providers like Ollama, Claude, and Codex?",
    },
    {
      title: "Design Agent Workflow Loop",
      desc: "Plan autonomous SWE pipeline within workspace boundaries",
      prompt: "How should we design a repeatable agent loop following devkits/codeloop architecture boundaries?",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Anthropic-style Project Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-4 backdrop-blur-sm lg:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <FolderKanban className="size-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-foreground text-sm truncate max-w-[200px] sm:max-w-xs">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("instructions");
                setShowProjectModal(true);
              }}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
              title="Project instructions"
            >
              <Sparkles className="size-3.5 text-amber-500" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("knowledge");
                setShowProjectModal(true);
              }}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
              title={`${project.knowledgeFiles.length} files in knowledge`}
            >
              <Files className="size-3.5 text-blue-500" />
            </button>

            {onOpenTerminal && (
              <button
                type="button"
                onClick={onOpenTerminal}
                className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer"
                title="Terminal & Background Tasks"
              >
                <TerminalSquare className="size-3.5 text-emerald-500" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unified Provider & Model Selector Dropdown */}
          <div className="relative" ref={providerDropdownRef}>
            <button
              type="button"
              onClick={() => setProviderDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted/80 transition-colors cursor-pointer select-none"
              title="Select AI Provider & Model"
            >
              <div className={`flex size-4 items-center justify-center rounded ${activeTheme.text}`}>
                <ActiveProviderIcon className="size-3.5" />
              </div>

              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span>{activeProvider?.name || "Select Provider"}</span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {activeProvider?.model ? `(${activeProvider.model})` : ""}
                </span>
              </div>

              <span
                className={`size-2 rounded-full ${getProviderStatusDot(activeProvider)}`}
                title={activeProviderStatus}
              />

              <ChevronDown
                className={`size-3 text-muted-foreground transition-transform duration-150 ${
                  providerDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Provider Dropdown Menu */}
            {providerDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-76 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground flex items-center justify-between border-b border-border/50 mb-1">
                  <span>Available Providers ({providers.length})</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    {providers.filter((p) => p.enabled).length} active
                  </span>
                </div>

                <div className="space-y-0.5">
                  {providers.map((prov) => {
                    const ProvIcon = prov.icon || Bot;
                    const isSelected = activeProvider?.id === prov.id;
                    const theme = getProviderTheme(prov.id);

                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => {
                          onProviderSelectionChange([prov.id]);
                          setProviderDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                          isSelected
                            ? "bg-neutral-100 font-medium text-foreground dark:bg-neutral-800"
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`flex size-6 shrink-0 items-center justify-center rounded-md ${theme.bg} ${theme.text}`}>
                            <ProvIcon className="size-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-foreground font-medium">{prov.name}</span>
                              <span className={`size-1.5 shrink-0 rounded-full ${getProviderStatusDot(prov)}`} title={getProviderStatusLabel(prov)} />
                            </div>
                            <span className="truncate text-[10px] text-muted-foreground font-mono">
                              {prov.model}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">
                              {getProviderStatusLabel(prov)}{prov.modelOptions?.length ? ` · ${prov.modelOptions.length} models` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {prov.enabled && prov.connectionStatus === "connected" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-normal"
                            >
                              Live
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={`text-[9px] h-4 px-1.5 py-0 font-normal ${prov.connectionStatus === "checking" ? "text-amber-600 dark:text-amber-400" : prov.connectionStatus === "error" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                            >
                              {getProviderStatusLabel(prov)}
                            </Badge>
                          )}
                          {isSelected && <Check className="size-3.5 text-foreground shrink-0 stroke-[2.5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Project settings & knowledge"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
          {conversation.messages.length === 0 ? (
            /* Anthropic Empty / Welcome State */
            <div className="my-auto flex flex-col items-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400 shadow-sm">
                <Sparkles className="size-7" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {project.name}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>

              {/* Context Pill in Hero */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  <Files className="size-3 text-blue-500" />
                  {project.knowledgeFiles.length} files loaded into context
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  <Sparkles className="size-3 text-amber-500" />
                  Custom project prompt active
                </span>
              </div>

              {/* Prompt Suggestions Grid */}
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 text-left">
                {starterSuggestions.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSendMessage(item.prompt);
                      setIsThinking(true);
                      setTimeout(() => setIsThinking(false), 1200);
                    }}
                    className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 text-left shadow-xs transition-all hover:border-foreground/30 hover:bg-muted/30 hover:shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.desc}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                      <span>Ask {activeProvider?.name || "AI"}</span>
                      <Send className="size-2.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages Stream */
            <div className="space-y-6">
              {/* Project banner inside active chat */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3.5 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <FolderKanban className="size-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    Project context: <strong>{project.name}</strong> ({project.knowledgeFiles.length} files)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="shrink-0 text-[11px] font-medium text-foreground hover:underline"
                >
                  View knowledge
                </button>
              </div>

              {pendingApprovals.length > 0 && (
                <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Approval required</p>
                    <p className="mt-1 text-xs text-muted-foreground">The agent paused before changing your workspace. Review the operation before it runs.</p>
                  </div>
                  {pendingApprovals.map((approval) => (
                    <div key={`${approval.providerId}-${approval.callId}`} className="rounded-lg border border-border/70 bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-foreground">{approval.tool}</div>
                        <div className="text-[11px] text-muted-foreground">{approval.providerId}</div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{approval.reason}</p>
                      <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">{JSON.stringify(approval.arguments, null, 2)}</pre>
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => onRejectTool?.(approval)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Reject</button>
                        <button type="button" onClick={() => void onApproveTool?.(approval)} className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90">Approve and retry</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {conversation.messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`group relative flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    {isUser ? (
                      /* User message bubble (Right-aligned, with hover toolbar: timestamp, copy, rollback) */
                      <div className="ml-auto flex w-full max-w-[85%] sm:max-w-xl flex-col items-end">
                        <div className="group/user-msg relative w-fit max-w-full rounded-2xl bg-neutral-800 text-neutral-100 px-4 py-3 text-sm shadow-xs border border-neutral-700/50 dark:bg-neutral-800 dark:border-neutral-700/50">
                          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

                          {/* Bottom hover tools matching media_1790361892432.png: timestamp hh:mm, copy, rollback */}
                          <div className="mt-2 flex items-center justify-end gap-2 text-neutral-400 opacity-0 group-hover/user-msg:opacity-100 transition-opacity">
                            <span className="text-[11px] font-mono text-neutral-400 select-none">
                              {getMessageTime(message.id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(message.id, message.content)}
                              className="rounded-md p-1 text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                              title="Copy prompt"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="size-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRollback(message.content)}
                              className="rounded-md p-1 text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
                              title="Rollback prompt"
                            >
                              <Undo2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant / AI Model message */
                      <div className="w-full">
                        {(() => {
                          const { provider: msgProvider, model: msgModel, name: msgName } = getMessageProviderInfo(message);
                          const MsgIcon = msgProvider?.icon || Bot;
                          const msgTheme = getProviderTheme(msgProvider?.id);
                          const isApprovalRequired = message.role === "error" && /approval required before/iu.test(message.content);

                          return (
                            <>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={`flex size-5 items-center justify-center rounded-md ${msgTheme.bg} ${msgTheme.text}`}>
                                  <MsgIcon className="size-3" />
                                </div>
                                <span className="text-xs font-semibold text-foreground">
                                  {msgName} <span className="font-mono text-[11px] text-muted-foreground font-normal">({msgModel})</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground">in {project.name}</span>
                                {message.role === "error" && (
                                  <Badge variant={isApprovalRequired ? "outline" : "destructive"} className={`text-[9px] h-4 px-1.5 py-0 font-normal ${isApprovalRequired ? "border-amber-500/50 text-amber-700 dark:text-amber-300" : ""}`}>
                                    {isApprovalRequired ? "Approval pending" : "Error"}
                                  </Badge>
                                )}
                              </div>

                              {/* Runtime Execution Trace Accordion */}
                              {message.trace && message.trace.length > 0 && (
                                <details
                                  className="group/trace my-2 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2 text-xs"
                                  open={false}
                                >
                                  <summary className="flex cursor-pointer select-none items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    <MsgIcon className={`size-3.5 ${msgTheme.text}`} />
                                    <span>{msgName} execution trace ({message.trace.length} step{message.trace.length > 1 ? "s" : ""})</span>
                                    <ChevronDown className="ml-auto size-3.5 transition-transform group-open/trace:rotate-180" />
                                  </summary>
                                  <div className={`mt-2.5 border-l-2 pl-3 font-mono text-[11px] leading-relaxed text-muted-foreground space-y-1 ${msgTheme.border}`}>
                                    {message.trace.map((evt, idx) => (
                                      <div key={idx} className="flex items-start gap-1.5">
                                        <span className={msgTheme.text}>•</span>
                                        <span>{evt.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </>
                          );
                        })()}

                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-1">
                          {message.content}
                        </div>

                        {/* Response Toolbar: only show on hover and subtle dull hover background */}
                        <div className="mt-2.5 flex items-center gap-1 pl-1 text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, message.content)}
                            className="rounded-md p-1 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleReview(message.id)}
                            className={`rounded-md p-1 transition-colors cursor-pointer ${
                              reviewStatus[message.id] === "positive"
                                ? "text-emerald-600 bg-emerald-500/15 dark:text-emerald-400 dark:bg-emerald-500/15"
                                : "text-neutral-500 hover:text-neutral-800 hover:bg-black/5 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10"
                            }`}
                            title={reviewStatus[message.id] === "positive" ? "Reviewed" : "Review response"}
                          >
                            <ThumbsUp className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShare(message.id, message.content)}
                            className="rounded-md p-1 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Share response"
                          >
                            {sharedMessageId === message.id ? (
                              <Check className="size-3.5 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <Share2 className="size-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleUndoResponse}
                            className="rounded-md p-1 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Undo / Retry response"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>

                          <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 select-none ml-1">
                            {getMessageTime(message.id)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {liveActivities.length > 0 && (
                <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Agent activity</span>
                    {(isMessageStreaming || isThinking) && <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Live</span>}
                  </div>
                  <div className="space-y-1.5">
                    {liveActivities.slice(-6).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-2 text-muted-foreground">
                        <span className={`size-1.5 rounded-full ${activity.status === "error" ? "bg-red-500" : activity.status === "active" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                        <span className="font-medium text-foreground">{activity.phase[0].toUpperCase() + activity.phase.slice(1)}</span>
                        <span className="truncate">{activity.message}</span>
                        {activity.durationMs !== undefined && <span className="ml-auto shrink-0 tabular-nums">{activity.durationMs} ms</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {runConnectionState === "reconnecting" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                  <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Connection lost. Resuming the active run…</span>
                  <button type="button" onClick={onRetryRun} className="shrink-0 rounded-md border border-amber-500/40 px-2 py-1 font-medium hover:bg-amber-500/15">Retry</button>
                </div>
              )}
              {runConnectionState === "offline" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-800 dark:text-red-100">
                  <span>CodeLoop lost the live connection. The backend run may still be active.</span>
                  <button type="button" onClick={onRetryRun} className="shrink-0 rounded-md border border-red-500/40 px-2 py-1 font-medium hover:bg-red-500/15">Retry connection</button>
                </div>
              )}

              {isThinking && !liveActivities.length && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                  <Loader2 className="size-3.5 animate-spin text-amber-500" />
                  <span>{activeProvider?.name || "AI"} is thinking with extended reasoning...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Anthropic-style Composer Area */}
      <footer className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Active Project context pill indicator */}
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Project Knowledge active ({project.knowledgeFiles.length} files attached)</span>
            </span>
            <span>Shift + Enter for new line</span>
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
                >
                  <FileText className="size-3 text-blue-500" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Rounded Input Box */}
          <div className="relative flex flex-col rounded-2xl border border-border/80 bg-card shadow-sm focus-within:border-foreground/40 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a question or reply to ${activeProvider?.name || "AI"} in ${project.name}…`}
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
              <div className="flex items-center gap-1">
                {draft && (
                  <button type="button" onClick={() => setDraft("")} className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground" title="Clear prompt">Clear</button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Attach file to conversation"
                >
                  <Paperclip className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("knowledge");
                    setShowProjectModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Files className="size-3.5 text-amber-500" />
                  <span>Knowledge</span>
                </button>

                {onOpenTerminal && (
                  <button
                    type="button"
                    onClick={onOpenTerminal}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="Open Terminal & Background Tasks"
                  >
                    <TerminalSquare className="size-3.5 text-emerald-500" />
                    <span>Terminal</span>
                  </button>
                )}
              </div>

              {/* Anthropic-style Send Button: Black background with white icon */}
              <button
                type="button"
                disabled={isMessageStreaming ? false : isThinking || (!draft.trim() && !attachments.length)}
                onClick={isMessageStreaming ? onStopMessage : handleSend}
                className="flex size-8 items-center justify-center rounded-lg bg-black text-white shadow-xs transition-all hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-black dark:bg-black dark:text-white dark:hover:bg-neutral-900"
                title={isMessageStreaming ? "Stop response" : "Send message"}
              >
                {isMessageStreaming ? <span className="size-3 rounded-sm bg-current" /> : <Send className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Project Knowledge & Instructions Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
                  <FolderKanban className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{project.name}</h3>
                  <p className="text-xs text-muted-foreground">Project Knowledge & Custom Instructions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="mt-4 flex border-b border-border/70">
              <button
                type="button"
                onClick={() => setActiveTab("instructions")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === "instructions"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>Custom Instructions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("knowledge")}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === "knowledge"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Files className="size-3.5 text-blue-500" />
                <span>Project Knowledge ({project.knowledgeFiles.length})</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-0 flex flex-col pt-4 pb-1">
              {activeTab === "instructions" ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground leading-relaxed shrink-0">
                    Custom instructions are included in the prompt for every conversation within this project.
                    Use them to define coding rules, architectural constraints, and response preferences.
                  </p>
                  <textarea
                    value={editingInstructions}
                    onChange={(e) => setEditingInstructions(e.target.value)}
                    className="flex-1 min-h-0 w-full resize-none rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs font-mono text-foreground focus:border-foreground/50 focus:outline-none"
                    placeholder="Provide specific instructions for AI models in this project..."
                  />
                  <div className="flex justify-end gap-2 pt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateProjectInstructions?.(editingInstructions);
                        setShowProjectModal(false);
                      }}
                      className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-black dark:text-white"
                    >
                      Save Instructions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">Project Knowledge Context</p>
                      <p className="text-[11px] text-muted-foreground">
                        Files indexed and available across all chats in this project.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedFilePaths(new Set());
                        setFileSearchQuery("");
                        setFileCategory("all");
                        setCustomFilePath("");
                        setFileBrowserOpen(true);
                      }}
                      className="h-7.5 gap-1.5 rounded-lg bg-black px-3 text-xs font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-black dark:text-white"
                    >
                      <Plus className="size-3.5" />
                      <span>Browse Files</span>
                    </Button>
                  </div>

                  {project.knowledgeFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/80 bg-muted/10">
                      <FolderOpen className="size-8 text-muted-foreground/40 mb-2" />
                      <p className="text-xs font-medium text-foreground">No knowledge files mapped yet</p>
                      <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5 mb-3">
                        Map repository files to provide project context and guidelines across all chats.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedFilePaths(new Set());
                          setFileSearchQuery("");
                          setFileCategory("all");
                          setCustomFilePath("");
                          setFileBrowserOpen(true);
                        }}
                        className="h-7.5 gap-1.5 rounded-lg bg-black px-3 text-xs font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-black dark:text-white"
                      >
                        <Plus className="size-3.5" />
                        <span>Browse Project Files</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden">
                      {project.knowledgeFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 text-xs hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(file.name)}
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">{file.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{file.path} • {file.size}</div>
                            </div>
                          </div>
                          {onRemoveKnowledgeFile && (
                            <button
                              type="button"
                              onClick={() => onRemoveKnowledgeFile(file.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                              title="Remove file from project"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Browser Dialog to Map Project Files */}
      <Dialog open={fileBrowserOpen} onOpenChange={setFileBrowserOpen}>
        <DialogContent className="z-[60] sm:max-w-2xl w-full p-6 gap-4">
          <DialogHeader className="gap-1.5 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
                <FolderOpen className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Browse Project Files
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select files from the repository to map into {project.name}&apos;s shared knowledge.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Search bar and Category pills */}
          <div className="flex flex-col gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search files by name, path, or description..."
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {fileSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFileSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(["all", "source", "config", "docs", "devkits"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFileCategory(cat)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    fileCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "All Files" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* File list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/50 rounded-xl border border-border/70 bg-card">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No matching project files found.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isAlreadyMapped = project.knowledgeFiles.some(
                  (kf) =>
                    kf.path.toLowerCase() === file.path.toLowerCase() ||
                    kf.name.toLowerCase() === file.name.toLowerCase()
                );
                const isSelected = selectedFilePaths.has(file.path);

                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      if (!isAlreadyMapped) {
                        handleToggleFile(file.path);
                      }
                    }}
                    className={`flex items-center justify-between gap-3 p-2.5 text-xs transition-colors ${
                      isAlreadyMapped
                        ? "opacity-60 bg-muted/15 cursor-not-allowed"
                        : isSelected
                        ? "bg-neutral-100 dark:bg-neutral-800/60 cursor-pointer"
                        : "hover:bg-muted/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex size-4 items-center justify-center rounded border transition-colors shrink-0 ${
                          isAlreadyMapped
                            ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                            : isSelected
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-border bg-background"
                        }`}
                      >
                        {(isSelected || isAlreadyMapped) && <Check className="size-2.5 stroke-[2.5]" />}
                      </div>
                      <div className="shrink-0">{getFileIcon(file.name)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">{file.name}</span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-mono py-0 px-1 h-3.5 text-muted-foreground"
                          >
                            {file.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{file.path}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground font-mono">{file.size}</span>
                      {isAlreadyMapped ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 h-4.5 text-muted-foreground bg-muted"
                        >
                          Mapped
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground hidden sm:inline max-w-[140px] truncate">
                          {file.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Custom path fallback */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Or specify a custom file path:
            </span>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. devkits/codeloop/api/src/routes.ts"
                value={customFilePath}
                onChange={(e) => setCustomFilePath(e.target.value)}
                className="h-8 text-xs font-mono pr-7"
              />
              {customFilePath && (
                <button
                  type="button"
                  onClick={() => setCustomFilePath("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Dialog Footer with Shadcn Actions */}
          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <div className="text-xs text-muted-foreground">
              {selectedFilePaths.size > 0 || customFilePath.trim() ? (
                <span className="font-medium text-foreground">
                  {selectedFilePaths.size + (customFilePath.trim() ? 1 : 0)} file
                  {selectedFilePaths.size + (customFilePath.trim() ? 1 : 0) > 1 ? "s" : ""} selected
                </span>
              ) : (
                <span>No files selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFileBrowserOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedFilePaths.size === 0 && !customFilePath.trim()}
                onClick={handleConfirmAddFiles}
                className="h-8 rounded-lg bg-black px-4 text-xs font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-black dark:text-white dark:hover:bg-neutral-900 disabled:opacity-40"
              >
                Map to Knowledge {selectedFilePaths.size > 0 && `(${selectedFilePaths.size})`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
