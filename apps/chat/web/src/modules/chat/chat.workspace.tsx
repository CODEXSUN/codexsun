import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CheckCheck,
  Download,
  Eye,
  FileText,
  Mic,
  MoreVertical,
  Paperclip,
  Pencil,
  Phone,
  Play,
  Plus,
  Reply,
  Search,
  ShieldCheck,
  Smile,
  Star,
  Trash2,
  Users,
  Video,
  Volume2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@codexsun/ui/components/dropdown-menu";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { Textarea } from "@codexsun/ui/components/textarea";
import { cn } from "@codexsun/ui/lib/utils";
import { ChatChannelForm } from "./chat.form";
import { useChatMembers, useChatRealtime, useChatWorkspace } from "./chat.hooks";
import {
  ChatChannelList,
  avatarTone,
  bubbleTime,
  dayLabel,
  formatBytes,
  initials,
  senderTone
} from "./chat.list";
import { chatMemberSchema, chatMessageSchema } from "./chat.schema";
import type {
  ChatAttachmentPayload,
  ChatChannel,
  ChatChannelKind,
  ChatChannelSavePayload,
  ChatMemberRole,
  ChatMessage,
  ChatUserOption
} from "./chat.types";
import { ChatUserPickerModal } from "./chat.user-picker";

const FAVOURITES_KEY = "codexsun.chat.favourites.v1";
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "🎉", "👏", "☕"] as const;

type PendingAttachment = ChatAttachmentPayload & { sizeBytes: number };

export function ChatWorkspace({
  currentUserEmail = "",
  filterKind,
  channelUuids,
  title,
  onConfigure
}: {
  currentUserEmail?: string;
  filterKind?: ChatChannelKind | undefined;
  channelUuids?: string[];
  title?: string;
  onConfigure?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ChatChannel | null>(null);
  const [channelForm, setChannelForm] = useState<{ channel: ChatChannel | null; open: boolean }>({
    channel: null,
    open: false
  });
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState<ChatChannel | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editBody, setEditBody] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ChatMemberRole>("member");
  const [favourites, setFavourites] = useState<Set<string>>(readFavourites);
  const [emojiBarOpen, setEmojiBarOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; name: string } | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLElement>());

  const chat = useChatWorkspace(search, selected?.uuid ?? null);
  const members = useChatMembers(
    membersOpen || selected !== null ? (selected?.uuid ?? null) : null
  );
  const realtime = useChatRealtime(selected?.uuid ?? null);

  const channels = useMemo(
    () =>
      [...(chat.channels.data ?? [])]
        .filter((channel) => !filterKind || channel.kind === filterKind)
        .filter((channel) => !channelUuids || channelUuids.includes(channel.uuid))
        .sort((left, right) => {
          const leftTime = left.lastMessageAt ?? left.updatedAt;
          const rightTime = right.lastMessageAt ?? right.updatedAt;
          return rightTime.localeCompare(leftTime);
        }),
    [chat.channels.data, filterKind, channelUuids]
  );

  const panelTitle = useMemo(() => {
    if (title) return title;
    if (filterKind === "dm") return "Chat";
    if (filterKind === "group") return "Groups";
    if (filterKind === "channel") return "Channels";
    if (filterKind === "broadcast") return "Broadcasts";
    return "Chat";
  }, [filterKind, title]);

  const messages = chat.messages.data ?? [];
  const memberRecords = members.members.data ?? [];
  const selfEmail = currentUserEmail.trim().toLowerCase();

  const typingNames = realtime.typingEmails
    .filter((email) => email.toLowerCase() !== selfEmail)
    .map((email) => email.split("@")[0]);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [selected?.uuid, messages.length]);

  useEffect(() => {
    if (selected) void chat.markRead.mutateAsync(selected.uuid).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.uuid, messages.length]);

  useEffect(() => {
    setDraft("");
    setPending([]);
    setReplyTo(null);
    setEditingMessage(null);
    setMembersOpen(false);
    setEmojiBarOpen(false);
  }, [selected?.uuid]);

  useEffect(() => {
    if (channels.length > 0) {
      if (!selected || !channels.some((channel) => channel.uuid === selected.uuid)) {
        setSelected(channels[0] ?? null);
      }
    } else {
      setSelected(null);
    }
  }, [channels, filterKind]);

  function select(channel: ChatChannel) {
    setSelected(channel);
    if (channel.unreadCount > 0) {
      void chat.markRead.mutateAsync(channel.uuid).catch(() => undefined);
    }
  }

  function notifyTyping() {
    if (!selected) return;
    realtime.client.current?.sendTyping(selected.uuid, true);
    if (typingTimer.current !== null) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      if (selected) realtime.client.current?.sendTyping(selected.uuid, false);
    }, 1500);
  }

  function stopTyping() {
    if (typingTimer.current !== null) {
      window.clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    if (selected) realtime.client.current?.sendTyping(selected.uuid, false);
  }

  function toggleFavourite(channel: ChatChannel) {
    setFavourites((current) => {
      const next = new Set(current);
      if (next.has(channel.uuid)) next.delete(channel.uuid);
      else next.add(channel.uuid);
      try {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify([...next]));
      } catch {
        // favourites stay session-local when storage is unavailable.
      }
      return next;
    });
  }

  async function saveChannel(payload: ChatChannelSavePayload) {
    try {
      if (channelForm.channel) {
        const updated = await chat.renameChannel.mutateAsync({
          id: channelForm.channel.uuid,
          name: payload.name
        });
        setSelected(updated);
      } else {
        const created = await chat.createChannel.mutateAsync(payload);
        setSelected(created);
      }
      setChannelForm({ channel: null, open: false });
      toast.success(channelForm.channel ? "Channel renamed" : "Chat created");
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  }

  async function pickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const accepted = Array.from(files).slice(0, MAX_ATTACHMENTS - pending.length);
    const next: PendingAttachment[] = [];
    for (const file of accepted) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`"${file.name}" is larger than 15 MB and was skipped.`);
        continue;
      }
      next.push({
        base64: await readFileBase64(file),
        fileName: file.name.slice(0, 255),
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size
      });
    }
    setPending((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function send() {
    if (!selected) return;
    if (!draft.trim() && !pending.length) {
      toast.error("Type a message or attach a file first.");
      return;
    }
    const parsed = chatMessageSchema.safeParse({
      attachments: pending.map(({ base64, fileName, mimeType }) => ({
        base64,
        fileName,
        mimeType
      })),
      body: draft,
      channelUuid: selected.uuid
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the message.");
      return;
    }
    try {
      await chat.createMessage.mutateAsync({
        ...parsed.data,
        ...(replyTo ? { replyToUuid: replyTo.uuid } : {})
      });
      stopTyping();
      setDraft("");
      setPending([]);
      setReplyTo(null);
      setEmojiBarOpen(false);
      await chat.markRead.mutateAsync(selected.uuid).catch(() => undefined);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function saveMessageEdit() {
    if (!editingMessage) return;
    if (!editBody.trim()) {
      toast.error("Message body is required.");
      return;
    }
    try {
      await chat.updateMessage.mutateAsync({ body: editBody.trim(), id: editingMessage.uuid });
      setEditingMessage(null);
      setEditBody("");
      toast.success("Message updated");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function addMember() {
    if (!selected) return;
    const parsed = chatMemberSchema.safeParse({ role: newMemberRole, userEmail: newMemberEmail });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the member email.");
      return;
    }
    try {
      await members.addMember.mutateAsync({ channelUuid: selected.uuid, ...parsed.data });
      setNewMemberEmail("");
      toast.success("Member added");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleNewChat() {
    if (filterKind === "dm") {
      setUserPickerOpen(true);
    } else {
      setChannelForm({ channel: null, open: true });
    }
  }

  async function handleSelectUserForDm(user: ChatUserOption) {
    try {
      const existing = (chat.channels.data ?? []).find(
        (c) =>
          c.kind === "dm" &&
          (c.name.trim().toLowerCase() === user.name.trim().toLowerCase() ||
            c.name.trim().toLowerCase() === user.email.trim().toLowerCase())
      );
      if (existing) {
        setSelected(existing);
        setUserPickerOpen(false);
        return;
      }
      const created = await chat.createChannel.mutateAsync({
        kind: "dm",
        members: [user.email],
        name: user.name || user.email
      });
      setSelected(created);
      setUserPickerOpen(false);
      toast.success(`Chat started with ${user.name}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* LEFT PANEL: CONTACTS / CHATS LIST */}
      <section
        className="flex w-[320px] shrink-0 flex-col border-r border-border bg-card text-card-foreground overflow-hidden"
        style={{ width: "320px" }}
      >
        {/* Left Header: "Chats" + Add Button */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{panelTitle}</h2>
          <Button
            size="icon"
            variant="outline"
            type="button"
            title={onConfigure ? "Telegram settings" : "New conversation"}
            className="size-8 rounded-lg"
            onClick={onConfigure ?? handleNewChat}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Search input */}
        <div className="shrink-0 p-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${panelTitle.toLowerCase()}...`}
              aria-label="Search chats"
              className="h-9 rounded-lg bg-background pl-9 text-sm"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatChannelList
            channels={channels}
            currentUserEmail={selfEmail}
            favourites={favourites}
            loading={chat.channels.isPending}
            onSelect={select}
            selectedId={selected?.uuid ?? null}
            onToggleFavourite={toggleFavourite}
            onEdit={(channel) => setChannelForm({ channel, open: true })}
            onSuspend={(channel) => void suspendChannel(channel)}
            onRestore={(channel) => void restoreChannel(channel)}
            onDelete={setDeletingChannel}
          />
        </div>
      </section>

      {/* RIGHT PANEL: CHAT WINDOW */}
      <section className="flex flex-1 min-w-0 flex-col bg-background text-card-foreground overflow-hidden">
        {selected ? (
          <>
            {/* Top Active Chat Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b px-5 bg-card">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Back to chats"
                  className="size-8 rounded-lg md:hidden -ml-2 mr-1"
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeft className="size-4" />
                </Button>

                {/* Avatar with Online Green Dot */}
                <div
                  className="relative shrink-0 cursor-pointer"
                  onClick={() => setMembersOpen(true)}
                  title="View info"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-xs font-semibold shadow-2xs",
                      avatarTone(selected.name)
                    )}
                  >
                    {initials(selected.name)}
                  </span>
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>

                {/* Name & Status */}
                <div className="min-w-0">
                  <h3
                    className="truncate text-sm font-semibold text-foreground leading-tight cursor-pointer hover:underline"
                    onClick={() => setMembersOpen(true)}
                  >
                    {selected.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-tight">
                    {typingNames.length ? `${typingNames.join(", ")} is typing…` : "Online"}
                  </p>
                </div>
              </div>

              {/* Right Action Icons: Video, Phone, More */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Video call"
                  className="size-9 rounded-lg hover:text-foreground"
                  onClick={() => toast.info("Video call feature connected.")}
                >
                  <Video className="size-4.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Audio call"
                  className="size-9 rounded-lg hover:text-foreground"
                  onClick={() => toast.info("Audio call feature connected.")}
                >
                  <Phone className="size-4.5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      title="More options"
                      className="size-9 rounded-lg hover:text-foreground"
                    >
                      <MoreVertical className="size-4.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <a href="/app/chat/telegram/settings">Telegram settings</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                      <Users className="mr-2 size-4" />
                      Channel info & members
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFavourite(selected)}>
                      <Star className="mr-2 size-4 text-amber-400" />
                      {favourites.has(selected.uuid) ? "Remove favourite" : "Mark favourite"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setChannelForm({ channel: selected, open: true })}
                    >
                      <Pencil className="mr-2 size-4" />
                      Rename chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {selected.status === "active" ? (
                      <DropdownMenuItem onClick={() => void suspendChannel(selected)}>
                        <Archive className="mr-2 size-4" />
                        Archive channel
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => void restoreChannel(selected)}>
                        <ArchiveRestore className="mr-2 size-4" />
                        Unarchive channel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDeletingChannel(selected)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-4 text-destructive" />
                      Delete channel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Messages Scroll Area */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chat.messages.isPending ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-xs text-muted-foreground">Loading messages…</p>
                </div>
              ) : messages.length ? (
                <ShadcnThreadMessages
                  currentUserEmail={selfEmail}
                  kind={selected.kind}
                  messageRefs={messageRefs}
                  messages={messages}
                  onEdit={(message) => {
                    setEditingMessage(message);
                    setEditBody(message.body);
                  }}
                  onReply={setReplyTo}
                  onSuspend={(message) => void suspendMessage(message)}
                  onRestore={(message) => void restoreMessage(message)}
                  onDelete={setDeletingMessage}
                  onImageClick={(src, name) => setLightboxImage({ src, name })}
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <Users className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No messages yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Send a message below to start the conversation.
                  </p>
                </div>
              )}
              <div ref={threadEnd} />
            </div>

            {/* Bottom Input Area */}
            <footer className="border-t bg-card p-3 shrink-0">
              {/* Replying banner */}
              {replyTo ? (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">
                      Replying to {replyTo.senderEmail.split("@")[0]}:{" "}
                    </span>
                    <span className="truncate text-muted-foreground">{replyTo.body || "File"}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5 rounded-full"
                    onClick={() => setReplyTo(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : null}

              {/* Pending Attachments */}
              {pending.length ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pending.map((file, index) => (
                    <span
                      key={`${file.fileName}-${index}`}
                      className="inline-flex max-w-56 items-center gap-1.5 rounded-lg border bg-muted/40 py-1 pl-2 pr-1 text-xs"
                    >
                      <FileText className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate min-w-0">{file.fileName}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-5 rounded-full"
                        onClick={() => setPending((curr) => curr.filter((_, pos) => pos !== index))}
                      >
                        <X className="size-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Quick Emojis strip */}
              {emojiBarOpen ? (
                <div className="mb-2 flex items-center gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setDraft((prev) => prev + emoji);
                        notifyTyping();
                      }}
                      className="rounded p-1 text-base transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Input Controls Row */}
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    notifyTyping();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Type a message..."
                  aria-label="Message"
                  className="flex-1 bg-transparent border-0 shadow-none px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-0 outline-none"
                />

                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Emoji"
                  className={cn(
                    "size-8 rounded-full text-muted-foreground hover:text-foreground",
                    emojiBarOpen && "text-primary"
                  )}
                  onClick={() => setEmojiBarOpen((v) => !v)}
                >
                  <Smile className="size-4.5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Attach file"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip className="size-4.5" />
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.mp3,.mp4"
                  className="hidden"
                  aria-label="Attach files"
                  onChange={(event) => void pickFiles(event.target.files)}
                />

                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  title="Voice note"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => toast.info("Voice recording ready.")}
                >
                  <Mic className="size-4.5" />
                </Button>

                {/* Send Button with "Send" Text (Shadcn UI Kit style) */}
                <Button
                  type="button"
                  disabled={chat.createMessage.isPending}
                  onClick={() => void send()}
                  className="rounded-lg h-9 px-4 text-sm font-medium bg-[#71717a] hover:bg-[#52525b] text-white dark:bg-primary dark:text-primary-foreground shadow-2xs"
                >
                  Send
                </Button>
              </div>
            </footer>
          </>
        ) : (
          /* Empty State Screen */
          <div className="flex h-full flex-col items-center justify-center p-6 text-center select-none">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <Users className="size-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Select a chat</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Choose a conversation from the left to start messaging, share documents, or view
              history.
            </p>
            <Button variant="outline" className="mt-5 rounded-lg" onClick={handleNewChat}>
              <Plus className="mr-2 size-4" />
              Start a new conversation
            </Button>
          </div>
        )}
      </section>

      {/* MODALS */}
      <ChatUserPickerModal
        busy={chat.createChannel.isPending}
        currentUserEmail={selfEmail}
        open={userPickerOpen}
        onOpenChange={setUserPickerOpen}
        onSelectUser={handleSelectUserForDm}
      />

      <ChatChannelForm
        key={channelForm.channel?.uuid ?? `new-${filterKind ?? "default"}`}
        busy={chat.createChannel.isPending || chat.renameChannel.isPending}
        channel={channelForm.channel}
        defaultKind={filterKind ?? "channel"}
        open={channelForm.open}
        onOpenChange={(open) => !open && setChannelForm({ channel: null, open: false })}
        onSubmit={saveChannel}
      />

      {/* CHANNEL INFO / PARTICIPANTS DIALOG */}
      {selected ? (
        <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center pt-2 pb-1 text-center">
                <span
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full text-base font-bold shadow-sm mb-2.5",
                    avatarTone(selected.name)
                  )}
                >
                  {initials(selected.name)}
                </span>
                <DialogTitle className="text-lg font-semibold">{selected.name}</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {selected.kind === "broadcast"
                    ? "Broadcast announcements"
                    : selected.kind === "dm"
                      ? "Direct messaging thread"
                      : "Group conversation"}{" "}
                  · {memberRecords.length} participant{memberRecords.length === 1 ? "" : "s"}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-2 space-y-4">
              <div className="rounded-xl border bg-muted/30 p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add Participant
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={newMemberEmail}
                    onChange={(event) => setNewMemberEmail(event.target.value)}
                    placeholder="member@company.test"
                    aria-label="Member email"
                    className="h-8 text-sm"
                  />
                  <Select
                    value={newMemberRole}
                    onValueChange={(value) => setNewMemberRole(value as "admin" | "member")}
                  >
                    <SelectTrigger aria-label="Member role" className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8" type="button" onClick={() => void addMember()}>
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Participants ({memberRecords.length})
                </span>
                <ul className="mt-2 max-h-48 divide-y overflow-y-auto rounded-xl border">
                  {memberRecords.map((member) => (
                    <li
                      key={member.uuid}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/30"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                            avatarTone(member.userEmail)
                          )}
                        >
                          {member.userEmail.charAt(0).toUpperCase()}
                        </span>
                        <span className="block truncate font-medium text-foreground">
                          {member.userEmail}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {member.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ShieldCheck className="size-3" /> Admin
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Member</span>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 text-muted-foreground hover:text-destructive"
                          title="Remove member"
                          onClick={() => void removeMember(member.uuid)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                  {memberRecords.length ? null : (
                    <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {members.members.isPending ? "Loading members…" : "No members added yet."}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* IMAGE LIGHTBOX */}
      {lightboxImage ? (
        <Dialog open onOpenChange={(open) => !open && setLightboxImage(null)}>
          <DialogContent className="max-w-3xl overflow-hidden p-0 bg-black/95 text-white border-none">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="truncate text-sm font-medium">{lightboxImage.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.src}
                  download={lightboxImage.name}
                  className="rounded p-1 hover:bg-white/10 text-white"
                  title="Download image"
                >
                  <Download className="size-4.5" />
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 rounded-full text-white hover:bg-white/10"
                  onClick={() => setLightboxImage(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex max-h-[80vh] items-center justify-center p-4">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* EDIT MESSAGE DIALOG */}
      {editingMessage ? (
        <Dialog open onOpenChange={(open) => !open && setEditingMessage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit message</DialogTitle>
              <DialogDescription>Update message content.</DialogDescription>
            </DialogHeader>
            <Textarea
              value={editBody}
              onChange={(event) => setEditBody(event.target.value)}
              aria-label="Edit message"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingMessage(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveMessageEdit()}>
                Save changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* DELETE CHANNEL CONFIRMATION */}
      <Dialog
        open={deletingChannel !== null}
        onOpenChange={(open) => !open && setDeletingChannel(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete channel permanently?</DialogTitle>
            <DialogDescription>
              “{deletingChannel?.name}” will be removed. Channels holding messages cannot be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletingChannel(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deletingChannel && void deleteChannel(deletingChannel)}
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MESSAGE CONFIRMATION */}
      <Dialog
        open={deletingMessage !== null}
        onOpenChange={(open) => !open && setDeletingMessage(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete message permanently?</DialogTitle>
            <DialogDescription>
              This message will be removed and cannot be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletingMessage(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deletingMessage && void deleteMessage(deletingMessage)}
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  async function suspendChannel(channel: ChatChannel) {
    try {
      const updated = await chat.suspendChannel.mutateAsync(channel.uuid);
      setSelected(updated);
      toast.success("Channel suspended");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function restoreChannel(channel: ChatChannel) {
    try {
      const updated = await chat.restoreChannel.mutateAsync(channel.uuid);
      setSelected(updated);
      toast.success("Channel restored");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteChannel(channel: ChatChannel) {
    try {
      await chat.forceDeleteChannel.mutateAsync(channel.uuid);
      setDeletingChannel(null);
      setSelected((current) => (current?.uuid === channel.uuid ? null : current));
      toast.success("Channel deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function suspendMessage(message: ChatMessage) {
    try {
      await chat.suspendMessage.mutateAsync(message.uuid);
      toast.success("Message suspended");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function restoreMessage(message: ChatMessage) {
    try {
      await chat.restoreMessage.mutateAsync(message.uuid);
      toast.success("Message restored");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteMessage(message: ChatMessage) {
    try {
      await chat.forceDeleteMessage.mutateAsync(message.uuid);
      setDeletingMessage(null);
      toast.success("Message deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function removeMember(memberUuid: string) {
    if (!selected) return;
    try {
      await members.removeMember.mutateAsync({ channelUuid: selected.uuid, memberUuid });
      toast.success("Member removed");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
}

function ShadcnThreadMessages({
  currentUserEmail,
  kind,
  messageRefs,
  messages,
  onDelete,
  onEdit,
  onImageClick,
  onReply,
  onRestore,
  onSuspend
}: {
  currentUserEmail: string;
  kind: ChatChannel["kind"];
  messageRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  messages: ChatMessage[];
  onDelete: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onImageClick: (src: string, name: string) => void;
  onReply: (message: ChatMessage) => void;
  onRestore: (message: ChatMessage) => void;
  onSuspend: (message: ChatMessage) => void;
}) {
  let lastDay = "";

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const day = dayLabel(message.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;
        const own =
          currentUserEmail.length > 0 && message.senderEmail.toLowerCase() === currentUserEmail;
        const showSender = !own && kind !== "dm";

        return (
          <div key={message.uuid} className="space-y-1">
            {showDay ? (
              <div className="flex justify-center py-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {day}
                </span>
              </div>
            ) : null}

            <div className={cn("flex flex-col", own ? "items-end" : "items-start")}>
              {showSender ? (
                <span
                  className={cn("text-xs font-semibold mb-1 ml-1", senderTone(message.senderEmail))}
                >
                  {message.senderEmail.split("@")[0]}
                </span>
              ) : null}

              {/* Message Box or Cards */}
              <div
                ref={(element) => {
                  if (element) messageRefs.current.set(message.uuid, element);
                  else messageRefs.current.delete(message.uuid);
                }}
                className={cn("group relative max-w-[85%] sm:max-w-[70%]")}
              >
                {/* Quoted message if replied */}
                {message.reply ? (
                  <div
                    className={cn(
                      "mb-1.5 rounded-lg border-l-2 p-2 text-xs",
                      own
                        ? "border-primary bg-primary/10 text-primary-foreground dark:text-foreground"
                        : "border-primary bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="font-semibold block">
                      {message.reply.senderEmail.split("@")[0]}
                    </span>
                    <span className="truncate block">
                      {message.reply.body || "File attachment"}
                    </span>
                  </div>
                ) : null}

                {/* Attachments */}
                {message.attachments.map((attachment) => {
                  const isImage = attachment.mimeType.startsWith("image/");
                  const isAudio = attachment.mimeType.startsWith("audio/");
                  const isVideo = attachment.mimeType.startsWith("video/");

                  if (isImage) {
                    return (
                      <div
                        key={attachment.uuid}
                        className="mb-1.5 overflow-hidden rounded-2xl border shadow-2xs cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() =>
                          onImageClick(
                            `data:${attachment.mimeType};base64,${attachment.contentBase64}`,
                            attachment.fileName
                          )
                        }
                      >
                        <img
                          src={`data:${attachment.mimeType};base64,${attachment.contentBase64}`}
                          alt={attachment.fileName}
                          className="max-h-72 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    );
                  }

                  if (isVideo) {
                    return (
                      <div
                        key={attachment.uuid}
                        className="relative mb-1.5 overflow-hidden rounded-2xl border bg-black shadow-2xs max-w-sm"
                      >
                        <div className="flex h-48 items-center justify-center bg-black/80">
                          <div className="flex size-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs text-white">
                            <Play className="size-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                          Video
                        </span>
                      </div>
                    );
                  }

                  if (isAudio) {
                    return (
                      <div
                        key={attachment.uuid}
                        className="mb-1.5 flex w-80 max-w-full items-center gap-3 rounded-2xl border bg-muted/30 px-3.5 py-2.5 shadow-2xs"
                      >
                        <button
                          type="button"
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <Play className="size-3.5 fill-current ml-0.5" />
                        </button>
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                          0:00 / 0:00
                        </span>
                        <div className="relative h-1 flex-1 rounded-full bg-muted-foreground/20">
                          <div className="absolute top-1/2 left-1/3 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
                        </div>
                        <Volume2 className="size-4 shrink-0 text-muted-foreground" />
                      </div>
                    );
                  }

                  // Default Document Card (matches Image 2: Download & Preview buttons)
                  return (
                    <div
                      key={attachment.uuid}
                      className="mb-1.5 flex max-w-sm flex-col gap-3 rounded-2xl border bg-muted/30 p-3.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground leading-tight">
                            {attachment.fileName}
                          </span>
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {formatBytes(attachment.sizeBytes)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs rounded-lg flex-1"
                          asChild
                        >
                          <a
                            href={`data:${attachment.mimeType};base64,${attachment.contentBase64}`}
                            download={attachment.fileName}
                          >
                            <Download className="mr-1.5 size-3" />
                            Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs rounded-lg flex-1"
                          onClick={() => {
                            if (attachment.mimeType.startsWith("image/")) {
                              onImageClick(
                                `data:${attachment.mimeType};base64,${attachment.contentBase64}`,
                                attachment.fileName
                              );
                            } else {
                              toast.info(`Previewing ${attachment.fileName}`);
                            }
                          }}
                        >
                          <Eye className="mr-1.5 size-3" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Text Bubble (Incoming: bg-muted/70; Outgoing: bg-primary) */}
                {message.body ? (
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs",
                      own
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted/70 text-foreground"
                    )}
                  >
                    {renderMessageBody(message.body)}
                  </div>
                ) : null}

                {/* Hover Action Menu */}
                <div
                  className={cn(
                    "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    own ? "-left-8" : "-right-8"
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={own ? "end" : "start"} className="w-36">
                      <DropdownMenuItem onClick={() => onReply(message)}>
                        <Reply className="mr-2 size-3.5" />
                        Reply
                      </DropdownMenuItem>
                      {own ? (
                        <DropdownMenuItem onClick={() => onEdit(message)}>
                          <Pencil className="mr-2 size-3.5" />
                          Edit
                        </DropdownMenuItem>
                      ) : null}
                      {message.status === "active" ? (
                        <DropdownMenuItem onClick={() => onSuspend(message)}>
                          <Archive className="mr-2 size-3.5" />
                          Archive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onRestore(message)}>
                          <ArchiveRestore className="mr-2 size-3.5" />
                          Restore
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(message)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-3.5 text-destructive" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Timestamp & Status below bubble */}
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] text-muted-foreground select-none mt-1 px-1",
                  own ? "justify-end" : "justify-start"
                )}
              >
                <span>{bubbleTime(message.createdAt)}</span>
                {own ? (
                  <span title="Delivered">
                    <CheckCheck className="size-3.5 text-emerald-500" />
                  </span>
                ) : null}
                {message.editedAt ? <span className="italic text-[10px]">edited</span> : null}
                {message.status === "inactive" ? (
                  <span className="text-[10px] text-amber-600 font-medium">suspended</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderMessageBody(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80 break-all"
          onClick={(event) => event.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function readFavourites(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) return new Set(parsed.filter((entry) => typeof entry === "string"));
  } catch {
    // favourites stay session-local when storage is unavailable.
  }
  return new Set();
}

async function readFileBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
  return dataUrl.includes(",") ? (dataUrl.split(",").at(-1) ?? "") : dataUrl;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Chat request failed.";
}
