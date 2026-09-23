import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MainWorkspace, PdfProvider } from "@codexsun/ui";
import { ChatRuntimeControls } from "@codexsun/ui/blocks/chat-runtime-controls";
import { ChatRuntimeTrace } from "@codexsun/ui/blocks/chat-runtime-trace";
import { CodexConnectionSettings } from "@codexsun/ui/blocks/codex-connection-settings";
import { HandoverStack } from "@codexsun/ui/blocks/handover-stack";
import { IdeaHandoverWorkspace, type IdeaBriefDraft, type IdeaTaskDraft } from "@codexsun/ui/blocks/idea-handover";
import { AgentTaskWorkspace } from "@codexsun/ui/blocks/agent-task-workspace";
import { ArchivedChatWorkspace } from "@codexsun/ui/blocks/archived-chat-workspace";
import { SessionBoundary, type AuthenticatedRequest } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { AnalysisContext } from "@codexsun/ui/blocks/analysis-context";
import { ChatDateDivider, ChatResponseProgress, ChatTurnDivider } from "@codexsun/ui/blocks/chat-response-progress";
import { ChatComposer, type ChatComposerAttachment } from "@codexsun/ui/blocks/chat-composer";
import { ChatHistory } from "@codexsun/ui/blocks/chat-history";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { MarkdownContent } from "@codexsun/ui/components/markdown-content";
import { MessageScroller, MessageScrollerButton, MessageScrollerViewport } from "@codexsun/ui/components/message-scroller";
import { TopologyRegion } from "@codexsun/ui/features/interface-topology";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import type { ZetroAgentTask, ZetroChatAttachment, ZetroChatConversation, ZetroChatMessage, ZetroChatRuntime, ZetroChatStreamEvent, ZetroCodexDeviceCode, ZetroIdeaBrief } from "@codexsun/zetro-contracts";
import type { InterfaceTopologySection } from "@codexsun/ui/features/interface-topology";
import { ArchiveIcon, BotIcon, ClockIcon, CopyIcon, FileTextIcon, Layers3Icon, LayoutDashboardIcon, ListTodoIcon, MessageSquareIcon, PanelsTopLeftIcon, PresentationIcon, RotateCcwIcon, SettingsIcon, Share2Icon } from "lucide-react";
import { fillBriefFromSources } from "./brief-autofill";
import { configureZetroApiRequest, createAgentTask, createConversation, deleteArchivedConversations, deleteConversation as deleteStoredConversation, deliverAgentTask, generateCodexDeviceCode, getChatRuntime, getCodexDeviceCode, getConversation, getIdeaBrief, listAgentTasks, listConversations, saveIdeaBrief, streamMessage, updateChatRuntime, updateConversation as updateStoredConversation } from "./chat-api";

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
  return <SessionBoundary applicationId="zetro" applicationName="Zetro" autoLoginPath="/api/zetro/v1/auth/development-login" loginPath="/api/zetro/v1/auth/login">{(session) => session.portal === "user" ? <ZetroApp logout={session.logout} request={session.fetch} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="zetro" applicationName="Zetro" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="zetro" applicationName="Zetro" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}

function ZetroApp({ logout, request }: { logout: () => void; request: AuthenticatedRequest }) {
  configureZetroApiRequest(request);
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
  const responseFrameRef = useRef<number | undefined>(undefined);
  const pendingResponseRef = useRef<{ content: string; conversationId: string } | undefined>(undefined);
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
  const [taskDraft, setTaskDraft] = useState<IdeaTaskDraft>(emptyTaskDraft());
  const [agentTask, setAgentTask] = useState<ZetroAgentTask>();
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

  useEffect(() => () => {
    if (responseFrameRef.current) window.cancelAnimationFrame(responseFrameRef.current);
  }, []);

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
    setTaskDraft(emptyTaskDraft());
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

  async function submitLongPaste(file: File): Promise<void> {
    if (isLoading || !runtime.connected) return;
    const current = conversation ?? (await createConversation()).conversation;
    activeConversationIdRef.current = current.id;
    setConversation(current);
    setConversations((items) => [current, ...items.filter((item) => item.id !== current.id)]);
    setElapsedSeconds(0);
    await runStream(current.id, "Please refine the attached long text into a clear, practical idea. Preserve useful detail, identify gaps, and recommend the strongest next direction.", [{ content: arrayBufferToBase64(await file.arrayBuffer()), name: file.name, type: file.type }]);
  }

  function regenerateResponse(id: string): void {
    if (isLoading || !runtime.connected || !conversation) return;
    const responseIndex = messages.findIndex((message) => message.id === id);
    const prompt = messages.slice(0, responseIndex).reverse().find((message) => message.role === "user" && message.content);
    if (!prompt) return;
    void runStream(conversation.id, "Regenerate the previous response with a genuinely different, equally practical direction. Keep the established context and make the differences clear.");
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
      setTaskDraft(storedBrief ? taskDraftFromBrief(storedBrief) : emptyTaskDraft());
      try {
        const tasks = await listAgentTasks();
        const storedTask = storedBrief ? tasks.find((task) => task.briefId === storedBrief.id) : undefined;
        setAgentTask(storedTask);
        if (storedTask) setTaskDraft(taskDraftFromTask(storedTask));
      } catch {
        setAgentTask(undefined);
      }
      return storedBrief;
    } catch {
      setBrief(emptyBrief());
      setTaskDraft(emptyTaskDraft());
      setAgentTask(undefined);
      return undefined;
    }
  }

  async function openBrief(): Promise<void> {
    if (!conversation) return;
    const storedBrief = await loadBrief(conversation.id);
    if (!storedBrief) {
      const nextBrief = { ...emptyBrief(), sourceMessageIds: handoverMessageIds, title: conversation.title === "Untitled idea" ? "" : conversation.title };
      setBrief(nextBrief);
      setTaskDraft(taskDraftFromBriefDraft(nextBrief));
    }
    setBriefOpen(true);
  }

  async function saveBrief(status: "draft" | "final"): Promise<void> {
    if (!conversation) return;
    setIsSavingBrief(true);
    try {
      const saved = await saveIdeaBrief(conversation.id, { ...brief, status });
      setBrief(toBriefDraft(saved));
      setTaskDraft((current) => current.title || current.summary ? current : taskDraftFromBrief(saved));
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
      const nextTaskDraft = normalizeTaskDraft(taskDraft, saved);
      setTaskDraft(nextTaskDraft);
      const task = await createAgentTask({ ...nextTaskDraft, briefId: saved.id, projectReference: saved.projectReference, projectScope: saved.projectScope });
      setAgentTask(task);
      setAgentTasks((items) => [task, ...items.filter((item) => item.id !== task.id)]);
      setSelectedTaskId(task.id);
    } finally {
      setIsSavingBrief(false);
    }
  }

  async function deliverTaskToZuno(): Promise<void> {
    if (!agentTask || agentTask.status === "delivered") return;
    setIsSavingBrief(true);
    setAgentTask((current) => current ? { ...current, status: "delivering" } : current);
    try {
      const delivered = await deliverAgentTask(agentTask.id);
      setAgentTask(delivered);
      setAgentTasks((items) => items.map((item) => item.id === delivered.id ? delivered : item));
      appendExecutionEvent({ type: "complete", message: "Zuno accepted the prepared task." });
    } catch (error) {
      const tasks = await listAgentTasks().catch(() => []);
      const failed = tasks.find((task) => task.id === agentTask.id);
      if (failed) {
        setAgentTask(failed);
        setAgentTasks(tasks);
      }
      appendExecutionEvent({ type: "error", message: error instanceof Error ? error.message : "Zuno could not accept the prepared task." });
    } finally {
      setIsSavingBrief(false);
    }
  }

  function copyHandoffPackage(): void {
    if (!conversation) return;
    void navigator.clipboard.writeText(createHandoffPackageJson(conversation, brief, taskDraft));
    appendExecutionEvent({ type: "complete", message: "Copied the Zuno handoff package." });
  }

  function autoFillBrief(): void {
    const nextBrief = { ...fillBriefFromSources(brief, ideaSources), status: "draft" as const };
    setBrief(nextBrief);
    setTaskDraft((current) => current.title || current.summary ? current : taskDraftFromBriefDraft(nextBrief));
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

  const ideaSources = messages.filter((message) => message.role === "assistant" && message.content).map((message) => ({ content: message.content, id: message.id }));
  const handoverItems = ideaSources.filter((message) => handoverMessageIds.includes(message.id));
  const handoffPackagePreview = conversation ? createHandoffPackageJson(conversation, brief, taskDraft) : "";

  function appendExecutionEvent(event: ZetroChatStreamEvent): void {
    setExecutionEvents((items) => {
      const previous = items.at(-1);
      if (previous?.type === event.type && previous.message === event.message) return items;
      return [...items, event];
    });
  }

  function scheduleLiveResponse(conversationId: string, content: string): void {
    pendingResponseRef.current = { content, conversationId };
    if (responseFrameRef.current) return;
    responseFrameRef.current = window.requestAnimationFrame(() => {
      responseFrameRef.current = undefined;
      const pending = pendingResponseRef.current;
      pendingResponseRef.current = undefined;
      if (!pending || activeConversationIdRef.current !== pending.conversationId) return;
      setMessages((items) => items.map((message, index) => index === items.length - 1 && message.role === "assistant" ? { ...message, content: pending.content } : message));
    });
  }

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
        if (event.type === "response") scheduleLiveResponse(conversationId, event.message);
        else appendExecutionEvent(event);
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
        appendExecutionEvent({ type: "error", message });
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
      user={{ initials: "Z", name: "Zetro user", onSignOut: logout }}
      workspaceTitle="Zetro workspace"
    >
      {workspaceView === "archive" ? <ArchivedChatWorkspace chats={archivedConversations} onDelete={forceDeleteArchivedConversation} onDeleteAll={forceDeleteAllArchivedConversations} onOpen={openArchivedConversation} onRestore={restoreConversation} /> : workspaceView === "tasks" ? <AgentTaskWorkspace selectedTaskId={selectedTaskId} tasks={agentTasks} onBack={showActiveConversations} onSelectTask={setSelectedTaskId} /> : briefOpen ? <IdeaHandoverWorkspace brief={brief} currentStage={conversation?.stage ?? "explore"} handoffPackagePreview={handoffPackagePreview} saving={isSavingBrief} sources={ideaSources} task={agentTask} taskDraft={taskDraft} onArchiveConversation={conversation && agentTask ? () => void archiveConversation(conversation.id) : undefined} onAutoFillBrief={autoFillBrief} onBack={() => setBriefOpen(false)} onBriefChange={setBrief} onCopyHandoffPackage={copyHandoffPackage} onCreateTask={handOverToAgentTask} onDeliverTask={deliverTaskToZuno} onSaveBrief={saveBrief} onStageChange={changeIdeaStage} onTaskDraftChange={setTaskDraft} /> : <ZetroWorkspace attachments={attachments} conversation={conversation} draft={draft} elapsedSeconds={elapsedSeconds} executionEvents={executionEvents} handoverCount={handoverItems.length} isRecording={isRecording} isWorking={isLoading} messages={messages} queuedSteerCount={steerQueue.length} runtime={runtime} onAddAttachments={addAttachments} onDraftChange={setDraft} onLongTextPaste={submitLongPaste} onOpenBrief={openBrief} onOpenHandoverStack={() => setHandoverStackOpen(true)} onReconnect={reconnect} onRegenerate={regenerateResponse} onRemoveAttachment={removeAttachment} onRuntimeChange={updateRuntimeSelection} onStageChange={changeIdeaStage} onSteer={steer} onStop={stop} onSubmit={submit} onToggleHandover={toggleHandoverMessage} onVoiceToggle={toggleVoiceInput} selectedHandoverMessageIds={handoverMessageIds} />}
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

function ZetroWorkspace({ attachments, conversation, draft, elapsedSeconds, executionEvents, handoverCount, isRecording, isWorking, messages, queuedSteerCount, runtime, onAddAttachments, onDraftChange, onLongTextPaste, onOpenBrief, onOpenHandoverStack, onReconnect, onRegenerate, onRemoveAttachment, onRuntimeChange, onStageChange, onSteer, onStop, onSubmit, onToggleHandover, onVoiceToggle, selectedHandoverMessageIds }: { attachments: ChatComposerAttachment[]; conversation?: ZetroChatConversation; draft: string; elapsedSeconds: number; executionEvents: ZetroChatStreamEvent[]; handoverCount: number; isRecording: boolean; isWorking: boolean; messages: ZetroChatMessage[]; queuedSteerCount: number; runtime: ZetroChatRuntime; onAddAttachments: (files: File[]) => void; onDraftChange: (value: string) => void; onLongTextPaste: (file: File) => void; onOpenBrief: () => void; onOpenHandoverStack: () => void; onReconnect: () => void; onRegenerate: (id: string) => void; onRemoveAttachment: (id: string) => void; onRuntimeChange: (runtime: ZetroChatRuntime) => void; onStageChange: (stage: ZetroChatConversation["stage"]) => void; onSteer: () => void; onStop: () => void; onSubmit: () => void; onToggleHandover: (id: string) => void; onVoiceToggle: () => void; selectedHandoverMessageIds: string[] }) {
  const topology = useMdiTopology();
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [canScrollToLatest, setCanScrollToLatest] = useState(false);
  const didManuallyLeaveLatestRef = useRef(false);

  function updateScrollPosition(): void {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    const awayFromLatest = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 8;
    didManuallyLeaveLatestRef.current = awayFromLatest;
    setCanScrollToLatest(awayFromLatest);
  }

  function scrollToLatest(): void {
    messageViewportRef.current?.scrollTo({ top: messageViewportRef.current.scrollHeight, behavior: "smooth" });
    didManuallyLeaveLatestRef.current = false;
    setCanScrollToLatest(false);
  }

  useLayoutEffect(() => {
    if (!isWorking || didManuallyLeaveLatestRef.current) return;
    const frame = requestAnimationFrame(() => messageViewportRef.current?.scrollTo({ top: messageViewportRef.current.scrollHeight, behavior: "auto" }));
    return () => cancelAnimationFrame(frame);
  }, [executionEvents.length, isWorking, messages]);

  useEffect(() => {
    composerRef.current?.focus({ preventScroll: true });
  }, [isWorking]);

  return <TopologyRegion as="section" className="flex size-full min-h-0 flex-col bg-background" id="z02" topology={topology}>
    <TopologyRegion as="header" className="grid shrink-0 gap-3 border-b border-border px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" id="z02.1" topology={topology}>
      <div className="min-w-0"><h1 className="truncate text-sm font-semibold tracking-tight">{conversation?.title ?? "Start with an idea"}</h1><IdeaStageRail currentStage={conversation?.stage ?? "explore"} disabled={!conversation || isWorking} onStageChange={onStageChange} /></div>
      <div className="flex items-center justify-end gap-2">
      <Button aria-label={`Open handover stack (${handoverCount} responses)`} className="relative" size="icon-sm" variant="ghost" onClick={onOpenHandoverStack}><Layers3Icon />{handoverCount ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{handoverCount}</span> : null}</Button>
      <Button disabled={!conversation} size="sm" variant="outline" onClick={onOpenBrief}><FileTextIcon /> Brief</Button>
      <ChatRuntimeControls connected={runtime.connected} message={runtime.message} model={runtime.model} models={runtime.models} onModelChange={(model) => onRuntimeChange({ ...runtime, model: model as ZetroChatRuntime["model"] })} onProviderChange={(provider) => onRuntimeChange({ ...runtime, provider: provider as ZetroChatRuntime["provider"] })} onReasoningChange={(reasoning) => onRuntimeChange({ ...runtime, reasoning: reasoning as ZetroChatRuntime["reasoning"] })} onReconnect={onReconnect} provider={runtime.provider} providers={runtime.providers} reasoning={runtime.reasoning} reasoningLevels={runtime.reasoningLevels} />
      </div>
    </TopologyRegion>
    <TopologyRegion as="div" className="min-h-0 flex-1" id="z02.2" topology={topology}><MessageScroller><MessageScrollerViewport ref={messageViewportRef} className="px-6 py-7 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1" onScroll={updateScrollPosition}><AnalysisContext root={conversation?.analysisRoot} /><TopologyRegion as="div" className={`mx-auto flex w-4/5 flex-col ${isWorking ? "gap-1" : "gap-3"}`} id="z02.2.2" topology={topology}>{messages[0] ? <ChatDateDivider label={formatDateBadge(messages[0].createdAt)} /> : null}{messages.map((message, index) => { const isLiveAssistant = isWorking && message.role === "assistant" && index === messages.length - 1; const trace = message.trace ?? []; return <div key={message.id} className="flex flex-col gap-0.5"><div className={`group flex flex-col ${message.role === "user" ? "w-fit max-w-[80%] self-end" : "w-full self-start"}`}><article className={message.role === "user" ? "rounded-sm bg-muted/60 px-4 py-3 text-foreground shadow-sm" : isLiveAssistant ? "px-4 pt-3 pb-0" : "px-4 py-3"}><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{message.role === "assistant" ? <BotIcon aria-hidden="true" className="size-3.5" /> : null}{message.role === "user" ? "You" : message.role === "error" ? "Connection" : "Zetro"}</p>{message.content ? message.role === "assistant" ? <MarkdownContent className="mt-1" content={message.content} /> : <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p> : null}{isLiveAssistant ? <><ChatResponseProgress elapsedSeconds={elapsedSeconds} label="Working" tone="orange" /><ChatRuntimeTrace className="mt-2" elapsedSeconds={elapsedSeconds} events={executionEvents} isWorking /></> : trace.length ? <ChatRuntimeTrace className="mt-2" elapsedSeconds={0} events={trace} isWorking={false} /> : null}</article>{!isLiveAssistant ? <MessageActions content={message.content} handoverSelected={selectedHandoverMessageIds.includes(message.id)} isWorking={isWorking} messageId={message.id} role={message.role} timestamp={message.createdAt} title={conversation?.title ?? "Zetro response"} onRegenerate={onRegenerate} onToggleHandover={onToggleHandover} /> : null}</div>{message.role !== "user" && !isLiveAssistant ? <ChatTurnDivider /> : null}</div>})}</TopologyRegion></MessageScrollerViewport>{canScrollToLatest ? <MessageScrollerButton aria-label="Scroll to latest message" className="invisible border-border/70 opacity-0 shadow-sm transition-opacity group-hover/message-scroller:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100" onClick={scrollToLatest} /> : null}</MessageScroller></TopologyRegion>
    <TopologyRegion as="footer" className="sticky bottom-0 z-10 shrink-0 bg-background px-6 py-4" id="z02.3" topology={topology}>
      <TopologyRegion as="div" id="z02.3.1" topology={topology}><ChatComposer attachments={attachments} isRecording={isRecording} isWorking={isWorking} queuedSteerCount={queuedSteerCount} textareaRef={composerRef} value={draft} onAddFiles={onAddAttachments} onLongTextPaste={onLongTextPaste} onRemoveAttachment={onRemoveAttachment} onSteer={onSteer} onStop={onStop} onSubmit={onSubmit} onValueChange={onDraftChange} onVoiceToggle={onVoiceToggle} /></TopologyRegion>
    </TopologyRegion>
  </TopologyRegion>;
}

const ideaStages: readonly { id: ZetroChatConversation["stage"]; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "compare", label: "Compare" },
  { id: "revise", label: "Revise" },
  { id: "final", label: "Final" },
];

function IdeaStageRail({ currentStage, disabled, onStageChange }: { currentStage: ZetroChatConversation["stage"]; disabled: boolean; onStageChange: (stage: ZetroChatConversation["stage"]) => void }) {
  return <div className="mt-2 flex flex-wrap gap-1">{ideaStages.map((stage) => <Button key={stage.id} className="h-7 px-2 text-xs" disabled={disabled} size="sm" variant={stage.id === currentStage ? "secondary" : "ghost"} onClick={() => onStageChange(stage.id)}>{stage.label}</Button>)}</div>;
}

function MessageActions({ content, handoverSelected, isWorking, messageId, role, timestamp, title, onRegenerate, onToggleHandover }: { content: string; handoverSelected: boolean; isWorking: boolean; messageId: string; role: ZetroChatMessage["role"]; timestamp: string; title: string; onRegenerate: (id: string) => void; onToggleHandover: (id: string) => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareError, setShareError] = useState<string>();
  const [notice, setNotice] = useState("");
  const source = { content, title };

  async function runAction(action: () => Promise<void> | void, success: string): Promise<void> {
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That action could not complete.");
    }
  }

  async function share(channel: "email" | "whatsapp"): Promise<void> {
    try {
      setShareError(undefined);
      await PdfProvider.share(source, channel);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") setShareError(error instanceof Error ? error.message : "PDF sharing could not start.");
    }
  }

  if (role === "error") return null;

  return <><div className="invisible mt-0.5 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
    <Button aria-label="Copy message" size="icon-xs" variant="ghost" onClick={() => void runAction(() => PdfProvider.copyText(content), "Copied message.")}><CopyIcon /></Button>
    {role === "user" ? <><Button aria-label="Share message" size="icon-xs" variant="ghost" onClick={() => void runAction(() => PdfProvider.shareText(source), "Ready to share message.")}><Share2Icon /></Button><span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><ClockIcon className="size-3" />{formatMessageTime(timestamp)}</span></> : <><Button aria-label={handoverSelected ? "Remove from handover stack" : "Add to handover stack"} className={handoverSelected ? "text-primary" : undefined} disabled={isWorking} size="icon-xs" variant="ghost" onClick={() => { onToggleHandover(messageId); setNotice(handoverSelected ? "Removed from handover stack." : "Added to handover stack."); }}><Layers3Icon /></Button><Button aria-label="Regenerate response" disabled={isWorking} size="icon-xs" variant="ghost" onClick={() => { onRegenerate(messageId); setNotice("Regenerating a new response."); }}><RotateCcwIcon /></Button><Button aria-label="Share response as PDF" disabled={isWorking} size="icon-xs" variant="ghost" onClick={() => setShareOpen(true)}><Share2Icon /></Button><Button aria-label="Print response to PDF" disabled={isWorking} size="icon-xs" variant="ghost" onClick={() => void runAction(() => PdfProvider.print(source), "Print dialog opened.")}><PresentationIcon /></Button></>}
  </div><p aria-live="polite" className="sr-only">{notice}</p>{role === "assistant" ? <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent><DialogHeader><DialogTitle>Share response as PDF</DialogTitle><DialogDescription>Create a PDF from this response, then choose where to share it.</DialogDescription></DialogHeader>{shareError ? <p className="text-sm text-destructive">{shareError}</p> : null}<DialogFooter><Button variant="outline" onClick={() => void runAction(async () => { await PdfProvider.download(source); }, "PDF downloaded.")}>Download PDF</Button><Button variant="outline" onClick={() => void share("email")}>Email PDF</Button><Button onClick={() => void share("whatsapp")}>WhatsApp PDF</Button></DialogFooter></DialogContent></Dialog> : null}</>;
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

function emptyTaskDraft(): IdeaTaskDraft {
  return { acceptanceCriteria: "", priority: "medium", summary: "", title: "" };
}

function toBriefDraft(value: ZetroIdeaBrief): IdeaBriefDraft {
  return { audience: value.audience, constraints: value.constraints, exclusions: value.exclusions, outcome: value.outcome, projectReference: value.projectReference, projectScope: value.projectScope, risks: value.risks, scope: value.scope, sourceMessageIds: value.sourceMessageIds, status: value.status, successSignals: value.successSignals, title: value.title };
}

function taskDraftFromBrief(brief: ZetroIdeaBrief): IdeaTaskDraft {
  return normalizeTaskDraft(emptyTaskDraft(), brief);
}

function taskDraftFromBriefDraft(brief: IdeaBriefDraft): IdeaTaskDraft {
  return normalizeTaskDraft(emptyTaskDraft(), brief);
}

function taskDraftFromTask(task: ZetroAgentTask): IdeaTaskDraft {
  return { acceptanceCriteria: task.acceptanceCriteria, priority: task.priority, summary: task.summary, title: task.title };
}

function normalizeTaskDraft(task: IdeaTaskDraft, brief: Pick<IdeaBriefDraft, "outcome" | "successSignals" | "title">): IdeaTaskDraft {
  return {
    acceptanceCriteria: task.acceptanceCriteria.trim() || brief.successSignals.trim(),
    priority: task.priority,
    summary: task.summary.trim() || brief.outcome.trim(),
    title: task.title.trim() || brief.title.trim(),
  };
}

function createHandoffPackageJson(conversation: Pick<ZetroChatConversation, "id" | "title">, brief: IdeaBriefDraft, taskDraft: IdeaTaskDraft): string {
  return JSON.stringify({
    kind: "zetro.prepared-task",
    version: 1,
    conversationId: conversation.id,
    conversationTitle: conversation.title,
    brief,
    task: normalizeTaskDraft(taskDraft, brief),
    target: "zuno",
    executionOwner: "cxforge",
    exclusions: ["repository validation", "git worktree creation", "model execution", "build checks", "preview hosting", "merge request creation"],
  }, null, 2);
}
