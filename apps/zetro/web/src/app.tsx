import { useEffect, useMemo, useRef, useState } from "react";
import { MainWorkspace } from "@codexsun/ui";
import { ChatRuntimeControls } from "@codexsun/ui/blocks/chat-runtime-controls";
import { ChatRuntimeTrace } from "@codexsun/ui/blocks/chat-runtime-trace";
import { ChatDateDivider, ChatResponseProgress, ChatTurnDivider } from "@codexsun/ui/blocks/chat-response-progress";
import { ChatComposer, type ChatComposerAttachment } from "@codexsun/ui/blocks/chat-composer";
import { ChatHistory } from "@codexsun/ui/blocks/chat-history";
import { Button } from "@codexsun/ui/components/button";
import { MarkdownContent } from "@codexsun/ui/components/markdown-content";
import { MessageScroller, MessageScrollerButton, MessageScrollerViewport } from "@codexsun/ui/components/message-scroller";
import { TopologyRegion } from "@codexsun/ui/features/interface-topology";
import { useMdiTopology } from "@codexsun/ui/layouts/mdi-main";
import type { ZetroChatConversation, ZetroChatMessage, ZetroChatRuntime, ZetroChatStreamEvent } from "@codexsun/zetro-contracts";
import type { InterfaceTopologySection } from "@codexsun/ui/features/interface-topology";
import { BotIcon, ClockIcon, CopyIcon, FileTextIcon, LightbulbIcon, MessageSquareIcon, PanelsTopLeftIcon, RotateCcwIcon, Share2Icon } from "lucide-react";
import { createConversation, getChatRuntime, getConversation, listConversations, streamMessage } from "./chat-api.js";

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

export function App() {
  const [conversations, setConversations] = useState<ZetroChatConversation[]>([]);
  const [conversation, setConversation] = useState<ZetroChatConversation>();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([]);
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
  const isLoading = isStreaming;

  useEffect(() => {
    if (!isLoading) return;
    const startedAt = Date.now();
    const interval = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1_000)), 1_000);
    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    void listConversations().then(setConversations).catch((error: unknown) => setExecutionEvents([{ type: "error", message: error instanceof Error ? error.message : "Zetro API is unavailable." }]));
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
    <ZetroHistory activeConversationId={conversation?.id} conversations={conversations} pinnedConversationIds={pinnedConversationIds} onCreate={startConversation} onDelete={deleteConversation} onRename={renameConversation} onSelect={selectConversation} onTogglePin={toggleConversationPin} />
  ), [conversation?.id, conversations, pinnedConversationIds]);

  function selectConversation(id: string): void {
    const selected = conversations.find((item) => item.id === id);
    if (!selected) return;
    if (activeConversationIdRef.current) setMessagesByConversation((items) => ({ ...items, [activeConversationIdRef.current!]: messages }));
    activeConversationIdRef.current = selected.id;
    setConversation(selected);
    void getConversation(selected.id).then((view) => setMessages(view.messages)).catch(() => setMessages(messagesByConversation[selected.id] ?? []));
    setSteerQueue([]);
  }

  async function startConversation(): Promise<void> {
    const { conversation: nextConversation } = await createConversation();
    setConversations((items) => [nextConversation, ...items]);
    activeConversationIdRef.current = nextConversation.id;
    setMessagesByConversation((items) => ({ ...items, [nextConversation.id]: [] }));
    setConversation(nextConversation);
    streamAbortRef.current?.abort();
    setMessages([]);
    setSteerQueue([]);
    setAttachments([]);
  }

  async function submit(): Promise<void> {
    const attachmentSummary = attachments.map((attachment) => `[Attached: ${attachment.name}]`).join(" ");
    const content = [draft.trim(), attachmentSummary].filter(Boolean).join("\n");
    if (!content || isLoading) return;
    if (!runtime.connected) {
      setExecutionEvents([{ type: "error", message: runtime.message }]);
      return;
    }

    const current = conversation ?? (await createConversation()).conversation;
    activeConversationIdRef.current = current.id;
    setConversation(current);
    setConversations((items) => [current, ...items.filter((item) => item.id !== current.id)]);
    setDraft("");
    setAttachments([]);
    setElapsedSeconds(0);
    void runStream(current.id, content);
  }

  function addAttachments(files: File[]): void {
    setAttachments((items) => [
      ...items,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
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

  function toggleConversationPin(id: string): void {
    setPinnedConversationIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [id, ...items]);
  }

  function renameConversation(id: string): void {
    const current = conversations.find((item) => item.id === id);
    const title = window.prompt("Rename conversation", current?.title);
    if (!title?.trim()) return;
    setConversations((items) => items.map((item) => item.id === id ? { ...item, title: title.trim() } : item));
    setConversation((item) => item?.id === id ? { ...item, title: title.trim() } : item);
  }

  function deleteConversation(id: string): void {
    setConversations((items) => items.filter((item) => item.id !== id));
    setPinnedConversationIds((items) => items.filter((item) => item !== id));
    setMessagesByConversation((items) => Object.fromEntries(Object.entries(items).filter(([key]) => key !== id)));
    if (activeConversationIdRef.current === id) {
      activeConversationIdRef.current = undefined;
      setConversation(undefined);
      setMessages([]);
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
    try {
      setRuntime(await getChatRuntime());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not reach the local Codex CLI.";
      setRuntime({ ...disconnectedRuntime, message });
    }
  }

  async function runStream(conversationId: string | undefined, content: string): Promise<void> {
    if (!conversationId) return;
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsStreaming(true);
    setExecutionEvents([]);
    setMessages((items) => [...items, { id: crypto.randomUUID(), conversationId, role: "user", content, createdAt: new Date().toISOString() }]);
    try {
      await streamMessage(conversationId, content, runtime, (event) => {
        setExecutionEvents((items) => [...items.slice(-80), event]);
      }, controller.signal);
      const view = await getConversation(conversationId);
      setConversation(view.conversation);
      setMessages(view.messages);
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
            { active: true, icon: MessageSquareIcon, id: "chat", label: "Conversation" },
            { icon: LightbulbIcon, id: "ideas", label: "Ideas" },
          ],
          label: "Agent tools",
        },
        secondaryRail: {
          items: [
            { icon: FileTextIcon, id: "brief", label: "Brief" },
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
      primaryAction={{ label: "New conversation", onSelect: startConversation }}
      sidebarContent={history}
      sidebarFooter={<p className="px-2 text-xs text-muted-foreground">{isLoading ? `Working for ${elapsedSeconds}s` : steerQueue.length ? `${steerQueue.length} steer queued` : "Frontend idea workspace"}</p>}
      sidebarStateKey="codexsun.zetro.sidebar"
      statusLabel="Ready"
      showMdiOverview
      topologySections={zetroTopologySections}
      workspaceTitle="Idea workspace"
    >
      <ZetroWorkspace attachments={attachments} conversation={conversation} draft={draft} elapsedSeconds={elapsedSeconds} executionEvents={executionEvents} isRecording={isRecording} isWorking={isLoading} messages={messages} queuedSteerCount={steerQueue.length} runtime={runtime} onAddAttachments={addAttachments} onDraftChange={setDraft} onReconnect={refreshRuntime} onRemoveAttachment={removeAttachment} onRuntimeChange={setRuntime} onSteer={steer} onStop={stop} onSubmit={submit} onVoiceToggle={toggleVoiceInput} />
    </MainWorkspace>
  );
}

function ZetroHistory({ activeConversationId, conversations, pinnedConversationIds, onCreate, onDelete, onRename, onSelect, onTogglePin }: { activeConversationId?: string; conversations: ZetroChatConversation[]; pinnedConversationIds: string[]; onCreate: () => void; onDelete: (id: string) => void; onRename: (id: string) => void; onSelect: (id: string) => void; onTogglePin: (id: string) => void }) {
  const topology = useMdiTopology();
  return <TopologyRegion as="div" className="flex min-h-0 flex-1" id="z01" topology={topology}><ChatHistory activeId={activeConversationId} items={conversations.map((item) => ({ id: item.id, pinned: pinnedConversationIds.includes(item.id), title: item.title }))} onCreate={onCreate} onDelete={onDelete} onPin={onTogglePin} onRename={onRename} onSelect={onSelect} /></TopologyRegion>;
}

function ZetroWorkspace({ attachments, conversation, draft, elapsedSeconds, executionEvents, isRecording, isWorking, messages, queuedSteerCount, runtime, onAddAttachments, onDraftChange, onReconnect, onRemoveAttachment, onRuntimeChange, onSteer, onStop, onSubmit, onVoiceToggle }: { attachments: ChatComposerAttachment[]; conversation?: ZetroChatConversation; draft: string; elapsedSeconds: number; executionEvents: ZetroChatStreamEvent[]; isRecording: boolean; isWorking: boolean; messages: ZetroChatMessage[]; queuedSteerCount: number; runtime: ZetroChatRuntime; onAddAttachments: (files: File[]) => void; onDraftChange: (value: string) => void; onReconnect: () => void; onRemoveAttachment: (id: string) => void; onRuntimeChange: (runtime: ZetroChatRuntime) => void; onSteer: () => void; onStop: () => void; onSubmit: () => void; onVoiceToggle: () => void }) {
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
      <ChatRuntimeControls connected={runtime.connected} message={runtime.message} model={runtime.model} models={runtime.models} onModelChange={(model) => onRuntimeChange({ ...runtime, model: model as ZetroChatRuntime["model"] })} onProviderChange={(provider) => onRuntimeChange({ ...runtime, provider: provider as ZetroChatRuntime["provider"] })} onReasoningChange={(reasoning) => onRuntimeChange({ ...runtime, reasoning: reasoning as ZetroChatRuntime["reasoning"] })} onReconnect={onReconnect} provider={runtime.provider} providers={runtime.providers} reasoning={runtime.reasoning} reasoningLevels={runtime.reasoningLevels} />
    </TopologyRegion>
    <TopologyRegion as="div" className="min-h-0 flex-1" id="z02.2" topology={topology}><MessageScroller><MessageScrollerViewport ref={messageViewportRef} className="px-6 py-7 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1" onScroll={updateScrollPosition}><TopologyRegion as="div" className={`mx-auto flex w-4/5 flex-col ${isWorking ? "gap-1" : "gap-3"}`} id="z02.2.2" topology={topology}>{messages[0] ? <ChatDateDivider label={formatDateBadge(messages[0].createdAt)} /> : null}{messages.map((message, index) => <div key={message.id} className="flex flex-col gap-0.5"><div className={`group flex flex-col ${message.role === "user" ? "w-fit max-w-[80%] self-end" : "w-full self-start"}`}><article className={message.role === "user" ? "rounded-sm bg-muted/60 px-4 py-3 text-foreground shadow-sm" : isWorking && index === messages.length - 1 ? "px-4 pt-3 pb-0" : "px-4 py-3"}><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{message.role === "assistant" ? <BotIcon aria-hidden="true" className="size-3.5" /> : null}{message.role === "user" ? "You" : message.role === "error" ? "Connection" : "Zetro"}</p>{message.content ? message.role === "assistant" ? <MarkdownContent className="mt-1" content={message.content} /> : <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.content}</p> : null}</article>{!(isWorking && message.role === "assistant" && index === messages.length - 1) ? <MessageActions role={message.role} timestamp={message.createdAt} /> : null}</div>{message.role !== "user" && !(isWorking && index === messages.length - 1) ? <ChatTurnDivider /> : null}</div>)}{isWorking ? <ChatResponseProgress elapsedSeconds={elapsedSeconds} label="Working" tone="orange" /> : null}</TopologyRegion></MessageScrollerViewport>{canScrollToLatest ? <MessageScrollerButton aria-label="Scroll to latest message" className="invisible border-border/70 opacity-0 shadow-sm transition-opacity group-hover/message-scroller:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100" onClick={scrollToLatest} /> : null}</MessageScroller></TopologyRegion>
    <ChatRuntimeTrace elapsedSeconds={elapsedSeconds} events={executionEvents.filter((event) => event.raw)} isWorking={isWorking} />
    <TopologyRegion as="footer" className="sticky bottom-0 z-10 shrink-0 bg-background px-6 py-4" id="z02.3" topology={topology}>
      <TopologyRegion as="div" id="z02.3.1" topology={topology}><ChatComposer attachments={attachments} isRecording={isRecording} isWorking={isWorking} queuedSteerCount={queuedSteerCount} value={draft} onAddFiles={onAddAttachments} onRemoveAttachment={onRemoveAttachment} onSteer={onSteer} onStop={onStop} onSubmit={onSubmit} onValueChange={onDraftChange} onVoiceToggle={onVoiceToggle} /></TopologyRegion>
    </TopologyRegion>
  </TopologyRegion>;
}

function MessageActions({ role, timestamp }: { role: ZetroChatMessage["role"]; timestamp: string }) {
  if (role === "error") return null;

  return <div className="invisible mt-0.5 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
    <Button aria-label="Copy message" size="icon-xs" variant="ghost"><CopyIcon /></Button>
    {role === "user" ? <><Button aria-label="Share message" size="icon-xs" variant="ghost"><Share2Icon /></Button><span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><ClockIcon className="size-3" />{formatMessageTime(timestamp)}</span></> : <><Button aria-label="Regenerate response" size="icon-xs" variant="ghost"><RotateCcwIcon /></Button><Button aria-label="Share response" size="icon-xs" variant="ghost"><Share2Icon /></Button></>}
  </div>;
}


function formatDateBadge(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(timestamp));
}

function formatMessageTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}
