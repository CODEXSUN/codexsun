import { MainWorkspace, type MdiNavigationSection } from "@codexsun/ui";
import { SessionBoundary, type AuthenticatedRequest } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { WorkspacePageHeader } from "@codexsun/ui/blocks/workspace";
import {
  AgentProviderSettings,
  type AgentProviderSettingsItem,
  type AgentProviderSmokeTestResult,
  type AgentProviderVerificationResult,
} from "@codexsun/ui/blocks/agent-provider-settings";
import { CodeloopChatWorkspace, type PendingToolApproval } from "./codeloop-chat-workspace";
import { TerminalWorkspace } from "./terminal-workspace";
import { TaskActivity } from "./task-activity";
import { ChangesDesk, HistoryDesk, WorkspaceFilesDesk } from "./workspace-desks";
import { initialConversations, initialProject, initialProjectsList, type ProjectWorkspaceItem } from "./initial-project-data";
import { applyLiveActivity, type LiveActivity, type LiveActivityEvent } from "./live-activity";
import type { ProjectConversation, ProjectDetails, ProjectKnowledgeFile } from "./types";
import type { AgentChatMessage } from "@codexsun/ui/blocks/agent-chat-workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codexsun/ui/components/dialog";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@codexsun/ui/components/hover-card";
import {
  Bot,
  BrainCircuit,
  ChevronDown,
  FileCode2,
  Files,
  Folder,
  FolderGit2,
  FolderOpen,
  GitBranch,
  Globe2,
  HardDrive,
  History,
  KeyRound,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  ServerCog,
  Settings,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  TerminalSquare,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AgentTool = "run" | "files" | "changes" | "history" | "providers" | "terminal";

type ProviderStatusResponse = {
  providerId: string;
  result: AgentProviderVerificationResult;
};

const initialProviderSettings: readonly AgentProviderSettingsItem[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Use Claude models with extended thinking for planning, architecture, and coding tasks.",
    enabled: true,
    endpoint: "https://api.anthropic.com",
    icon: BrainCircuit,
    model: "Claude 3.7 Sonnet",
    apiKeyConfigured: true,
  },
  {
    id: "codex",
    name: "Codex CLI",
    description: "Use the local Codex runtime for workspace-aware coding tasks.",
    enabled: true,
    endpoint: "Local runtime",
    icon: Bot,
    model: "Default",
    apiKeyConfigured: true,
  },
  {
    id: "openai",
    name: "OpenAI API",
    description: "Connect an OpenAI model through a workspace-managed API endpoint.",
    enabled: false,
    endpoint: "https://api.openai.com/v1",
    icon: Sparkles,
    model: "gpt-5.6-sol",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Use Gemini models for context-heavy analysis and code generation.",
    enabled: false,
    endpoint: "https://generativelanguage.googleapis.com",
    icon: Globe2,
    model: "Gemini Pro",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Route workspace tasks to the configured model catalog.",
    enabled: false,
    endpoint: "https://openrouter.ai/api/v1",
    icon: KeyRound,
    model: "Auto",
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Use AgentCrew's Docker-hosted Ollama service for private development runs.",
    enabled: false,
    endpoint: "http://127.0.0.1:6411",
    icon: ServerCog,
    model: "qwen3:4b",
    apiKeyLabel: "AgentCrew access token",
    apiKeyPlaceholder: "Paste the generated AgentCrew token",
  },
];

export function App() {
  return (
    <SessionBoundary
      applicationId="codeloop"
      applicationName="CodeLoop"
      autoLoginPath="/api/v1/codeloop/auth/development-login"
      loginPath="/api/v1/codeloop/auth/login"
    >
      {(session) =>
        session.portal === "super-admin" ? (
          <IdentityManagementDesk
            applicationId="codeloop"
            applicationName="CodeLoop"
            logout={session.logout}
            request={session.fetch}
          />
        ) : session.portal === "admin" ? (
          <PrivilegedDesk
            applicationId="codeloop"
            applicationName="CodeLoop"
            logout={session.logout}
            portal={session.portal}
          />
        ) : (
          <Desk logout={session.logout} request={session.fetch} />
        )
      }
    </SessionBoundary>
  );
}

function Desk({ logout, request }: { logout(): void; request: AuthenticatedRequest }) {
  const [activeTool, setActiveTool] = useState<AgentTool>("run");
  const [providerSettings, setProviderSettings] =
    useState<readonly AgentProviderSettingsItem[]>(initialProviderSettings);
  const [project, setProject] = useState<ProjectDetails>(initialProject);
  const [projectsList, setProjectsList] = useState<ProjectWorkspaceItem[]>(initialProjectsList);
  const [conversations, setConversations] = useState<ProjectConversation[]>(initialConversations);
  const [conversationProviderIds, setConversationProviderIds] = useState<readonly string[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingToolApproval[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [isMessageStreaming, setIsMessageStreaming] = useState(false);
  const [runConnectionState, setRunConnectionState] = useState<"connected" | "reconnecting" | "offline" | "idle">("idle");
  const [runReplayNonce, setRunReplayNonce] = useState(0);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  // Active project & expanded projects set (codexsun expanded by default)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("codexsun");
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set(["codexsun"]));

  const [activeConversationId, setActiveConversationId] = useState<string>("");

  // Projects section collapse state
  const [isProjectsSectionOpen, setIsProjectsSectionOpen] = useState(true);
  const [showProjectActionsMenu, setShowProjectActionsMenu] = useState(false);
  const [showConnectProjectModal, setShowConnectProjectModal] = useState(false);
  const [connectProjectName, setConnectProjectName] = useState("");
  const [connectProjectSource, setConnectProjectSource] = useState<"local" | "cloud">("local");
  const [connectProjectPath, setConnectProjectPath] = useState("");
  const [connectProjectRepository, setConnectProjectRepository] = useState("");
  const [connectProjectError, setConnectProjectError] = useState("");
  const [connectingProject, setConnectingProject] = useState(false);

  // Accordion state: ALWAYS collapsed by default, only open on click
  const [isProjectKnowledgeOpen, setIsProjectKnowledgeOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Workspace Settings modal state
  const [showWorkspaceSettingsModal, setShowWorkspaceSettingsModal] = useState(false);

  const projectMenuRef = useRef<HTMLDivElement>(null);
  const messageControllerRef = useRef<AbortController | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const providerSettingsRef = useRef(providerSettings);
  providerSettingsRef.current = providerSettings;

  const syncProviderStatus = useCallback(async (providersToCheck?: readonly AgentProviderSettingsItem[]): Promise<void> => {
    const sourceProviders = providersToCheck ?? providerSettingsRef.current;
    const enabledProviders = sourceProviders.filter((provider) => provider.enabled);
    if (!enabledProviders.length) {
      setProviderSettings((current) => current.map((provider) => ({ ...provider, connectionStatus: provider.enabled ? provider.connectionStatus : "idle", connectionMessage: provider.enabled ? provider.connectionMessage : "Provider disabled." })));
      return;
    }

    setProviderSettings((current) => current.map((provider) => enabledProviders.some((item) => item.id === provider.id) ? { ...provider, connectionStatus: "checking", connectionMessage: "Checking connection…" } : provider));
    try {
      const response = await request("/api/v1/codeloop/providers/verify-many", {
        body: JSON.stringify({ providers: enabledProviders.map(({ endpoint, model, id: providerId }) => ({ endpoint, model, providerId })) }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Provider status could not be refreshed.");
      const body = await response.json() as { results?: ProviderStatusResponse[] };
      const results = new Map((body.results ?? []).map((item) => [item.providerId, item.result]));
      setProviderSettings((current) => current.map((provider) => {
        if (!provider.enabled) return { ...provider, connectionStatus: "idle", connectionMessage: "Provider disabled." };
        const result = results.get(provider.id);
        if (!result) return provider;
        return {
          ...provider,
          connectionMessage: result.message,
          connectionStatus: result.status,
          modelOptions: result.models?.length ? result.models : provider.modelOptions,
        };
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider status could not be refreshed.";
      setProviderSettings((current) => current.map((provider) => enabledProviders.some((item) => item.id === provider.id) && provider.enabled ? { ...provider, connectionStatus: "error", connectionMessage: message } : provider));
    }
  }, [request]);

  const syncProviderLiveStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await request("/api/v1/codeloop/providers/live-status");
      if (!response.ok) return;
      const body = await response.json() as { results?: ProviderStatusResponse[] };
      const results = new Map((body.results ?? []).map((item) => [item.providerId, item.result]));
      setProviderSettings((current) => current.map((provider) => {
        if (!provider.enabled) return { ...provider, connectionStatus: "idle", connectionMessage: "Provider disabled." };
        const result = results.get(provider.id);
        return result ? { ...provider, connectionStatus: result.status, connectionMessage: result.message, modelOptions: result.models?.length ? result.models : provider.modelOptions } : provider;
      }));
    } catch {
      // Keep the last known provider state during a short CodeLoop API restart.
    }
  }, [request]);

  // Close popup menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectActionsMenu(false);
      }
    }
    if (showProjectActionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProjectActionsMenu]);

  // Active conversation resolution
  const activeConversation = useMemo(() => {
    return (
      conversations.find((c) => c.id === activeConversationId) ||
      conversations[0] || {
        id: "conv-default",
        projectId: selectedProjectId,
        title: "New conversation",
        updatedAt: "Just now",
        messages: [],
      }
    );
  }, [conversations, activeConversationId, selectedProjectId]);

  // Load conversations from SQLite database
  useEffect(() => {
    let cancelled = false;
    async function loadConversations() {
      try {
        const response = await request(
          `/api/v1/codeloop/conversations?projectId=${encodeURIComponent(selectedProjectId)}`
        );
        if (!response.ok) return;
        const body = (await response.json()) as {
          conversations?: Array<{
            id: string;
            projectId: string;
            title: string;
            status: "idle" | "running" | "completed";
            createdAt: string;
            updatedAt: string;
          }>;
        };
        if (cancelled || !body.conversations) return;

        if (body.conversations.length === 0) {
          // Auto-create initial real conversation in SQLite
          const createRes = await request("/api/v1/codeloop/conversations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              projectId: selectedProjectId,
              title: "New conversation",
            }),
          });
          if (createRes.ok) {
            const createBody = (await createRes.json()) as {
              conversation: {
                id: string;
                projectId: string;
                title: string;
                status: "idle" | "running" | "completed";
              };
            };
            if (!cancelled && createBody.conversation) {
              const fresh: ProjectConversation = {
                id: createBody.conversation.id,
                projectId: createBody.conversation.projectId,
                title: createBody.conversation.title,
                updatedAt: "Just now",
                status: createBody.conversation.status,
                messages: [],
              };
              setConversations([fresh]);
              setActiveConversationId(fresh.id);
            }
          }
        } else {
          setConversations((prev) => {
            const byId = new Map(prev.map((c) => [c.id, c]));
            return body.conversations!.map((c) => {
              const existing = byId.get(c.id);
              return {
                id: c.id,
                projectId: c.projectId,
                title: c.title,
                status: c.status,
                updatedAt: existing?.updatedAt || "Recently",
                pinned: existing?.pinned,
                unread: existing?.unread,
                messages: existing?.messages || [],
              };
            });
          });
          setActiveConversationId((curr) => {
            if (curr && body.conversations!.some((c) => c.id === curr)) return curr;
            return body.conversations![0]?.id || "";
          });
        }
      } catch (err) {
        console.error("Failed to load conversations from SQLite:", err);
      }
    }
    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, request]);

  // Load active conversation messages from SQLite when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;
    setPendingApprovals([]);
    let cancelled = false;
    async function loadActiveMessages() {
      try {
        const response = await request(
          `/api/v1/codeloop/conversations/${encodeURIComponent(activeConversationId)}`
        );
        if (!response.ok) return;
        const body = (await response.json()) as {
          conversation?: {
            id: string;
            projectId: string;
            title: string;
            status: "idle" | "running" | "completed";
            messages?: Array<{
              id: string;
              role: "user" | "assistant" | "error";
              content: string;
              trace?: Array<{ type: string; message: string; data?: unknown }>;
              createdAt: string;
            }>;
          };
        };
        if (cancelled || !body.conversation) return;
        const convData = body.conversation;
        setPendingApprovals(restorePendingApprovals(convData.messages ?? []));
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convData.id) return c;
            return {
              ...c,
              title: convData.title,
              status: convData.status,
              messages: (convData.messages || []).map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                trace: mapConversationTrace(m.trace),
              })),
            };
          })
        );
      } catch (err) {
        console.error("Failed to load conversation details:", err);
      }
    }
    void loadActiveMessages();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, request]);

  useEffect(() => {
    let cancelled = false;
    void request("/api/v1/codeloop/providers")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load provider settings.");
        const body = await response.json() as { providers?: Array<{ providerId: string; enabled: boolean; endpoint: string; model: string; apiKeyConfigured: boolean; apiKeyHint?: string }> };
        if (cancelled || !body.providers) return;
        const nextProviders = providerSettingsRef.current.map((provider) => {
          const saved = body.providers?.find((item) => item.providerId === provider.id);
          return saved ? { ...provider, enabled: saved.enabled, endpoint: saved.endpoint, model: saved.model, apiKeyConfigured: saved.apiKeyConfigured, apiKeyHint: saved.apiKeyHint } : provider;
        });
        setProviderSettings(nextProviders);
        setProvidersLoaded(true);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [request, syncProviderStatus]);

  useEffect(() => {
    let cancelled = false;
    void request("/api/v1/codeloop/projects")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load projects.");
        const body = await response.json() as { projects?: Array<ProjectWorkspaceItem & { instructions?: string; knowledgeFiles?: ProjectKnowledgeFile[] }> };
        if (cancelled || !body.projects?.length) return;
        setProjectsList(body.projects);
        const selected = body.projects.find((item) => item.id === selectedProjectId) ?? body.projects[0];
        setSelectedProjectId(selected.id);
        setProject((current) => ({
          ...current,
          id: selected.id,
          name: selected.name,
          description: selected.description ?? current.description,
          instructions: selected.instructions ?? current.instructions,
          knowledgeFiles: selected.knowledgeFiles ?? [],
        }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [request]);

  useEffect(() => {
    if (!providersLoaded) return;
    void syncProviderLiveStatus();
    const interval = window.setInterval(() => void syncProviderLiveStatus(), 5000);
    return () => window.clearInterval(interval);
  }, [providersLoaded, syncProviderLiveStatus]);

  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;
    void request(`/api/v1/codeloop/conversations/${encodeURIComponent(activeConversationId)}/providers`)
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json() as { providers?: Array<{ providerId: string }> };
        if (!cancelled && body.providers?.length) setConversationProviderIds(body.providers.map((provider) => provider.providerId));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeConversationId, request]);

  const saveConversationProviders = async (providerIds: readonly string[]) => {
    if (!activeConversation.id) return;
    const previousProviderIds = conversationProviderIds;
    setConversationProviderIds(providerIds);
    const bindings = providerIds.map((providerId) => providerSettings.find((provider) => provider.id === providerId)).filter((provider): provider is AgentProviderSettingsItem => Boolean(provider)).map((provider) => ({ model: provider.model, providerId: provider.id }));
    const response = await request(`/api/v1/codeloop/conversations/${encodeURIComponent(activeConversation.id)}/providers`, { body: JSON.stringify({ providers: bindings }), headers: { "content-type": "application/json" }, method: "PUT" });
    if (!response.ok) {
      setConversationProviderIds(previousProviderIds);
      throw new Error("Conversation providers could not be saved.");
    }
  };

  // Toggle expand / collapse and select project
  const handleToggleProject = (projId: string) => {
    setSelectedProjectId(projId);
    setConversations([]);
    setActiveConversationId("");
    setConversationProviderIds([]);
    const targetProject = projectsList.find((p) => p.id === projId);
    if (targetProject) {
      setProject((prev) => ({
        ...prev,
        id: targetProject.id,
        name: targetProject.name,
        description: targetProject.description || `Context and tools for ${targetProject.name}`,
        instructions: targetProject.instructions || `You are an AI assistant operating in ${targetProject.name}. Follow CODEXSUN repository rules for ${targetProject.path}.`,
        knowledgeFiles: targetProject.knowledgeFiles || [],
      }));
    }

    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projId)) {
        next.delete(projId); // Collapse on click if already open
      } else {
        next.add(projId); // Expand on click
      }
      return next;
    });
  };

  // Handler: Create new conversation in a specific project
  const handleCreateNewConversationInProject = async (projId: string) => {
    const targetProject = projectsList.find((p) => p.id === projId) || projectsList[0];
    try {
      const response = await request("/api/v1/codeloop/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: projId,
          title: "New conversation",
        }),
      });
      if (response.ok) {
        const body = (await response.json()) as {
          conversation: {
            id: string;
            projectId: string;
            title: string;
            status: "idle" | "running" | "completed";
          };
        };
        const created = body.conversation;
        const newConv: ProjectConversation = {
          id: created.id,
          projectId: created.projectId,
          title: created.title,
          updatedAt: "Just now",
          status: created.status,
          messages: [],
        };
        setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        setSelectedProjectId(projId);
        setExpandedProjectIds((prev) => new Set([...prev, projId]));
        setActiveConversationId(created.id);
        setActiveTool("run");
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
    setProject((prev) => ({
      ...prev,
      id: targetProject.id,
      name: targetProject.name,
      description: targetProject.description || `Context and tools for ${targetProject.name}`,
      instructions: targetProject.instructions || `You are an AI assistant operating in ${targetProject.name}. Follow CODEXSUN repository rules for ${targetProject.path}.`,
      knowledgeFiles: targetProject.knowledgeFiles || [],
    }));
  };

  // Handler: Create new conversation from top button
  const handleCreateNewConversation = () => {
    setPendingApprovals([]);
    handleCreateNewConversationInProject(selectedProjectId);
  };

  const handleConnectProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setConnectingProject(true);
    setConnectProjectError("");
    try {
      const response = await request("/api/v1/codeloop/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: connectProjectName, sourceType: connectProjectSource, path: connectProjectPath || undefined, repository: connectProjectRepository || undefined }),
      });
      const body = await response.json() as { project?: ProjectWorkspaceItem; error?: string };
      if (!response.ok || !body.project) throw new Error(body.error ?? "Project could not be connected.");
      const connected = body.project;
      setProjectsList((current) => [...current.filter((item) => item.id !== connected.id), connected]);
      setSelectedProjectId(connected.id);
      setExpandedProjectIds((current) => new Set([...current, connected.id]));
      setConversations([]);
      setActiveConversationId("");
      setConversationProviderIds([]);
      setProject((current) => ({ ...current, id: connected.id, name: connected.name, description: connected.description ?? current.description, instructions: connected.instructions ?? current.instructions, knowledgeFiles: connected.knowledgeFiles ?? [] }));
      setShowConnectProjectModal(false);
      setConnectProjectName("");
      setConnectProjectPath("");
      setConnectProjectRepository("");
    } catch (error) {
      setConnectProjectError(error instanceof Error ? error.message : "Project could not be connected.");
    } finally {
      setConnectingProject(false);
    }
  };

  // Keyboard shortcut Ctrl+N / Cmd+N (and Ctrl+K) for new conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "n" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        handleCreateNewConversation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProjectId]);

  // Handler: Delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await request(`/api/v1/codeloop/conversations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }

    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        void handleCreateNewConversationInProject(selectedProjectId);
        return [];
      }
      if (activeConversationId === id) {
        setActiveConversationId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Rename Dialog state (shadcn Dialog)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState("");

  // Handler: Open rename dialog
  const handleOpenRenameDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = conversations.find((c) => c.id === id);
    if (!current) return;
    setRenamingConversationId(id);
    setRenameTitleInput(current.title);
    setRenameDialogOpen(true);
  };

  // Handler: Save rename
  const handleSaveRename = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (renamingConversationId && renameTitleInput.trim()) {
      const targetId = renamingConversationId;
      const newTitle = renameTitleInput.trim();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, title: newTitle } : c
        )
      );
      try {
        await request(`/api/v1/codeloop/conversations/${encodeURIComponent(targetId)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
      } catch (err) {
        console.error("Failed to rename conversation:", err);
      }
    }
    setRenameDialogOpen(false);
    setRenamingConversationId(null);
  };

  // Handler: Send the conversation to the selected provider runtimes.
  const handleSendMessage = async (content: string, _attachments?: File[], approvedTools: readonly string[] = [], persistUser = true) => {
    if (messageControllerRef.current) return;
    const controller = new AbortController();
    messageControllerRef.current = controller;
    setIsMessageStreaming(true);
    setRunConnectionState("connected");
    setLiveActivities([{ id: "request", phase: "working", status: "active", message: "Working" }]);
    const targetConvId = activeConversation.id;
    const userMsg: AgentChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: content,
    };

    const currentTitle = activeConversation.title;
    const updatedTitle =
      currentTitle === "New conversation"
        ? content.slice(0, 32).trim() + (content.length > 32 ? "…" : "")
        : currentTitle;

    const history = persistUser
      ? [...activeConversation.messages.filter((message) => message.role !== "error").slice(-4).map((message) => ({ content: message.content.slice(-1200), role: message.role as "assistant" | "user" })), { content, role: "user" as const }]
      : activeConversation.messages.filter((message) => message.role !== "error").slice(-6).map((message) => ({ content: message.content.slice(-1200), role: message.role as "assistant" | "user" }));
    setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, title: persistUser ? updatedTitle : c.title, updatedAt: "Just now", status: "running", messages: persistUser ? [...c.messages, userMsg] : c.messages } : c));
    if (persistUser) setPendingApprovals([]);
    let activeRunId: string | undefined;
    let reconnectRun: (() => Promise<boolean>) | undefined;
    let completed: { responses?: Array<{ content?: string; message: string; model: string; providerId: string; status: "completed" | "error"; pendingApprovals?: PendingToolApproval[] }>; messages?: Array<{ id: string; role: "user" | "assistant" | "error"; content: string; trace?: Array<{ type: string; message: string; data?: unknown }> }> } | undefined;
    try {
      const response = await request(`/api/v1/codeloop/conversations/${encodeURIComponent(targetConvId)}/messages`, {
        body: JSON.stringify({
          messages: history,
          projectContext: `${project.instructions.slice(0, 1200)}\nProject: ${project.name}`,
          knowledgePaths: project.knowledgeFiles.map((file) => file.path),
          providerIds: conversationProviderIds.length ? conversationProviderIds : providerSettings.filter((provider) => provider.enabled).map((provider) => provider.id),
          approvedTools,
          persistUser,
          stream: true,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let lastRunSeq = 0;
        const appendToken = (providerId: string, token: string) => {
          if (!token) return;
          setConversations((prev) => prev.map((c) => {
            if (c.id !== targetConvId) return c;
            const existing = c.messages.find((message) => message.id === `stream-${providerId}`);
            if (existing) return { ...c, messages: c.messages.map((message) => message.id === `stream-${providerId}` ? { ...message, content: `${message.content}${token}` } : message) };
            return { ...c, messages: [...c.messages, { id: `stream-${providerId}`, role: "assistant" as const, content: `**${providerId}**\n\n${token}` }] };
          }));
        };
        const applyEvent = (event: { type?: string; runId?: string; seq?: number; providerId?: string; content?: string; pending?: PendingToolApproval[]; phase?: LiveActivityEvent["phase"]; status?: LiveActivityEvent["status"]; message?: string; tool?: string; callId?: string; durationMs?: number; messages?: typeof completed extends infer T ? T extends { messages?: infer M } ? M : never : never; responses?: typeof completed extends infer T ? T extends { responses?: infer R } ? R : never : never }) => {
          if (event.runId) { activeRunId = event.runId; activeRunIdRef.current = event.runId; }
          if (event.seq) lastRunSeq = Math.max(lastRunSeq, event.seq);
          if (event.type === "token" && event.providerId) appendToken(event.providerId, event.content ?? "");
          if (event.type === "activity" && event.phase && event.status && event.message) {
            const activityEvent: LiveActivityEvent = { type: "activity", providerId: event.providerId, phase: event.phase, status: event.status, message: event.message, tool: event.tool, callId: event.callId, durationMs: event.durationMs };
            setLiveActivities((current) => applyLiveActivity(current, activityEvent));
          }
          if (event.type === "approval_required" && event.pending) setPendingApprovals((current) => [...current, ...event.pending!.filter((item) => !current.some((existing) => existing.callId === item.callId))]);
          if (event.type === "complete") completed = event as typeof completed;
        };
        reconnectRun = async (): Promise<boolean> => {
          if (!activeRunId) return false;
          setRunConnectionState("reconnecting");
          for (let attempt = 0; attempt < 90; attempt++) {
            const recovery = await request(`/api/v1/codeloop/conversations/${encodeURIComponent(targetConvId)}/runs/${encodeURIComponent(activeRunId)}/events?after=${lastRunSeq}`);
            if (!recovery.ok) return false;
            const body = await recovery.json() as { run?: { status: string; events: Array<{ seq: number; type: string; payload: Record<string, unknown> }> } };
            for (const stored of body.run?.events ?? []) applyEvent({ ...stored.payload, seq: stored.seq } as Parameters<typeof applyEvent>[0]);
            if (body.run?.status !== "running") {
              if (completed) setRunConnectionState("connected");
              return Boolean(completed);
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          setRunConnectionState("offline");
          return false;
        };
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          buffer += decoder.decode(next.value, { stream: true });
          const lines = buffer.split(/\r?\n/u);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              applyEvent(JSON.parse(line.slice(5).trim()) as Parameters<typeof applyEvent>[0]);
            } catch { /* wait for the next complete SSE frame */ }
          }
        }
        if (!completed?.responses) throw new Error("No provider response was returned.");
        setPendingApprovals(completed.responses.flatMap((result) => result.pendingApprovals ?? []));
        if (completed.messages && completed.messages.length > 0) {
          setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, status: "completed", unread: activeConversationId !== targetConvId, messages: completed!.messages!.map((m) => ({ id: m.id, role: m.role, content: m.content, trace: mapConversationTrace(m.trace) })) } : c));
        }
      } else {
        const body = await response.json() as {
        responses?: Array<{ content?: string; message: string; model: string; providerId: string; status: "completed" | "error"; pendingApprovals?: PendingToolApproval[] }>;
        messages?: Array<{ id: string; role: "user" | "assistant" | "error"; content: string; trace?: Array<{ type: string; message: string; data?: unknown }> }>;
        };
        if (!response.ok || !body.responses) throw new Error("No provider response was returned.");
        setPendingApprovals(body.responses.flatMap((result) => result.pendingApprovals ?? []));
        if (body.messages && body.messages.length > 0) {
          setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, status: "completed", unread: activeConversationId !== targetConvId, messages: body.messages!.map((m) => ({ id: m.id, role: m.role, content: m.content, trace: mapConversationTrace(m.trace) })) } : c));
        } else {
          const assistantMessages: AgentChatMessage[] = body.responses.map((result) => ({ id: `msg-${Date.now()}-${result.providerId}`, role: result.status === "completed" ? "assistant" : "error", content: result.status === "completed" ? `**${result.providerId} · ${result.model}**\n\n${result.content ?? ""}` : `${result.providerId}: ${result.message}`, trace: [{ type: result.status === "completed" ? "complete" : "error", message: result.message }] }));
          setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, status: "completed", unread: activeConversationId !== targetConvId, messages: [...c.messages, ...assistantMessages] } : c));
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (reconnectRun && await reconnectRun()) {
        if (completed?.messages && completed.messages.length > 0) setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, status: "completed", messages: completed!.messages!.map((m) => ({ id: m.id, role: m.role, content: m.content, trace: mapConversationTrace(m.trace) })) } : c));
        return;
      }
      setRunConnectionState("offline");
      const message: AgentChatMessage = { id: `msg-${Date.now()}-error`, role: "error", content: error instanceof Error ? error.message : "Provider response failed." };
      setConversations((prev) => prev.map((c) => c.id === targetConvId ? { ...c, status: "completed", messages: [...c.messages, message] } : c));
    } finally {
      setIsMessageStreaming(false);
      setLiveActivities((current) => current.map((item) => item.status === "active" ? { ...item, status: "complete" } : item));
      activeRunIdRef.current = null;
      if (!isMessageStreaming) setRunConnectionState("idle");
      if (messageControllerRef.current === controller) messageControllerRef.current = null;
    }
  };

  const handleApproveTool = async (approval: PendingToolApproval) => {
    const latestUser = [...activeConversation.messages].reverse().find((message) => message.role === "user");
    if (!latestUser) return;
    setPendingApprovals((current) => current.filter((item) => item.callId !== approval.callId));
    await handleSendMessage(latestUser.content, undefined, [approval.tool], false);
  };

  const handleStopMessage = async () => {
    const runId = activeRunIdRef.current;
    messageControllerRef.current?.abort();
    if (runId) {
      await request(`/api/v1/codeloop/conversations/${encodeURIComponent(activeConversation.id)}/runs/${encodeURIComponent(runId)}/cancel`, { method: "POST" });
    }
  };

  useEffect(() => {
    if (!activeConversationId) return;
    let stopped = false;
    let runId: string | undefined;
    let afterSeq = 0;
    const replay = async () => {
      const activeResponse = await request(`/api/v1/codeloop/conversations/${encodeURIComponent(activeConversationId)}/runs/active`);
      if (!activeResponse.ok) { setRunConnectionState("offline"); return; }
      const activeBody = await activeResponse.json() as { run?: { id: string } | null };
      if (!activeBody.run || stopped) return;
      runId = activeBody.run.id;
      activeRunIdRef.current = runId;
      setIsMessageStreaming(true);
      setRunConnectionState("reconnecting");
      while (!stopped && runId) {
        const response = await request(`/api/v1/codeloop/conversations/${encodeURIComponent(activeConversationId)}/runs/${encodeURIComponent(runId)}/events?after=${afterSeq}`);
        if (!response.ok) { setRunConnectionState("offline"); return; }
        const body = await response.json() as { run: { status: string; events: Array<{ seq: number; type: string; payload: Record<string, unknown> }> } };
        for (const stored of body.run.events) {
          afterSeq = Math.max(afterSeq, stored.seq);
          const event = stored.payload;
          if (event.type === "activity" && typeof event.phase === "string" && typeof event.status === "string" && typeof event.message === "string") {
            setLiveActivities((current) => applyLiveActivity(current, { type: "activity", providerId: typeof event.providerId === "string" ? event.providerId : undefined, phase: event.phase as LiveActivityEvent["phase"], status: event.status as LiveActivityEvent["status"], message: event.message as string, tool: typeof event.tool === "string" ? event.tool : undefined, callId: typeof event.callId === "string" ? event.callId : undefined, durationMs: typeof event.durationMs === "number" ? event.durationMs : undefined }));
          }
          if (event.type === "token" && typeof event.providerId === "string") {
            setConversations((current) => current.map((conversation) => {
              if (conversation.id !== activeConversationId) return conversation;
              const id = `stream-${event.providerId}`;
              const token = typeof event.content === "string" ? event.content : "";
              const existing = conversation.messages.find((message) => message.id === id);
              return existing ? { ...conversation, messages: conversation.messages.map((message) => message.id === id ? { ...message, content: `${message.content}${token}` } : message) } : { ...conversation, messages: [...conversation.messages, { id, role: "assistant" as const, content: `**${event.providerId}**\n\n${token}` }] };
            }));
          }
          if (event.type === "complete" && Array.isArray(event.messages)) {
            const messages = event.messages as Array<{ id: string; role: "user" | "assistant" | "error"; content: string; trace?: Array<{ type: string; message: string; data?: unknown }> }>;
            setConversations((current) => current.map((conversation) => conversation.id === activeConversationId ? { ...conversation, status: "completed", messages: messages.map((message) => ({ ...message, trace: mapConversationTrace(message.trace) })) } : conversation));
          }
        }
        if (body.run.status !== "running") break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (!stopped) {
        setIsMessageStreaming(false);
        setRunConnectionState("connected");
        activeRunIdRef.current = null;
      }
    };
    void replay();
    return () => { stopped = true; };
  }, [activeConversationId, request, runReplayNonce]);

  const handleRejectTool = (approval: PendingToolApproval) => {
    setPendingApprovals((current) => current.filter((item) => item.callId !== approval.callId));
  };

  // Handler: Update project custom instructions
  const handleUpdateProjectInstructions = (instructions: string) => {
    setProject((prev) => ({ ...prev, instructions }));
  };

  // Handler: Add file to project knowledge
  const handleAddKnowledgeFile = (file: Omit<ProjectKnowledgeFile, "id">) => {
    const newFile: ProjectKnowledgeFile = {
      id: `kf-${Date.now()}`,
      ...file,
    };
    const nextFiles = [...project.knowledgeFiles, newFile];
    setProject((prev) => ({
      ...prev,
        knowledgeFiles: nextFiles,
    }));
    void request(`/api/v1/codeloop/projects/${encodeURIComponent(selectedProjectId)}/knowledge`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ files: nextFiles }) });
  };

  // Handler: Remove file from project knowledge
  const handleRemoveKnowledgeFile = (fileId: string) => {
    const nextFiles = project.knowledgeFiles.filter((f) => f.id !== fileId);
    setProject((prev) => ({
      ...prev,
      knowledgeFiles: nextFiles,
    }));
    void request(`/api/v1/codeloop/projects/${encodeURIComponent(selectedProjectId)}/knowledge`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ files: nextFiles }) });
  };

  // Navigation definition
  const navigation = useMemo<MdiNavigationSection[]>(
    () => [
      {
        label: "Agent workspace",
        icon: Bot,
        items: [
          { label: "Overview", icon: Bot, active: activeTool === "run", onSelect: () => setActiveTool("run") },
          { label: "Files", icon: FileCode2, active: activeTool === "files", onSelect: () => setActiveTool("files") },
          { label: "Changes", icon: GitBranch, active: activeTool === "changes", onSelect: () => setActiveTool("changes") },
          { label: "History", icon: History, active: activeTool === "history", onSelect: () => setActiveTool("history") },
        ],
      },
    ],
    [activeTool]
  );

  // Anthropic-styled Custom Sidebar Content
  const sidebarContent = (
    <div className="flex h-full flex-col overflow-y-auto select-none">
      {/* 1. New Conversation Button: Black bg with white text at top + Ctrl+N shortcut */}
      <div className="p-3 pb-2">
        <button
          type="button"
          onClick={handleCreateNewConversation}
          className="group flex w-full items-center justify-between rounded-lg bg-black px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99] dark:bg-black dark:text-white dark:hover:bg-neutral-900 border-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="size-4 text-white" />
            <span className="font-semibold text-white">New conversation</span>
          </div>
          <kbd className="rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
            Ctrl+N
          </kbd>
        </button>
      </div>

      {/* 2. Projects Folder Style Section (Matching Screenshot) */}
      <div className="flex-1 px-3">
        {/* Section Header: Projects ⌵ */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsProjectsSectionOpen((prev) => !prev)}
            className="flex min-w-0 flex-1 items-center gap-1.5 px-1 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <span>Projects</span>
            <ChevronDown className={`size-3 transition-transform duration-200 ${isProjectsSectionOpen ? "" : "-rotate-90"}`} />
          </button>
          <button type="button" onClick={() => setShowConnectProjectModal(true)} className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" title="Connect project"><Plus className="size-3.5" /></button>
        </div>

        {isProjectsSectionOpen && (
          <div className="mt-1 space-y-1">
            {projectsList.map((projectItem) => {
              const isSelected = projectItem.id === selectedProjectId;
              const isExpanded = expandedProjectIds.has(projectItem.id);
              const projectConversations = conversations.filter(
                (c) => (c.projectId || "codexsun") === projectItem.id
              );

              return (
                <div key={projectItem.id} className="relative pb-0.5">
                  {/* Project Folder Header with HoverCard */}
                  <HoverCard>
                    <HoverCardTrigger
                      delay={150}
                      closeDelay={150}
                      render={
                        <div
                          onClick={() => handleToggleProject(projectItem.id)}
                          className={`group/proj-header flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "text-neutral-900 dark:text-neutral-100 font-bold"
                              : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                          } hover:bg-neutral-100 dark:hover:bg-neutral-800/60`}
                        />
                      }
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {isExpanded ? (
                          <FolderOpen
                            className={`size-3.5 shrink-0 ${
                              isSelected ? "text-amber-500" : "text-neutral-500"
                            }`}
                          />
                        ) : (
                          <Folder
                            className={`size-3.5 shrink-0 ${
                              isSelected ? "text-amber-500" : "text-neutral-500"
                            }`}
                          />
                        )}
                        <span className="truncate">{projectItem.name}</span>
                      </div>

                      {/* Hover Tools: ••• and SquarePen (visible on hover) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover/proj-header:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjectId(projectItem.id);
                            setShowWorkspaceSettingsModal(true);
                          }}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                          title="Project settings"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateNewConversationInProject(projectItem.id);
                          }}
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                          title={`New conversation in ${projectItem.name}`}
                        >
                          <SquarePen className="size-3.5" />
                        </button>
                      </div>
                    </HoverCardTrigger>

                    {/* Floating Side Card on Hover (matching screenshot media_1790361541627.png) */}
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      className="w-72 rounded-2xl border border-neutral-800 bg-[#1c1c1c] p-3.5 shadow-2xl text-xs space-y-2.5 text-neutral-200 backdrop-blur-md dark:bg-[#1c1c1c] dark:border-neutral-800"
                    >
                      {/* 1. Header: Folder icon + Project Name + Pin */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-neutral-100 min-w-0">
                          <Folder className="size-4 shrink-0 text-neutral-300" />
                          <span className="truncate text-sm font-semibold text-neutral-100">
                            {projectItem.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="rounded p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                          title="Pin project"
                        >
                          <Pin className="size-3.5 rotate-45 text-neutral-400 hover:text-neutral-200" />
                        </button>
                      </div>

                      {/* 2. Task count */}
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <MessageSquare className="size-3.5 text-neutral-400 shrink-0" />
                        <span>
                          {projectConversations.length} task{projectConversations.length === 1 ? "" : "s"}
                          {projectItem.unreadCount ? ` · ${projectItem.unreadCount} unread` : ""}
                        </span>
                      </div>

                      {/* 3. Divider */}
                      <div className="border-t border-neutral-800/80 my-1" />

                      {/* 4. Repository / Corpus Tag */}
                      <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <FolderGit2 className="size-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate font-medium text-neutral-300">
                          {projectItem.repository || `CODEXSUN/${projectItem.name}`}
                        </span>
                      </div>

                      {/* 5. Filesystem Path */}
                      <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                        <Folder className="size-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{projectItem.path}</span>
                      </div>

                      {/* 6. Divider */}
                      <div className="border-t border-neutral-800/80 my-1" />

                      {/* 7. Action Button: Edit project */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(projectItem.id);
                          setShowWorkspaceSettingsModal(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-neutral-100 transition-colors cursor-pointer"
                      >
                        <Settings className="size-3.5 text-neutral-400" />
                        <span className="font-medium text-neutral-300">Edit project</span>
                      </button>
                    </HoverCardContent>
                  </HoverCard>

                  {/* Conversation Sub-Items (Indented underneath folder header when expanded) */}
                  {isExpanded && (
                    <div className="mt-0.5 space-y-0.5 pl-6 pr-1.5 animate-in fade-in-50 duration-150">
                      {projectConversations.length > 0 ? (
                        projectConversations.map((conv) => {
                          const isActive = conv.id === activeConversation.id && activeTool === "run";
                          const isRunning = conv.status === "running";
                          const isCompletedUnread =
                            (conv.status === "completed" || conv.unread) && !isActive && !isRunning;

                          return (
                            <div
                              key={conv.id}
                              className={`group/conv-item flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
                              }`}
                              onClick={() => {
                                setSelectedProjectId(projectItem.id);
                                setActiveConversationId(conv.id);
                                setActiveTool("run");
                                // Once we enter / hit that conversation, vaporize the completed blue dot
                                if (conv.unread || conv.status === "completed") {
                                  setConversations((prev) =>
                                    prev.map((c) =>
                                      c.id === conv.id ? { ...c, unread: false, status: "idle" } : c
                                    )
                                  );
                                  void request(`/api/v1/codeloop/conversations/${encodeURIComponent(conv.id)}`, {
                                    method: "PATCH",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ status: "idle" }),
                                  }).catch(() => undefined);
                                }
                              }}
                            >
                              <span className="truncate">{conv.title}</span>

                              {/* Right side: status indicator (running spinner or completed blue dot) & hover action tools */}
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {/* 1. Running spinner */}
                                {isRunning && (
                                  <Loader2 className="size-3.5 animate-spin text-neutral-400 shrink-0 group-hover/conv-item:hidden" />
                                )}

                                {/* 2. Completed blue dot (until we enter it will show, once we hit it it hides / vaporizes) */}
                                {isCompletedUnread && (
                                  <span
                                    className="size-2 rounded-full bg-blue-500 shrink-0 group-hover/conv-item:hidden transition-all duration-300 animate-in fade-in"
                                    title="Completed"
                                  />
                                )}

                                <div className="hidden group-hover/conv-item:flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenRenameDialog(conv.id, e)}
                                    className="rounded p-0.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                    title="Rename"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                                    className="rounded p-0.5 text-neutral-500 hover:text-destructive hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCreateNewConversationInProject(projectItem.id)}
                          className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                        >
                          <Plus className="size-3" />
                          <span>Start conversation</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Project Knowledge: Accordion Style (Always collapsed by default, only open on click) */}
      <div className="mt-2 border-t border-border/60 px-3 pt-2">
        <button
          type="button"
          onClick={() => setIsProjectKnowledgeOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Files className="size-3.5 text-blue-500" />
            <span>Project Knowledge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {project.knowledgeFiles.length} files
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                isProjectKnowledgeOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isProjectKnowledgeOpen && (
          <div className="mt-1 space-y-1 pl-2">
            {project.knowledgeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100 truncate cursor-default"
                title={`${file.path} (${file.size})`}
              >
                <FileCode2 className="size-3 text-blue-500 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tools: Accordion Style (Always collapsed by default, only open on click) */}
      <div className="mt-2 border-t border-border/60 px-3 pt-2 pb-3">
        <button
          type="button"
          onClick={() => setIsToolsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wrench className="size-3.5 text-amber-500" />
            <span>Tools</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              5 tools
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                isToolsOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isToolsOpen && (
          <div className="mt-1 space-y-0.5 pl-2">
            <button
              type="button"
              onClick={() => setActiveTool("terminal")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                activeTool === "terminal"
                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              }`}
            >
              <TerminalSquare className="size-3.5 text-emerald-500" />
              <span>Terminal & tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("files")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                activeTool === "files"
                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              }`}
            >
              <FileCode2 className="size-3.5" />
              <span>Workspace files</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("changes")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                activeTool === "changes"
                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              }`}
            >
              <GitBranch className="size-3.5" />
              <span>Changes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("history")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                activeTool === "history"
                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              }`}
            >
              <History className="size-3.5" />
              <span>Run history</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTool("providers")}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                activeTool === "providers"
                  ? "bg-neutral-200/80 text-neutral-900 font-medium dark:bg-neutral-800 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100"
              }`}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Provider settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <MainWorkspace
        agentWorkspace={{
          primaryRail: {
            label: "Agent activity",
            items: [
              {
                id: "run",
                label: "Claude chat",
                icon: BrainCircuit,
                active: activeTool === "run",
                onSelect: () => setActiveTool("run"),
              },
              {
                id: "files",
                label: "Workspace files",
                icon: FileCode2,
                active: activeTool === "files",
                onSelect: () => setActiveTool("files"),
              },
              {
                id: "changes",
                label: "Changes",
                icon: GitBranch,
                active: activeTool === "changes",
                onSelect: () => setActiveTool("changes"),
              },
              {
                id: "history",
                label: "Run history",
                icon: History,
                active: activeTool === "history",
                onSelect: () => setActiveTool("history"),
              },
            ],
            // Footer items positioned at the bottom of the left rail
            footerItems: [
              {
                id: "workspace-settings",
                label: "Workspace settings",
                icon: Settings2,
                active: showWorkspaceSettingsModal,
                onSelect: () => setShowWorkspaceSettingsModal(true),
              },
            ],
          },
          secondaryRail: {
            label: "Agent utilities",
            items: [
              {
                id: "provider-settings",
                label: "Provider settings",
                icon: SlidersHorizontal,
                active: activeTool === "providers",
                onSelect: () => setActiveTool("providers"),
              },
              {
                id: "terminal",
                label: "Terminal",
                icon: TerminalSquare,
                active: activeTool === "terminal",
                onSelect: () => setActiveTool("terminal"),
              },
            ],
            footerItems: [{ id: "security", label: "Workspace security", icon: ShieldCheck }],
          },
        }}
        applicationId="codeloop"
        applicationName="CodeLoop"
        navigation={navigation}
        primaryAction={null}
        sidebarContent={sidebarContent}
        sidebarFooter={null}
        statusLabel="Project Agent Ready"
        user={{ initials: "C", name: "CodeLoop user", onSignOut: logout }}
        workspaceTitle="AI Project Workspace"
      >
        <AgentCanvas
          activeConversation={activeConversation}
          activeTool={activeTool}
          conversationProviderIds={conversationProviderIds}
          onAddKnowledgeFile={handleAddKnowledgeFile}
          onCloseProviders={() => setActiveTool("run")}
          onOpenTerminal={() => setActiveTool("terminal")}
          onRemoveKnowledgeFile={handleRemoveKnowledgeFile}
          onProviderSelectionChange={(providerIds) => { void saveConversationProviders(providerIds); }}
          onSaveProviders={async (providers) => {
            const response = await request("/api/v1/codeloop/providers", { body: JSON.stringify({ providers: providers.map(({ apiKey, enabled, endpoint, model, id: providerId }) => ({ apiKey, enabled, endpoint, model, providerId })) }), headers: { "content-type": "application/json" }, method: "PUT" });
            if (!response.ok) throw new Error("Provider settings could not be saved.");
            const body = await response.json() as { providers: Array<{ providerId: string; enabled: boolean; endpoint: string; model: string; apiKeyConfigured: boolean; apiKeyHint?: string }> };
            setProviderSettings((current) => current.map((provider) => {
              const saved = body.providers.find((item) => item.providerId === provider.id);
              return saved ? { ...provider, enabled: saved.enabled, endpoint: saved.endpoint, model: saved.model, apiKey: undefined, apiKeyConfigured: saved.apiKeyConfigured, apiKeyHint: saved.apiKeyHint, connectionStatus: saved.enabled ? "checking" : "idle", connectionMessage: saved.enabled ? "Checking connection…" : "Provider disabled." } : provider;
            }));
            await syncProviderStatus(body.providers.map((saved) => {
              const current = providerSettings.find((provider) => provider.id === saved.providerId);
              return current ? { ...current, enabled: saved.enabled, endpoint: saved.endpoint, model: saved.model } : current;
            }).filter((provider): provider is AgentProviderSettingsItem => Boolean(provider)));
          }}
          onSendMessage={handleSendMessage}
          isMessageStreaming={isMessageStreaming}
          liveActivities={liveActivities}
          runConnectionState={runConnectionState}
          onRetryRun={() => setRunReplayNonce((value) => value + 1)}
          onStopMessage={handleStopMessage}
          onApproveTool={handleApproveTool}
          onRejectTool={handleRejectTool}
          pendingApprovals={pendingApprovals}
          onUpdateProjectInstructions={handleUpdateProjectInstructions}
          onVerifyProvider={(provider, signal) => verifyProvider(request, provider, signal)}
          onSmokeTestProvider={(provider, signal) => smokeTestProvider(request, provider, signal)}
          project={project}
          providers={providerSettings}
          request={request}
        />
      </MainWorkspace>

      {showConnectProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form onSubmit={handleConnectProject} className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border/70 pb-4">
              <div><h3 className="text-base font-semibold text-foreground">Connect project</h3><p className="mt-1 text-xs text-muted-foreground">Add a local repository or register a cloud repository.</p></div>
              <button type="button" onClick={() => setShowConnectProjectModal(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
            </div>
            <label className="block space-y-1.5 text-xs font-medium">Project name<Input required value={connectProjectName} onChange={(event) => setConnectProjectName(event.target.value)} placeholder="my-app" /></label>
            <label className="block space-y-1.5 text-xs font-medium">Source<select value={connectProjectSource} onChange={(event) => setConnectProjectSource(event.target.value as "local" | "cloud")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="local">Local repository</option><option value="cloud">Cloud repository URL</option></select></label>
            {connectProjectSource === "local" ? <label className="block space-y-1.5 text-xs font-medium">Local repository path<Input required value={connectProjectPath} onChange={(event) => setConnectProjectPath(event.target.value)} placeholder="E:\\projects\\my-app" /></label> : <label className="block space-y-1.5 text-xs font-medium">Repository URL<Input required type="url" value={connectProjectRepository} onChange={(event) => setConnectProjectRepository(event.target.value)} placeholder="https://github.com/org/repository" /></label>}
            {connectProjectError && <p className="text-sm text-destructive" role="alert">{connectProjectError}</p>}
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4"><Button type="button" variant="outline" onClick={() => setShowConnectProjectModal(false)}>Cancel</Button><Button type="submit" disabled={connectingProject}>{connectingProject ? "Connecting…" : "Connect project"}</Button></div>
          </form>
        </div>
      )}

      {/* Workspace Settings Dialog (triggered from left rail's bottom button) */}
      {showWorkspaceSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Workspace settings</h3>
                  <p className="text-xs text-muted-foreground">CodeLoop devkit environment configuration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkspaceSettingsModal(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <HardDrive className="size-3.5 text-amber-500" />
                  <span>Workspace Boundary</span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Root: E:\codexsun\codexsun<br />
                  App Owner: devkits/codeloop
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <ServerCog className="size-3.5 text-blue-500" />
                  <span>Local Hosts & Storage</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>API Port: <strong className="text-foreground">6370</strong></div>
                  <div>Web Port: <strong className="text-foreground">6371</strong></div>
                  <div className="col-span-2 truncate">Database: storage/apps/codeloop/private/data/codeloop_db.sqlite</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Agent provider controls</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspaceSettingsModal(false);
                    setActiveTool("providers");
                  }}
                  className="rounded-lg bg-muted px-3 py-1.5 font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  Open Agent Settings
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => setShowWorkspaceSettingsModal(false)}
                className="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-black dark:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Conversation Dialog (shadcn Dialog) */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Enter a new title for this conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRename} className="space-y-4 py-2">
            <Input
              value={renameTitleInput}
              onChange={(e) => setRenameTitleInput(e.target.value)}
              placeholder="Conversation title"
              autoFocus
              className="w-full text-sm"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!renameTitleInput.trim()}
                className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgentCanvas({
  activeConversation,
  activeTool,
  conversationProviderIds,
  onAddKnowledgeFile,
  onApproveTool,
  onCloseProviders,
  onOpenTerminal,
  onRejectTool,
  onRemoveKnowledgeFile,
  onProviderSelectionChange,
  onSaveProviders,
  onSmokeTestProvider,
  onSendMessage,
  isMessageStreaming,
  liveActivities,
  runConnectionState,
  onRetryRun,
  onStopMessage,
  onUpdateProjectInstructions,
  onVerifyProvider,
  project,
  providers,
  pendingApprovals,
  request,
}: {
  activeConversation: ProjectConversation;
  activeTool: AgentTool;
  conversationProviderIds: readonly string[];
  onAddKnowledgeFile: (file: Omit<ProjectKnowledgeFile, "id">) => void;
  onApproveTool: (approval: PendingToolApproval) => void | Promise<void>;
  onCloseProviders(): void;
  onOpenTerminal: () => void;
  onRejectTool: (approval: PendingToolApproval) => void;
  onRemoveKnowledgeFile: (fileId: string) => void;
  onProviderSelectionChange: (providerIds: readonly string[]) => void;
  onSaveProviders: (providers: readonly AgentProviderSettingsItem[]) => void | Promise<void>;
  onSmokeTestProvider(provider: AgentProviderSettingsItem, signal: AbortSignal): Promise<AgentProviderSmokeTestResult>;
  onSendMessage: (content: string, attachments?: File[]) => void;
  isMessageStreaming: boolean;
  liveActivities: readonly LiveActivity[];
  runConnectionState: "connected" | "reconnecting" | "offline" | "idle";
  onRetryRun: () => void;
  onStopMessage: () => void;
  onUpdateProjectInstructions: (instructions: string) => void;
  onVerifyProvider(provider: AgentProviderSettingsItem, signal: AbortSignal): Promise<AgentProviderVerificationResult>;
  project: ProjectDetails;
  providers: readonly AgentProviderSettingsItem[];
  pendingApprovals: readonly PendingToolApproval[];
  request: AuthenticatedRequest;
}) {
  if (activeTool === "run") {
    return (
      <div className="flex size-full min-h-0 flex-col">
        <TaskActivity request={request} providerIds={conversationProviderIds.length ? conversationProviderIds : providers.filter((provider) => provider.enabled).map((provider) => provider.id)} />
        <div className="min-h-0 flex-1">
          <CodeloopChatWorkspace
            conversation={activeConversation}
            project={project}
            providers={providers}
            selectedProviderIds={conversationProviderIds.length ? conversationProviderIds : providers.filter((provider) => provider.enabled).map((provider) => provider.id)}
            onProviderSelectionChange={onProviderSelectionChange}
            onSendMessage={onSendMessage}
            isMessageStreaming={isMessageStreaming}
            liveActivities={liveActivities}
            runConnectionState={runConnectionState}
            onRetryRun={onRetryRun}
            onStopMessage={onStopMessage}
            onApproveTool={onApproveTool}
            onRejectTool={onRejectTool}
            pendingApprovals={pendingApprovals}
            onUpdateProjectInstructions={onUpdateProjectInstructions}
            onAddKnowledgeFile={onAddKnowledgeFile}
            onRemoveKnowledgeFile={onRemoveKnowledgeFile}
            onOpenTerminal={onOpenTerminal}
          />
        </div>
      </div>
    );
  }

  if (activeTool === "terminal") {
    return (
      <TerminalWorkspace
        projectName={project.name}
        request={request}
      />
    );
  }

  if (activeTool === "providers") {
    return (
      <AgentProviderSettings
        embedded
        onClose={onCloseProviders}
        onOpenChange={() => undefined}
        onSave={onSaveProviders}
        onSmokeTestProvider={onSmokeTestProvider}
        onVerifyProvider={onVerifyProvider}
        open
        providers={providers}
      />
    );
  }

  if (activeTool === "files") return <section className="size-full overflow-y-auto"><div className="mx-auto w-full max-w-6xl p-6 lg:p-8"><WorkspacePageHeader eyebrow="Project context" title="Workspace files" description="Inspect the project files available to the agent." /><WorkspaceFilesDesk request={request} /></div></section>;
  if (activeTool === "changes") return <section className="size-full overflow-y-auto"><div className="mx-auto w-full max-w-6xl p-6 lg:p-8"><WorkspacePageHeader eyebrow="Repository state" title="Changes" description="Review current Git status and unstaged changes." /><ChangesDesk request={request} /></div></section>;
  if (activeTool === "history") return <section className="size-full overflow-y-auto"><div className="mx-auto w-full max-w-6xl p-6 lg:p-8"><WorkspacePageHeader eyebrow="Agent activity" title="Run history" description="Review recorded provider and tool activity for this conversation." /><HistoryDesk conversation={activeConversation} /></div></section>;

  return null;
}

type ConversationTracePayload = { type: string; message: string; data?: unknown };

function mapConversationTrace(trace: readonly ConversationTracePayload[] | undefined): AgentChatMessage["trace"] {
  return trace?.map((event) => ({
    type: event.type,
    message: event.message,
    ...(event.data === undefined ? {} : { raw: JSON.stringify(event.data) }),
  }));
}

function restorePendingApprovals(messages: readonly { trace?: readonly ConversationTracePayload[] }[]): PendingToolApproval[] {
  return messages.flatMap((message) => message.trace ?? []).filter((event) => event.type === "tool.approval_required").flatMap((event) => {
    if (!event.data || typeof event.data !== "object") return [];
    const approval = event.data as Partial<PendingToolApproval>;
    if (typeof approval.providerId !== "string" || typeof approval.tool !== "string" || typeof approval.callId !== "string" || typeof approval.reason !== "string" || !approval.arguments || typeof approval.arguments !== "object") return [];
    return [{ providerId: approval.providerId, tool: approval.tool, callId: approval.callId, reason: approval.reason, arguments: approval.arguments as Record<string, unknown> }];
  });
}

async function verifyProvider(
  request: AuthenticatedRequest,
  provider: AgentProviderSettingsItem,
  signal: AbortSignal
): Promise<AgentProviderVerificationResult> {
  const timeout = AbortSignal.timeout(12_000);
  const requestSignal = AbortSignal.any([signal, timeout]);
  const response = await request("/api/v1/codeloop/providers/verify", {
    body: JSON.stringify({
      apiKey: provider.apiKey,
      endpoint: provider.endpoint,
      model: provider.model,
      providerId: provider.id,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal: requestSignal,
  });
  const body = await response.text();
  if (!body.trim()) throw new Error("CodeLoop returned an empty verification response.");
  const result = JSON.parse(body) as AgentProviderVerificationResult;
  if (!response.ok) throw new Error(result.message || "Provider verification failed.");
  return result;
}

async function smokeTestProvider(
  request: AuthenticatedRequest,
  provider: AgentProviderSettingsItem,
  signal: AbortSignal
): Promise<AgentProviderSmokeTestResult> {
  const response = await request("/api/v1/codeloop/providers/smoke-test", {
    body: JSON.stringify({ endpoint: provider.endpoint, model: provider.model, providerId: provider.id }),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal: AbortSignal.any([signal, AbortSignal.timeout(17_000)]),
  });
  const body = await response.text();
  if (!body.trim()) throw new Error("CodeLoop returned an empty smoke-test response.");
  const result = JSON.parse(body) as AgentProviderSmokeTestResult & { error?: string };
  if (!response.ok) throw new Error(result.message || result.error || "Provider smoke test failed.");
  return result;
}
