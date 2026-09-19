import { useEffect, useMemo, useRef, useState } from "react";
import { MainWorkspace } from "@codexsun/ui";
import { ChatRuntimeControls } from "@codexsun/ui/blocks/chat-runtime-controls";
import { ChatRuntimeTrace } from "@codexsun/ui/blocks/chat-runtime-trace";
import { CodexConnectionSettings } from "@codexsun/ui/blocks/codex-connection-settings";
import { HandoverStack } from "@codexsun/ui/blocks/handover-stack";
import { IdeaHandoverWorkspace, type IdeaBriefDraft, type IdeaHandoverTask } from "@codexsun/ui/blocks/idea-handover";
import { AgentTaskWorkspace } from "@codexsun/ui/blocks/agent-task-workspace";
import { ArchivedChatWorkspace } from "@codexsun/ui/blocks/archived-chat-workspace";
import { AnalysisContext } from "@codexsun/ui/blocks/analysis-context";
import { ChatDateDivider, ChatResponseProgress, ChatTurnDivider } from "@codexsun/ui/blocks/chat-response-progress";
import { ChatComposer, type ChatComposerAttachment } from "@codexsun/ui/blocks/chat-composer";
import { ChatHistory } from "@codexsun/ui/blocks/chat-history";
import { Button } from "@codexsun/ui/components/button";
import { MarkdownContent } from "@codexsun/ui/components/markdown-content";
import { MessageScroller, MessageScrollerButton, MessageScrollerViewport } from "@codexsun/ui/components/message-scroller";
import { TopologyRegion } from "@codexsun/ui/features/interface-topology";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import type { ZetroAgentTask, ZetroChatAttachment, ZetroChatConversation, ZetroChatMessage, ZetroChatRuntime, ZetroChatStreamEvent, ZetroCodexDeviceCode, ZetroIdeaBrief } from "@codexsun/zetro-contracts";
import type { InterfaceTopologySection } from "@codexsun/ui/features/interface-topology";
import { ArchiveIcon, BotIcon, ClockIcon, CopyIcon, FileTextIcon, Layers3Icon, LayoutDashboardIcon, ListTodoIcon, MessageSquareIcon, PanelsTopLeftIcon, RotateCcwIcon, SettingsIcon, Share2Icon } from "lucide-react";
import { createAgentTask, createConversation, deleteArchivedConversations, deleteConversation as deleteStoredConversation, generateCodexDeviceCode, getChatRuntime, getCodexDeviceCode, getConversation, getIdeaBrief, listAgentTasks, listConversations, saveIdeaBrief, streamMessage, updateChatRuntime, updateConversation as updateStoredConversation } from "./chat-api.js";

type VoiceRecognizer = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};

type VoiceRecognizerConstructor = new () => VoiceRecognizer;

declare global {
  interface Window {
    SpeechRecognition?: VoiceRecognizerConstructor;
    webkitSpeechRecognition?: VoiceRecognizerConstructor;
  }
}

const zetroTopologySections: readonly InterfaceTopologySection[] = [
  { id: "z01", technicalName: "zetro.history.sidebar", name: "Conversation history", scope: "Zetro workspace", description: "Creates and selects idea conversations." },
  { id: "z01.1", technicalName: "zetro.history.createButton", name: "New conversation", scope: "Conversation history", description: "Creates a private idea conversation." },
  { id: "z01.2", technicalName: "zetro.history.conversationList", name: "History list", scope: "Conversation history", description: "Lists saved idea conversations." },
  { id: "z02", technicalName: "zetro.chat.workspace", name: "Idea conversation", scope: "Zetro workspace", description: "Hosts idea exploration and revision." },
  { id: "z02.1", technicalName: "zetro.chat.heading", name: "Conversation heading", scope: "Idea conversation", description: "Shows the active chat title and local Codex connection details." },
  { id: "z02.2", technicalName: "zetro.chat.messageHistory", name: "Message history", scope: "Idea conversation", description: "Shows the current conversation messages." },
  { id: "z02.2.2", technicalName: "zetro.chat.messages", name: "Messages", scope: "Message history", description: "Shows prompts and Zetro responses." },
  { id: "z02.3", technicalName: "zetro.chat.composer", name: "Chat composer", scope: "Idea conversation", description: "Writes and sends a new idea message." },
  { id: "z02.3.1", technicalName: "zetro.chat.promptInput", name: "Prompt input", scope: "Chat composer", description: "Accepts a full-width idea prompt." },
  { id: "z02.3.2", technicalName: "zetro.chat.sendButton", name: "Send message", scope: "Chat composer", description: "Sends the prompt to the live, read-only local Codex session." },
  { id: "z03", technicalName: "zetro.tasks.workspace", name: "Agent tasks", scope: "Zetro workspace", description: "Lists prepared handovers with their final brief and referred project." },
  { id: "z04", technicalName: "zetro.history.archive", name: "Archived handovers", scope: "Conversation history", description: "Keeps handed-over conversations available after archive without deleting their messages." },
];

const disconnectedRuntime: ZetroChatRuntime = {
  connected: false,
  message: "Checking the local Codex CLI.",
  model: "Default",
  models: ["Default", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra"],
  provider: "Codex",
  providers: ["Codex"],
  reasoning: "Default",
  reasoningLevels: ["Default", "Low", "Medium", "High", "XHigh"],
};

const codexDeviceLoginUrl = "https://auth.openai.com/codex/device";
const idleDeviceCode: ZetroCodexDeviceCode = { status: "idle", message: "Generate a device code to connect Codex." };

export function App() {
  const [conversations, setConversations] = useState<ZetroChatConversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<ZetroChatConversation[]>([]);
  const [historyMode, setHistoryMode] = useState<"active" | "archived">("active");
  const [workspaceView, setWorkspaceView] = useState<"chat" | "tasks" | "archive">("chat");
  const [conversation, setConversation] = useState<ZetroChatConversation>();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [steerQueue, setSteerQueue] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [executionEvents, setExecutionEvents] = useState<ZetroChatStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const activeConversationIdRef = useRef<string | undefined>(undefined);
  const streamAbortRef = useRef<AbortController | undefined>(undefined);
  const recognitionRef = useRef<VoiceRecognizer | undefined>(undefined);
  const [messages, setMessages] = useState<ZetroChatMessage[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ZetroChatMessage[]>>({});
  const [runtime, setRuntime] = useState<ZetroChatRuntime>(disconnectedRuntime);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deviceCode, setDeviceCode] = useState<ZetroCodexDeviceCode>(idleDeviceCode);
  const [handoverStackOpen, setHandoverStackOpen] = useState(false);
  const [handoverMessageIds, setHandoverMessageIds] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState<IdeaBriefDraft>(emptyBrief());
  const [agentTask, setAgentTask] = useState<IdeaHandoverTask>();
  const [agentTasks, setAgentTasks] = useState<ZetroAgentTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const isLoading = isStreaming;

  useEffect(() => {
    if (!isLoading) return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1_000)), 1_000);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    void listConversations().then(setConversations).catch((error: unknown) => setExecutionEvents([{ type: "error", message: error instanceof Error ? error.message : "Zetro API is unavailable." }]));
    void listAgentTasks().then(setAgentTasks).catch(() => undefined);
    void refreshRuntime();
  }, []);

  useEffect(() => {
    const activeConversationId = activeConversationIdRef.current;
    if (activeConversationId) setMessagesByConversation((items) => ({ ...items, [activeConversationId]: messages }));
  }, [messages]);

  useEffect(() => {
    if (isLoading || !steerQueue.length) return;
    const [nextSteer, ...remainingSteers] = steerQueue;
    setSteerQueue(remainingSteers);
    void runStream(activeConversationIdRef.current, nextSteer);
  }, [isLoading, steerQueue]);

  const history = useMemo(() => (
    <ZetroHistory activeConversationId={conversation?.id} archived={historyMode === "archived"} conversations={historyMode === "archived" ? archivedConversations : conversations} onArchive={archiveConversation} onCreate={startConversation} onRename={renameConversation} onSelect={selectConversation} onTogglePin={toggleConversationPin} />
  ), [archivedConversations, conversation?.id, conversations, historyMode]);

  function selectConversation(id: string): void {
    const selected = [...conversations, ...archivedConversations].find((item) => item.id === id);
    if (!selected) return;
    if (activeConversationIdRef.current) setMessagesByConversation((items) => ({ ...items, [activeConversationIdRef.current!]: messages }));
    activeConversationIdRef.current = selected.id;
    setConversation(selected);
    void getConversation(selected.id).then((view) => setMessages(view.messages)).catch(() => setMessages(messagesByConversation[selected.id] ?? []));
    void loadBrief(selected.id);
    setSteerQueue([]);
  }

  async function startConversation(): Promise<void> {
    setWorkspaceView("chat");
    setHistoryMode("active");
    const { conversation: nextConversation } = await createConversation();
    setConversations((items) => [nextConversation, ...items]);
    activeConversationIdRef.current = nextConversation.id;
    setMessagesByConversation((items) => ({ ...items, [nextConversation.id]: [] }));
    setConversation(nextConversation);
    streamAbortRef.current?.abort();
    setMessages([]);
    setSteerQueue([]);
    setAttachments([]);
    setBrief(emptyBrief());
    setAgentTask(undefined);
  }

  async function submit(): Promise<void> {
    const content = draft.trim();
    if ((!content && !attachments.length) || isLoading) return;
    if (!runtime.connected) {
      setExecutionEvents([{ type: "error", message: runtime.message }]);
      return;
    }

    const current = conversation ?? (await createConversation()).conversation;
    activeConversationIdRef.current = current.id;
    setConversation(current);
    setConversations((items) => [current, ...items.filter((item) => item.id !== current.id)]);
    setDraft("");
    const submittedAttachments = await serializeAttachments(attachments);
    setAttachments([]);
    setElapsedSeconds(0);
    void runStream(current.id, content || "Please review the attached material.", submittedAttachments);
  }

  function addAttachments(files: File[]): void {
    setAttachments((items) => [
      ...items,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        type: file.type,
      })),
    ]);
  }

  function removeAttachment(id: string): void {
    setAttachments((items) => {
      const attachment = items.find((item) => item.id === id);
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      return items.filter((item) => item.id !== id);
    });
  }

  async function toggleConversationPin(id: string): Promise<void> {
    const current = conversations.find((item) => item.id === id);
    if (!current) return;
    const { conversation: updated } = await updateStoredConversation(id, { title: current.title, pinned: !current.pinned });
    setConversations((items) => items.map((item) => item.id === id ? updated : item));
    setConversation((item) => item?.id === id ? updated : item);
  }

  async function renameConversation(id: string): Promise<void> {
    const current = conversations.find((item) => item.id === id);
    const title = window.prompt("Rename conversation", current?.title);
    if (!title?.trim()) return;
    if (!current) return;
    const { conversation: updated } = await updateStoredConversation(id, { title: title.trim(), pinned: current.pinned });
    setConversations((items) => items.map((item) => item.id === id ? updated : item));
    setConversation((item) => item?.id === id ? updated : item);
  }

  async function archiveConversation(id: string): Promise<void> {
    const current = conversations.find((item) => item.id === id);
    if (!current || isStreaming) return;
    const { conversation: archived } = await updateStoredConversation(id, { archived: true });
    setConversations((items) => items.filter((item) => item.id !== id));
    setArchivedConversations((items) => [archived, ...items.filter((item) => item.id !== id)]);
    if (activeConversationIdRef.current === id) {
      activeConversationIdRef.current = undefined;
      setConversation(undefined);
      setMessages([]);
      setHandoverMessageIds([]);
      setBriefOpen(false);
      setHistoryMode("archived");
    }
  }

  async function openTasks(): Promise<void> {
    setWorkspaceView("tasks");
    setBriefOpen(false);
    const tasks = await listAgentTasks();
    setAgentTasks(tasks);
    setSelectedTaskId((id) => id ?? tasks[0]?.id);
  }

  async function showArchivedConversations(): Promise<void> {
    setWorkspaceView("archive");
    setBriefOpen(false);
    setArchivedConversations(await listConversations(true));
  }

  async function restoreConversation(id: string): Promise<void> {
    const { conversation: restored } = await updateStoredConversation(id, { archived: false });
    setArchivedConversations((items) => items.filter((item) => item.id !== id));
    setConversations((items) => [restored, ...items.filter((item) => item.id !== id)]);
    if (conversation?.id === id) setConversation(restored);
  }

  async function forceDeleteArchivedConversation(id: string): Promise<void> {
    const archived = archivedConversations.find((item) => item.id === id);
    if (!archived || !window.confirm(`Permanently delete “${archived.title}”? This cannot be undone.`)) return;
    await deleteStoredConversation(id);
    setArchivedConversations((items) => items.filter((item) => item.id !== id));
    if (conversation?.id === id) {
      setConversation(undefined);
      setMessages([]);
      activeConversationIdRef.current = undefined;
    }
  }

  async function forceDeleteAllArchivedConversations(): Promise<void> {
    if (!archivedConversations.length || !window.confirm(`Permanently delete all ${archivedConversations.length} archived chats? This cannot be undone.`)) return;
    await deleteArchivedConversations();
    setArchivedConversations([]);
    if (conversation?.archived) {
      setConversation(undefined);
      setMessages([]);
      activeConversationIdRef.current = undefined;
    }
  }

  function openArchivedConversation(id: string): void {
    setHistoryMode("archived");
    setWorkspaceView("chat");
    selectConversation(id);
  }

  function showActiveConversations(): void {
    setWorkspaceView("chat");
    setHistoryMode("active");
  }

  async function loadBrief(conversationId: string): Promise<ZetroIdeaBrief | undefined> {
    try {
      const storedBrief = await getIdeaBrief(conversationId);
      setBrief(storedBrief ? toBriefDraft(storedBrief) : emptyBrief());
      try {
        const tasks = await listAgentTasks();
        setAgentTask(storedBrief ? tasks.find((task) => task.briefId === storedBrief.id) : undefined);
      } catch {
        setAgentTask(undefined);
      }
      return storedBrief;
    } catch {
      setBrief(emptyBrief());
      setAgentTask(undefined);
      return undefined;
    }
  }

  async function openBrief(): Promise<void> {
    if (!conversation) return;
    const storedBrief = await loadBrief(conversation.id);
    if (!storedBrief) setBrief({ ...emptyBrief(), sourceMessageIds: handoverMessageIds });
    setBriefOpen(true);
  }

  async function saveBrief(status: "draft" | "final"): Promise<void> {
    if (!conversation) return;
    setIsSavingBrief(true);
    try {
      const saved = await saveIdeaBrief(conversation.id, { ...brief, status });
      setBrief(toBriefDraft(saved));
      if (status === "final") {
        const { conversation: updated } = await updateStoredConversation(conversation.id, { stage: "final" });
        setConversation(updated);
        setConversations((items) => items.map((item) => item.id === updated.id ? updated : item));
      }
    } finally {
      setIsSavingBrief(false);
    }
  }

  async function changeIdeaStage(stage: ZetroChatConversation["stage"]): Promise<void> {
    if (!conversation) return;
    const { conversation: updated } = await updateStoredConversation(conversation.id, { stage });
    setConversation(updated);
    setConversations((items) => items.map((item) => item.id === updated.id ? updated : item));
  }

  async function handOverToAgentTask(): Promise<void> {
    if (!conversation || brief.status !== "final") return;
    setIsSavingBrief(true);
    try {
      const saved = await saveIdeaBrief(conversation.id, brief);
      const task = await createAgentTask({ acceptanceCriteria: saved.successSignals, briefId: saved.id, priority: "medium", projectReference: saved.projectReference, projectScope: saved.projectScope, summary: saved.outcome, title: saved.title });
      setAgentTask(task);
      setAgentTasks((items) => [task, ...items.filter((item) => item.id !== task.id)]);
      setSelectedTaskId(task.id);
    } finally {
      setIsSavingBrief(false);
    }
  }

  function toggleVoiceInput(): void {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setDraft((value) => `${value}${value ? " " : ""}Voice input is unavailable in this browser.`);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setDraft((value) => `${value}${value && transcript ? " " : ""}${transcript}`);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }

  function stop(): void {
    setSteerQueue([]);
    streamAbortRef.current?.abort();
    setIsStreaming(false);
  }

  async function refreshRuntime(): Promise<void> {
    await recheckLocalCodex();
    try {
      setDeviceCode(await getCodexDeviceCode());
    } catch (error) {
      setDeviceCode({ status: "failed", message: error instanceof Error ? error.message : "Zetro could not read device-code status." });
    }
  }

  async function recheckLocalCodex(): Promise<void> {
    try {
      setRuntime(await getChatRuntime());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not reach the local Codex CLI.";
      setRuntime({ ...disconnectedRuntime, message });
    }
  }

  async function updateRuntimeSelection(nextRuntime: ZetroChatRuntime): Promise<void> {
    const previousRuntime = runtime;
    setRuntime(nextRuntime);
    try {
      setRuntime(await updateChatRuntime({ provider: nextRuntime.provider, model: nextRuntime.model, reasoning: nextRuntime.reasoning }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not update the local Codex settings.";
      setRuntime({ ...previousRuntime, message });
    }
  }

  async function reconnect(): Promise<void> {
    await refreshRuntime();
    setSettingsOpen(true);
  }

  function openDeviceBrowser(): void {
    window.open(deviceCode.verificationUrl ?? codexDeviceLoginUrl, "_blank", "noopener,noreferrer");
  }

  function copyDeviceUrl(): void {
    void navigator.clipboard.writeText(deviceCode.verificationUrl ?? codexDeviceLoginUrl);
  }

  function copyDeviceCode(): void {
    if (deviceCode.userCode) void navigator.clipboard.writeText(deviceCode.userCode);
  }

  async function generateDeviceCode(): Promise<void> {
    try {
      setDeviceCode(await generateCodexDeviceCode());
    } catch (error) {
      setDeviceCode({ status: "failed", message: error instanceof Error ? error.message : "Zetro could not generate a device code." });
    }
  }

  function toggleHandoverMessage(id: string): void {
    setHandoverMessageIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  async function consolidateHandover(): Promise<void> {
    if (isLoading || !runtime.connected || !conversation) return;
    const sourceMessages = messages.filter((message) => handoverMessageIds.includes(message.id) && message.role === "assistant" && message.content);
    if (!sourceMessages.length) return;
    setElapsedSeconds(0);
    setHandoverStackOpen(false);
    await runStream(conversation.id, `Consolidate the selected Zetro responses below into one revised idea. Preserve useful decisions, resolve conflicts, state assumptions, and finish with a concise final brief. Stay in the idea stage; do not create tasks or execute work.\n\n${sourceMessages.map((message, index) => `Source response ${index + 1} (${message.id}):\n${message.content}`).join("\n\n")}`);
  }

  const handoverItems = messages.filter((message) => handoverMessageIds.includes(message.id) && message.role === "assistant" && message.content).map((message) => ({ id: message.id, content: message.content }));

  async function runStream(conversationId: string | undefined, content: string, attachments: ZetroChatAttachment[] = []): Promise<void> {
    if (!conversationId) return;
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsStreaming(true);
    setExecutionEvents([]);
    const createdAt = new Date().toISOString();
    if (activeConversationIdRef.current === conversationId) {
      setMessages((items) => [...items, { id: crypto.randomUUID(), conversationId, role: "user", content, createdAt }, { id: crypto.randomUUID(), conversationId, role: "assistant", content: "", createdAt }]);
    }
    try {
      await streamMessage(conversationId, content, runtime, attachments, (event) => {
        setExecutionEvents((items) => [...items.slice(-80), event]);
        if (event.type === "response" && activeConversationIdRef.current === conversationId) {
          setMessages((items) => items.map((message, index) => index === items.length - 1 && message.role === "assistant" ? { ...message, content: event.message } : message));
        }
      }, controller.signal);
      const view = await getConversation(conversationId);
      setMessagesByConversation((items) => ({ ...items, [conversationId]: view.messages }));
      if (activeConversationIdRef.current === conversationId) {
        setConversation(view.conversation);
        setMessages(view.messages);
      }
      setConversations((items) => [view.conversation, ...items.filter((item) => item.id !== view.conversation.id)]);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        const message = error instanceof Error ? error.message : "Zetro could not stream the local Codex response.";
        setExecutionEvents((items) => [...items.slice(-80), { type: "error", message }]);
      }
    } finally {
      setIsStreaming(false);
      streamAbortRef.current = undefined;
    }
  }

  function steer(): void {
    const content = draft.trim();
    if (!content || !isLoading) return;
    setDraft("");
    setSteerQueue((items) => [...items, content]);
  }

  return (
    <MainWorkspace
      agentWorkspace={{
        primaryRail: {
          items: [
            { active: workspaceView === "chat" && historyMode === "active", icon: MessageSquareIcon, id: "chat", label: "Conversation", onSelect: showActiveConversations },
            { active: workspaceView === "tasks", icon: ListTodoIcon, id: "tasks", label: "Tasks", onSelect: () => void openTasks() },
          ],
          label: "Agent tools",
        },
        secondaryRail: {
          items: [
            { active: settingsOpen, icon: SettingsIcon, id: "settings", label: "Settings", onSelect: () => setSettingsOpen(true) },
            { active: briefOpen, icon: FileTextIcon, id: "brief", label: "Brief", onSelect: openBrief },
          ],
          label: "Agent utilities",
        },
      }}
      applicationIcon={BotIcon}
      applicationId="zetro"
      applicationName="Zetro"
      navigation={[
        {
          items: [
            { active: true, icon: PanelsTopLeftIcon, label: "Idea workspace" },
          ],
        },
      ]}
      primaryAction={{ icon: LayoutDashboardIcon, label: "Overview", onSelect: showActiveConversations }}
      sidebarContent={history}
      sidebarFooter={<div className="grid gap-1 p-1"><Button className="w-full justify-start" size="sm" variant={workspaceView === "archive" ? "secondary" : "ghost"} onClick={() => void showArchivedConversations()}><ArchiveIcon /> Archive</Button>{isLoading || steerQueue.length ? <p className="px-1 text-xs text-muted-foreground">{isLoading ? `Working for ${elapsedSeconds}s` : `${steerQueue.length} steer queued`}</p> : null}</div>}
      sidebarStateKey="codexsun.zetro.sidebar"
      statusLabel="Ready"
      showMdiOverview
      topologySections={zetroTopologySections}
      workspaceTitle="Zetro workspace"
    >
      {workspaceView === "archive" ? <ArchivedChatWorkspace chats={archivedConversations} onDelete={forceDeleteArchivedConversation} onDeleteAll={forceDeleteAllArchivedConversations} onOpen={openArchivedConversation} onRestore={restoreConversation} /> : workspaceView === "tasks" ? <AgentTaskWorkspace selectedTaskId={selectedTaskId} tasks={agentTasks} onBack={showActiveConversations} onSelectTask={setSelectedTaskId} /> : briefOpen ? <IdeaHandoverWorkspace brief={brief} currentStage={conversation?.stage ?? "explore"} saving={isSavingBrief} sources={messages.filter((message) => message.role === "assistant" && message.content).map((message) => ({ content: message.content, id: message.id }))} task={agentTask} onArchiveConversation={conversation && agentTask ? () => void archiveConversation(conversation.id) : undefined} onBack={() => setBriefOpen(false)} onBriefChange={setBrief} onCreateTask={handOverToAgentTask} onSaveBrief={saveBrief} onStageChange={changeIdeaStage} /> : <ZetroWorkspace attachments={attachments} conversation={conversation} draft={draft} elapsedSeconds={elapsedSeconds} executionEvents={executionEvents} handoverCount={handoverItems.length} isRecording={isRecording} isWorking={isLoading} messages={messages} queuedSteerCount={steerQueue.length} runtime={runtime} onAddAttachments={addAttachments} onDraftChange={setDraft} onOpenHandoverStack={() => setHandoverStackOpen(true)} onReconnect={reconnect} onRemoveAttachment={removeAttachment} onRuntimeChange={updateRuntimeSelection} onSteer={steer} onStop={stop} onSubmit={submit} onToggleHandover={toggleHandoverMessage} onVoiceToggle={toggleVoiceInput} selectedHandoverMessageIds={handoverMessageIds} />}
      <CodexConnectionSettings connected={runtime.connected} deviceCode={deviceCode} message={runtime.message} open={settingsOpen} onConnectLocal={recheckLocalCodex} onCopyCode={copyDeviceCode} onCopyUrl={copyDeviceUrl} onGenerateDeviceCode={generateDeviceCode} onOpenBrowser={openDeviceBrowser} onOpenChange={setSettingsOpen} />
      <HandoverStack items={handoverItems} open={handoverStackOpen} working={isLoading} onConsolidate={consolidateHandover} onOpenChange={setHandoverStackOpen} onRemove={toggleHandoverMessage} />
    </MainWorkspace>
  );
}

async function serializeAttachments(attachments: ChatComposerAttachment[]): Promise<ZetroChatAttachment[]> {
  return Promise.all(attachments.map(async (attachment) => ({ name: attachment.name, type: attachment.type, content: arrayBufferToBase64(await attachment.file.arrayBuffer()) })));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let value = "";
  for (const byte of new Uint8Array(buffer)) value += String.fromCharCode(byte);
  return btoa(value);
}

function ZetroHistory({ activeConversationId, archived, conversations, onArchive, onCreate, onRename, onSelect, onTogglePin }: { activeConversationId?: string; archived: boolean; conversations: ZetroChatConversation[]; onArchive: (id: string) => void; onCreate: () => void; onRename: (id: string) => void; onSelect: (id: string) => void; onTogglePin: (id: string) => void }) {
  const topology = useMdiTopology();
  return <TopologyRegion as="div" className="flex min-h-0 flex-1" id="z01" topology={topology}><ChatHistory activeId={activeConversationId} emptyLabel={archived ? "No archived handovers" : "No conversations yet"} items={conversations.map((item) => ({ id: item.id, pinned: item.pinned, title: item.title }))} onArchive={archived ? undefined : onArchive} onCreate={onCreate} onPin={onTogglePin} onRename={onRename} onSelect={onSelect} /></TopologyRegion>;
}

function ZetroWorkspace({ attachments, conversation, draft, elapsedSeconds, executionEvents, handoverCount, isRecording, isWorking, messages, queuedSteerCount, runtime, onAddAttachments, onDraftChange, onOpenHandoverStack, onReconnect, onRemoveAttachment, onRuntimeChange, onSteer, onStop, onSubmit, onToggleHandover, onVoiceToggle, selectedHandoverMessageIds }: { attachments: ChatComposerAttachment[]; conversation?: ZetroChatConversation; draft: string; elapsedSeconds: number; executionEvents: ZetroChatStreamEvent[]; handoverCount: number; isRecording: boolean; isWorking: boolean; messages: ZetroChatMessage[]; queuedSteerCount: number; runtime: ZetroChatRuntime; onAddAttachments: (files: File[]) => void; onDraftChange: (value: string) => void; onOpenHandoverStack: () => void; onReconnect: () => void; onRemoveAttachment: (id: string) => void; onRuntimeChange: (runtime: ZetroChatRuntime) => void; onSteer: () => void; onStop: () => void; onSubmit: () => void; onToggleHandover: (id: string) => void; onVoiceToggle: () => void; selectedHandoverMessageIds: string[] }) {
  const topology = useMdiTopology();
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const [canScrollToLatest, setCanScrollToLatest] = useState(false);

  function updateScrollPosition(): void {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    setCanScrollToLatest(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 8);
  }

  function scrollToLatest(): void {
    messageViewportRef.current?.scrollTo({ top: messageViewportRef.current.scrollHeight, behavior: "smooth" });
  }

  useEffect(() => updateScrollPosition(), [isWorking, messages.length]);

  return <TopologyRegion as="section" className="flex size-full min-h-0 flex-col bg-background" id="z02" topology={topology}>
    <TopologyRegion as="header" className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3 sm:px-6" id="z02.1" topology={topology}>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{conversation?.title ?? "Start with an idea"}</h1>
      <Button aria-label={`Open handover stack (${handoverCount} responses)`} className="relative" size="icon-sm" variant="ghost" onClick={onOpenHandoverStack}><Layers3Icon />{handoverCount ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{handoverCount}</span> : null}</Button>
      <ChatRuntimeControls connected={runtime.connected} message={runtime.message} model={runtime.model} models={runtime.models} onModelChange={(model) => onRuntimeChange({ ...runtime, model: model as ZetroChatRuntime["model"] })} onProviderChange={(provider) => onRuntimeChange({ ...runtime, provider: provider as ZetroChatRuntime["provider"] })} onReasoningChange={(reasoning) => onRuntimeChange({ ...runtime, reasoning: reasoning as ZetroChatRuntime["reasoning"] })} onReconnect={onReconnect} provider={runtime.provider} providers={runtime.providers} reasoning={runtime.reasoning} reasoningLevels={runtime.reasoningLevels} />
    </TopologyRegion>
    <TopologyRegion as="div" className="min-h-0 flex-1" id="z02.2" topology={topology}><MessageScroller><MessageScrollerViewport ref={messageViewportRef} className="px-6 py-7 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1" onScroll={updateScrollPosition}><AnalysisContext root={conversation?.analysisRoot} /><TopologyRegion as="div" className={`mx-auto flex w-4/5 flex-col ${isWorking ? "gap-1" : "gap-3"}`} id="z02.2.2" topology={topology}>{messages[0] ? <ChatDateDivider label={formatDateBadge(messages[0].createdAt)} /> : null}{messages.map((message, index) => { const isLiveAssistant = isWorking && message.role === "assistant" && index === messages.length - 1; return <div key={message.id} className="flex flex-col gap-0.5"><div className={`group flex flex-col ${message.role === "user" ? "w-fit max-w-[80%] self-end" : "w-full self-start"}`}><article className={message.role === "user" ? "rounded-sm bg-muted/60 px-4 py-3 text-foreground shadow-sm" : isLiveAssistant ? "px-4 pt-3 pb-0" : "px-4 py-3"}><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{message.role === "assistant" ? <BotIcon aria-hidden="true" className="size-3.5" /> : null}{message.role === "user" ? "You" : message.role === "error" ? "Connection" : "Zetro"}</p>{message.content ? message.role === "assistant" ? <MarkdownContent className="mt-1" content={message.content} /> : <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p> : null}{isLiveAssistant ? <><ChatResponseProgress elapsedSeconds={elapsedSeconds} label="Working" tone="orange" /><ChatRuntimeTrace className="mt-2" elapsedSeconds={elapsedSeconds} events={executionEvents} isWorking /></> : null}</article>{!isLiveAssistant ? <MessageActions handoverSelected={selectedHandoverMessageIds.includes(message.id)} messageId={message.id} role={message.role} timestamp={message.createdAt} onToggleHandover={onToggleHandover} /> : null}</div>{message.role !== "user" && !isLiveAssistant ? <ChatTurnDivider /> : null}</div>})}</TopologyRegion></MessageScrollerViewport>{canScrollToLatest ? <MessageScrollerButton aria-label="Scroll to latest message" className="invisible border-border/70 opacity-0 shadow-sm transition-opacity group-hover/message-scroller:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100" onClick={scrollToLatest} /> : null}</MessageScroller></TopologyRegion>
    <TopologyRegion as="footer" className="sticky bottom-0 z-10 shrink-0 bg-background px-6 py-4" id="z02.3" topology={topology}>
      <TopologyRegion as="div" id="z02.3.1" topology={topology}><ChatComposer attachments={attachments} isRecording={isRecording} isWorking={isWorking} queuedSteerCount={queuedSteerCount} value={draft} onAddFiles={onAddAttachments} onRemoveAttachment={onRemoveAttachment} onSteer={onSteer} onStop={onStop} onSubmit={onSubmit} onValueChange={onDraftChange} onVoiceToggle={onVoiceToggle} /></TopologyRegion>
    </TopologyRegion>
  </TopologyRegion>;
}

function MessageActions({ handoverSelected, messageId, role, timestamp, onToggleHandover }: { handoverSelected: boolean; messageId: string; role: ZetroChatMessage["role"]; timestamp: string; onToggleHandover: (id: string) => void }) {
  if (role === "error") return null;

  return <div className="invisible mt-0.5 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
    <Button aria-label="Copy message" size="icon-xs" variant="ghost"><CopyIcon /></Button>
    {role === "user" ? <><Button aria-label="Share message" size="icon-xs" variant="ghost"><Share2Icon /></Button><span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><ClockIcon className="size-3" />{formatMessageTime(timestamp)}</span></> : <><Button aria-label={handoverSelected ? "Remove from handover stack" : "Add to handover stack"} className={handoverSelected ? "text-primary" : undefined} size="icon-xs" variant="ghost" onClick={() => onToggleHandover(messageId)}><Layers3Icon /></Button><Button aria-label="Regenerate response" size="icon-xs" variant="ghost"><RotateCcwIcon /></Button><Button aria-label="Share response" size="icon-xs" variant="ghost"><Share2Icon /></Button></>}
  </div>;
}


function formatDateBadge(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(timestamp));
}

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function emptyBrief(): IdeaBriefDraft {
  return { audience: "", constraints: "", exclusions: "", outcome: "", projectReference: null, projectScope: "all-projects", risks: "", scope: "", sourceMessageIds: [], status: "draft", successSignals: "", title: "" };
}

function toBriefDraft(value: ZetroIdeaBrief): IdeaBriefDraft {
  return { audience: value.audience, constraints: value.constraints, exclusions: value.exclusions, outcome: value.outcome, projectReference: value.projectReference, projectScope: value.projectScope, risks: value.risks, scope: value.scope, sourceMessageIds: value.sourceMessageIds, status: value.status, successSignals: value.successSignals, title: value.title };
}
