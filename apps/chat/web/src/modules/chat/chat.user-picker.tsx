import { useMemo, useState } from "react";
import { MessageCircle, Search, User, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { cn } from "@codexsun/ui/lib/utils";
import { useChatUsers } from "./chat.hooks";
import { avatarTone, initials } from "./chat.list";
import type { ChatUserOption } from "./chat.types";

export function ChatUserPickerModal({
  currentUserEmail = "",
  busy = false,
  onOpenChange,
  onSelectUser,
  open
}: {
  currentUserEmail?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: ChatUserOption) => Promise<void>;
  open: boolean;
}) {
  const [search, setSearch] = useState("");
  const usersQuery = useChatUsers();
  const selfEmail = currentUserEmail.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return list
      .filter((user) => {
        if (!term) return true;
        return (
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const aIsSelf = a.email.toLowerCase() === selfEmail;
        const bIsSelf = b.email.toLowerCase() === selfEmail;
        if (aIsSelf !== bIsSelf) return aIsSelf ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
  }, [usersQuery.data, search, selfEmail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            New chat
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Select a team member to start a one-on-one conversation.
          </DialogDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name or email..."
              aria-label="Search users"
              className="h-9 rounded-lg bg-muted/40 pl-9 text-sm"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-80 min-h-48 overflow-y-auto p-2 divide-y divide-border/40">
          {usersQuery.isPending ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
              Loading users…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <User className="size-8 text-muted-foreground/50 mb-2" />
              <p className="font-medium text-foreground">No users found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search.trim() ? "Try a different search term." : "No team members are available."}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.email.toLowerCase() === selfEmail;
              return (
                <button
                  key={user.email}
                  type="button"
                  disabled={busy || isSelf}
                  onClick={() => void onSelectUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                    isSelf
                      ? "opacity-60 cursor-not-allowed bg-muted/20"
                      : "hover:bg-muted/60 active:bg-muted cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-2xs",
                      avatarTone(user.name)
                    )}
                  >
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-foreground truncate">
                        {user.name}
                      </span>
                      {isSelf && (
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  {!isSelf && (
                    <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
