import { useEffect, useState } from "react";
import { Megaphone, MessageSquare, User, Users } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { cn } from "@codexsun/ui/lib/utils";
import { chatChannelRenameSchema, chatChannelSchema } from "./chat.schema";
import type { ChatChannel, ChatChannelKind, ChatChannelSavePayload } from "./chat.types";

const KIND_OPTIONS: {
  description: string;
  icon: typeof MessageSquare;
  kind: ChatChannelKind;
  label: string;
}[] = [
  {
    description: "One-on-one conversation with a team member",
    icon: User,
    kind: "dm",
    label: "Direct Chat"
  },
  {
    description: "Collaborative group for a team or project",
    icon: Users,
    kind: "group",
    label: "Group"
  },
  {
    description: "Open team topic or department channel",
    icon: MessageSquare,
    kind: "channel",
    label: "Channel"
  },
  {
    description: "Admin announcement broadcast to all recipients",
    icon: Megaphone,
    kind: "broadcast",
    label: "Broadcast"
  }
];

export function ChatChannelForm({
  busy,
  channel,
  defaultKind = "channel",
  onOpenChange,
  onSubmit,
  open
}: {
  busy: boolean;
  channel: ChatChannel | null;
  defaultKind?: ChatChannelKind | undefined;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ChatChannelSavePayload) => Promise<void>;
  open: boolean;
}) {
  const [name, setName] = useState(channel?.name ?? "");
  const [kind, setKind] = useState<ChatChannelKind>(channel?.kind ?? defaultKind);
  const [members, setMembers] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(channel?.name ?? "");
    setKind(channel?.kind ?? defaultKind);
    setMembers("");
    setError("");
  }, [channel, defaultKind, open]);

  async function submit() {
    if (channel) {
      const parsed = chatChannelRenameSchema.safeParse({ name });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Check the channel fields.");
        return;
      }
      setError("");
      await onSubmit({ kind: channel.kind, name: parsed.data.name });
      return;
    }
    const parsed = chatChannelSchema.safeParse({
      kind,
      members: memberEmails(members),
      name
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the channel fields.");
      return;
    }
    if (kind === "dm" && parsed.data.members.length !== 1) {
      setError("Direct chats need exactly one participant email.");
      return;
    }
    setError("");
    await onSubmit(parsed.data);
    setName("");
    setKind("channel");
    setMembers("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 bg-[#f0f2f5] dark:bg-[#202c33]">
          <DialogTitle className="text-lg font-semibold text-[#111b21] dark:text-[#e9edef]">
            {channel ? "Rename chat" : "New chat"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#667781] dark:text-[#8696a0]">
            {channel
              ? "Update the chat name."
              : "Start a direct chat, group, channel, or broadcast list."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto p-5">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {/* Type Selector (if creating new) */}
          {channel ? null : (
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Chat Type
              </span>
              <div className="grid grid-cols-2 gap-2">
                {KIND_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = kind === option.kind;
                  return (
                    <button
                      key={option.kind}
                      type="button"
                      onClick={() => setKind(option.kind)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-[#00a884] bg-emerald-50/60 text-[#008069] ring-1 ring-[#00a884] dark:bg-emerald-950/30 dark:text-[#00a884]"
                          : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-lg text-white shadow-2xs",
                            isSelected ? "bg-[#00a884]" : "bg-muted-foreground/60"
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="text-xs font-semibold">{option.label}</span>
                      </div>
                      <span className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name Input */}
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>
              {channel ? "Chat Name" : kind === "dm" ? "Chat Title" : "Group / Channel Name"}{" "}
              <span className="text-red-600">*</span>
            </span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                kind === "dm"
                  ? "e.g. Chat with Alex"
                  : kind === "group"
                    ? "e.g. TM Online"
                    : "e.g. Product Announcements"
              }
              aria-label="Name"
              className="h-10 text-sm"
            />
          </label>

          {/* Participants Input */}
          {channel ? null : (
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>
                {kind === "dm" ? "Participant Email" : "Participants"}{" "}
                <span className="text-red-600">*</span>{" "}
                <span className="font-normal normal-case text-muted-foreground/80">
                  {kind === "dm" ? "(single email)" : "(comma separated)"}
                </span>
              </span>
              <Textarea
                value={members}
                onChange={(event) => setMembers(event.target.value)}
                placeholder={
                  kind === "dm"
                    ? "vijay@techmedia.in"
                    : "ashokkumar@techmedia.in, vijay@techmedia.in"
                }
                aria-label="Participants"
                rows={2}
                className="text-sm resize-none"
              />
            </label>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="bg-[#00a884] text-white hover:bg-[#029072]"
            >
              {busy ? "Saving…" : channel ? "Save changes" : "Create chat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function memberEmails(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
