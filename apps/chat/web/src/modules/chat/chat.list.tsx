import { formatDate } from "@codexsun/ui/workspace";
import {
  Archive,
  ArchiveRestore,
  Check,
  CheckCheck,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  Users
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@codexsun/ui/components/dropdown-menu";
import { cn } from "@codexsun/ui/lib/utils";
import type { ChatChannel } from "./chat.types";

const AVATAR_TONES = [
  "bg-emerald-600 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-teal-600 text-white",
  "bg-slate-700 text-white",
  "bg-cyan-600 text-white"
];

const SENDER_TEXT_TONES = [
  "text-emerald-600 dark:text-emerald-400",
  "text-blue-600 dark:text-blue-400",
  "text-violet-600 dark:text-violet-400",
  "text-amber-600 dark:text-amber-400",
  "text-rose-600 dark:text-rose-400",
  "text-teal-600 dark:text-teal-400",
  "text-indigo-600 dark:text-indigo-400"
];

export function avatarTone(name: string): string {
  let hash = 0;
  for (const character of name.toLowerCase()) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? "bg-slate-700 text-white";
}

export function senderTone(email: string): string {
  let hash = 0;
  for (const character of email.toLowerCase()) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return SENDER_TEXT_TONES[hash % SENDER_TEXT_TONES.length] ?? "text-primary";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function bubbleTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = String(hours % 12 || 12).padStart(2, "0");
  return `${hour12}:${minutes} ${ampm}`;
}

export function formatRelativeTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minutes`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (diffHours < 24) return `${diffHours} hours`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  if (diffDays === 1) return "1 day";
  if (diffDays < 30) return `${diffDays} days`;
  return formatDate(value);
}

export function dayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isSameDay) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Yesterday";

  return formatDate(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatChannelList({
  channels,
  currentUserEmail = "",
  favourites,
  loading,
  onDelete,
  onEdit,
  onRestore,
  onSelect,
  onSuspend,
  onToggleFavourite,
  selectedId
}: {
  channels: ChatChannel[];
  currentUserEmail?: string;
  favourites: Set<string>;
  loading: boolean;
  onDelete: (channel: ChatChannel) => void;
  onEdit: (channel: ChatChannel) => void;
  onRestore: (channel: ChatChannel) => void;
  onSelect: (channel: ChatChannel) => void;
  onSuspend: (channel: ChatChannel) => void;
  onToggleFavourite: (channel: ChatChannel) => void;
  selectedId: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="flex items-center gap-3 rounded-xl p-2.5" key={index}>
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="flex h-56 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No chats found</p>
        <p className="mt-1 text-xs">Start a new conversation with the + button above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {channels.map((channel) => {
        const isSelected = selectedId === channel.uuid;
        const unread = isSelected ? 0 : channel.unreadCount;
        const favourite = favourites.has(channel.uuid);
        const timeLabel = formatRelativeTime(channel.lastMessageAt ?? channel.updatedAt);
        const isSuspended = channel.status === "inactive";
        const isFromMe =
          currentUserEmail &&
          channel.lastMessagePreview &&
          channel.lastMessagePreview.startsWith("You:");

        return (
          <div
            key={channel.uuid}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(channel)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(channel);
            }}
            className={cn(
              "group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors select-none",
              isSelected
                ? "bg-muted/80 text-foreground font-medium"
                : "hover:bg-muted/40 text-foreground",
              isSuspended && "opacity-60"
            )}
          >
            {/* Avatar with Online Green Dot */}
            <div className="relative shrink-0">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-xs font-semibold shadow-2xs",
                  avatarTone(channel.name)
                )}
              >
                {channel.kind === "group" || channel.kind === "broadcast" ? (
                  <Users className="size-4.5" />
                ) : (
                  initials(channel.name)
                )}
              </span>
              {/* Online Green Indicator Dot (Shadcn UI Kit style) */}
              <span
                className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                title="Online"
              />
            </div>

            {/* Middle Column: Title & Preview */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold leading-tight text-foreground">
                  {channel.name}
                </span>
                {timeLabel ? (
                  <time className="shrink-0 text-[11px] font-normal text-muted-foreground">
                    {timeLabel}
                  </time>
                ) : null}
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 items-center text-xs leading-tight text-muted-foreground">
                  {isFromMe ? (
                    <CheckCheck className="mr-1 size-3.5 shrink-0 text-emerald-500" />
                  ) : channel.lastMessagePreview ? (
                    <Check className="mr-1 size-3.5 shrink-0 text-muted-foreground/70" />
                  ) : null}
                  <span className="truncate">
                    {channel.lastMessagePreview ??
                      (channel.kind === "dm" ? "Chat" : "Group conversation")}
                  </span>
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  {favourite ? <Star className="size-3.5 fill-amber-400 text-amber-400" /> : null}

                  {/* Unread Count Badge (Shadcn UI Kit green circle) */}
                  {unread > 0 ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white shadow-2xs">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}

                  {/* Options Menu on Hover */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        aria-label="Options"
                        onClick={(event) => event.stopPropagation()}
                        className="size-6 rounded-md p-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      >
                        <MoreVertical className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => event.stopPropagation()}
                      className="w-44"
                    >
                      <DropdownMenuItem onClick={() => onToggleFavourite(channel)}>
                        <Star className="mr-2 size-4 text-amber-400" />
                        {favourite ? "Remove favourite" : "Mark favourite"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(channel)}>
                        <Pencil className="mr-2 size-4" />
                        Rename chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {channel.status === "active" ? (
                        <DropdownMenuItem onClick={() => onSuspend(channel)}>
                          <Archive className="mr-2 size-4" />
                          Archive chat
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onRestore(channel)}>
                          <ArchiveRestore className="mr-2 size-4" />
                          Unarchive chat
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(channel)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4 text-destructive" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
