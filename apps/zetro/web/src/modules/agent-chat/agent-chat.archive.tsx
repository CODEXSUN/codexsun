import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ArrowLeft, Search, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@codexsun/ui/components/alert-dialog'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useAgentChat } from './agent-chat.controller'
import type { ChatConversationSummary } from './agent-chat.types'

type DeleteTarget = ChatConversationSummary | 'all' | null

export function AgentChatArchive() {
  const chat = useAgentChat()
  const topology = useMdiTopology()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [query, setQuery] = useState('')
  const conversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return chat.archivedSummaries
    return chat.archivedSummaries.filter(({ title }) =>
      title.toLowerCase().includes(normalizedQuery),
    )
  }, [chat.archivedSummaries, query])

  async function confirmDelete() {
    if (deleteTarget === 'all') await chat.deleteAllArchived()
    else if (deleteTarget) await chat.deleteArchivedConversation(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <TopologyRegion
      aria-label="Archived chats"
      as="section"
      className="size-full overflow-y-auto bg-background"
      id="15.1.3"
      topology={topology}
    >
      <div className="mx-auto flex min-h-full w-4/5 flex-col gap-6 py-10">
        <header className="flex flex-wrap items-center gap-3">
          <Button aria-label="Back to chat" onClick={chat.showChat} size="icon" variant="ghost">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Archived chats</h1>
            <p className="text-sm text-muted-foreground">
              Restore a chat or delete it permanently.
            </p>
          </div>
          {chat.archivedSummaries.length ? (
            <Button
              className="ml-auto"
              disabled={chat.isBusy}
              onClick={() => setDeleteTarget('all')}
              variant="destructive"
            >
              <Trash2 />
              Delete all
            </Button>
          ) : null}
        </header>

        <label className="relative block max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search archived chats"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search archived chats"
            value={query}
          />
        </label>

        <div className="overflow-hidden rounded-xl border bg-card">
          {chat.isLoadingArchive ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading archive…</p>
          ) : conversations.length ? (
            conversations.map((conversation) => (
              <ArchiveRow
                conversation={conversation}
                key={conversation.id}
                onDelete={() => setDeleteTarget(conversation)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <span className="rounded-full bg-muted p-3 text-muted-foreground">
                <Archive className="size-5" />
              </span>
              <strong className="text-sm">No archived chats</strong>
              <p className="text-sm text-muted-foreground">
                Chats archived from History will appear here.
              </p>
            </div>
          )}
        </div>

        {chat.error ? (
          <p className="text-sm text-destructive" role="alert">
            {chat.error}
          </p>
        ) : null}
      </div>

      <DeleteArchiveDialog
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        target={deleteTarget}
      />
    </TopologyRegion>
  )
}

function ArchiveRow({
  conversation,
  onDelete,
}: {
  conversation: ChatConversationSummary
  onDelete(): void
}) {
  const chat = useAgentChat()

  return (
    <article className="group/archive-row flex min-h-16 items-center gap-3 border-b px-4 last:border-b-0 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-medium">{conversation.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Archived {formatArchiveDate(conversation.archivedAt ?? conversation.updatedAt)}
        </p>
      </div>
      <Button
        aria-label={`Delete ${conversation.title} permanently`}
        className="opacity-0 transition-opacity group-focus-within/archive-row:opacity-100 group-hover/archive-row:opacity-100"
        disabled={chat.isBusy}
        onClick={onDelete}
        size="icon-sm"
        title="Delete permanently"
        variant="ghost"
      >
        <Trash2 className="text-destructive" />
      </Button>
      <Button
        disabled={chat.isBusy}
        onClick={() => void chat.restoreConversation(conversation)}
        variant="secondary"
      >
        <ArchiveRestore />
        Unarchive
      </Button>
    </article>
  )
}

function DeleteArchiveDialog({
  onConfirm,
  onOpenChange,
  target,
}: {
  onConfirm(): void
  onOpenChange(open: boolean): void
  target: DeleteTarget
}) {
  const deleteAll = target === 'all'
  return (
    <AlertDialog onOpenChange={onOpenChange} open={target !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteAll ? 'Delete every archived chat?' : 'Delete this chat permanently?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes the saved conversation and cannot be undone. Its isolated worktree is
            preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function formatArchiveDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
