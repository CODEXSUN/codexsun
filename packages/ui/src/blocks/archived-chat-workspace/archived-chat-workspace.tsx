import { ArchiveRestoreIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";
import { Input } from "../../components/input";

export type ArchivedChatItem = { createdAt: string; id: string; messageCount: number; title: string };

export type ArchivedChatWorkspaceProps = {
  chats: readonly ArchivedChatItem[];
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onOpen: (id: string) => void;
  onRestore: (id: string) => void;
};

export function ArchivedChatWorkspace({ chats, onDelete, onDeleteAll, onOpen, onRestore }: ArchivedChatWorkspaceProps) {
  const [query, setQuery] = useState("");
  const filteredChats = useMemo(() => chats.filter((chat) => chat.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [chats, query]);

  return <section className="flex size-full min-h-0 flex-col bg-background">
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">Archived chats</h1><p className="text-xs text-muted-foreground">Archived handovers remain available until permanently deleted.</p></div><Button disabled={!chats.length} size="sm" variant="destructive" onClick={onDeleteAll}><Trash2Icon /> Delete all</Button></header>
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto flex w-full max-w-4xl flex-col gap-5"><div className="relative max-w-xl"><SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search archived chats" className="pl-9" placeholder="Search archived chats" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Card size="sm"><CardHeader><CardTitle>{filteredChats.length} archived {filteredChats.length === 1 ? "chat" : "chats"}</CardTitle><CardDescription>Restore a conversation to active history, or force delete it permanently.</CardDescription></CardHeader><CardContent className="divide-y">{filteredChats.length ? filteredChats.map((chat) => <article key={chat.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"><button className="min-w-0 flex-1 text-left" onClick={() => onOpen(chat.id)}><p className="truncate text-sm font-medium">{chat.title}</p><p className="text-xs text-muted-foreground">{formatDate(chat.createdAt)} · {chat.messageCount} messages</p></button><Button aria-label={`Permanently delete ${chat.title}`} size="icon-sm" variant="ghost" onClick={() => onDelete(chat.id)}><Trash2Icon /></Button><Button size="sm" variant="outline" onClick={() => onRestore(chat.id)}><ArchiveRestoreIcon /> Unarchive</Button></article>) : <p className="py-8 text-center text-sm text-muted-foreground">No archived chats match this search.</p>}</CardContent></Card></div></main>
  </section>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
