import { useEffect, useState, type KeyboardEvent } from 'react'
import { Archive, ArchiveRestore, Check, MessageCircle, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import type { ChatConversationListScope, ChatConversationSummary } from '@codexsun/zetro-contracts'

type ConversationRegistryProps = {
  busy: boolean
  conversations: ChatConversationSummary[]
  query: string
  scope: ChatConversationListScope
  selectedId?: string
  workingIds: ReadonlySet<string>
  onArchive: (conversationId: string) => void
  onCreate: () => void
  onRename: (conversationId: string, title: string) => void
  onRestore: (conversationId: string) => void
  onSelect: (conversationId: string) => void
}

export function ConversationRegistry({
  busy,
  conversations,
  query,
  scope,
  selectedId,
  workingIds,
  onArchive,
  onCreate,
  onRename,
  onRestore,
  onSelect,
}: ConversationRegistryProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = conversations.filter((conversation) => {
    const inScope = scope === 'all' || (scope === 'archived') === Boolean(conversation.archivedAt)
    return (
      inScope &&
      (!normalizedQuery || conversation.title.toLocaleLowerCase().includes(normalizedQuery))
    )
  })

  return (
    <div className="flex min-h-full flex-col gap-2 p-3">
      <Button
        className="w-full justify-start"
        disabled={busy}
        onClick={onCreate}
        variant="secondary"
      >
        <Plus />
        New conversation
      </Button>
      <div className="flex items-center justify-between px-2 pt-2 text-sm font-medium">
        <span>{scope === 'archived' ? 'Archived conversations' : 'Conversations'}</span>
        <span className="text-xs font-normal text-muted-foreground">{visible.length}</span>
      </div>
      <div aria-label="Conversation history" className="grid gap-1">
        {visible.map((conversation) => (
          <ConversationRow
            conversation={conversation}
            key={conversation.id}
            selected={conversation.id === selectedId}
            working={workingIds.has(conversation.id)}
            onArchive={onArchive}
            onRename={onRename}
            onRestore={onRestore}
            onSelect={onSelect}
          />
        ))}
        {!busy && visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            {normalizedQuery ? 'No matching conversations.' : 'No conversations here.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ConversationRow({
  conversation,
  selected,
  working,
  onArchive,
  onRename,
  onRestore,
  onSelect,
}: {
  conversation: ChatConversationSummary
  selected: boolean
  working: boolean
  onArchive: (conversationId: string) => void
  onRename: (conversationId: string, title: string) => void
  onRestore: (conversationId: string) => void
  onSelect: (conversationId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(conversation.title)

  useEffect(() => {
    if (!editing) setTitle(conversation.title)
  }, [conversation.title, editing])

  function saveTitle() {
    const nextTitle = title.trim()
    if (nextTitle && nextTitle !== conversation.title) onRename(conversation.id, nextTitle)
    else setTitle(conversation.title)
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') saveTitle()
    if (event.key === 'Escape') {
      setTitle(conversation.title)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="flex h-12 items-center gap-1 rounded-lg bg-sidebar-accent px-2">
        <Input
          aria-label="Conversation title"
          autoFocus
          className="h-8 min-w-0 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button aria-label="Save title" onClick={saveTitle} size="icon-xs" variant="ghost">
          <Check />
        </Button>
        <Button
          aria-label="Cancel rename"
          onClick={() => {
            setTitle(conversation.title)
            setEditing(false)
          }}
          size="icon-xs"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={
        selected
          ? 'group flex min-w-0 items-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground'
          : 'group flex min-w-0 items-center rounded-lg hover:bg-sidebar-accent/70'
      }
    >
      <Button
        className="h-12 min-w-0 flex-1 cursor-pointer justify-start gap-2 px-2 text-left hover:bg-transparent"
        onClick={() => onSelect(conversation.id)}
        variant="ghost"
      >
        <span className="relative shrink-0">
          <MessageCircle className="size-4 text-muted-foreground" />
          {working ? (
            <span
              aria-label="Response working"
              className="absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-primary"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{conversation.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {conversation.turnCount} {conversation.turnCount === 1 ? 'turn' : 'turns'} ·{' '}
            {formatUpdatedAt(conversation.updatedAt)}
          </span>
        </span>
      </Button>
      <div className="flex shrink-0 pr-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {!conversation.archivedAt ? (
          <Button
            aria-label={`Rename ${conversation.title}`}
            onClick={() => setEditing(true)}
            size="icon-xs"
            variant="ghost"
          >
            <Pencil />
          </Button>
        ) : null}
        <Button
          aria-label={
            conversation.archivedAt
              ? `Restore ${conversation.title}`
              : `Archive ${conversation.title}`
          }
          onClick={() =>
            conversation.archivedAt ? onRestore(conversation.id) : onArchive(conversation.id)
          }
          size="icon-xs"
          variant="ghost"
        >
          {conversation.archivedAt ? <ArchiveRestore /> : <Archive />}
        </Button>
      </div>
    </div>
  )
}

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(timestamp)
}
