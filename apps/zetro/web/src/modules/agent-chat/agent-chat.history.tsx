import { useState, type KeyboardEvent } from 'react'
import {
  Archive,
  Check,
  ChevronRight,
  EllipsisVertical,
  FolderKanban,
  LoaderCircle,
  Pencil,
  Pin,
  PinOff,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@codexsun/ui/components/collapsible'
import { Input } from '@codexsun/ui/components/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { useAgentChat } from './agent-chat.controller'
import type { ChatConversationSummary } from './agent-chat.types'

export function AgentChatHistory() {
  const chat = useAgentChat()
  const topology = useMdiTopology()
  const pinned = chat.summaries.filter(({ pinned: isPinned }) => isPinned)
  const unpinned = chat.summaries.filter(({ pinned: isPinned }) => !isPinned)

  return (
    <div className="flex size-full min-h-0 flex-col">
      <TopologyRegion
        aria-label="Conversation history"
        as="div"
        className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1 [&>[data-ito-marker]]:top-1"
        id="15.2.1"
        topology={topology}
      >
        {chat.isLoadingHistory ? (
          <div className="flex h-7 items-center justify-end px-1.5">
            <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {!chat.isLoadingHistory && chat.summaries.length === 0 ? (
          <p className="px-1.5 py-2 text-sm text-muted-foreground">No conversations yet.</p>
        ) : null}
        {pinned.length ? <HistoryGroup conversations={pinned} label="Pinned" /> : null}
        {unpinned.map((conversation) => (
          <HistoryRow conversation={conversation} key={conversation.id} />
        ))}
      </TopologyRegion>

      {chat.error ? (
        <p className="border-t px-3 py-2 text-xs text-destructive" role="alert">
          {chat.error}
        </p>
      ) : null}
      <div className="shrink-0 border-t p-2">
        <TopologyRegion as="div" id="15.2.2" topology={topology}>
          <Button
            className="mb-1 h-8 w-full justify-start bg-black text-white hover:bg-black/90 hover:text-white"
            disabled={chat.isBusy}
            onClick={chat.newConversation}
          >
            <Plus />
            New chat
          </Button>
        </TopologyRegion>
        <TopologyRegion as="div" id="15.2.3" topology={topology}>
          <Button
            className="h-8 w-full justify-start"
            disabled={chat.isBusy}
            onClick={() => void chat.openArchive()}
            variant="ghost"
          >
            <Archive />
            Archived chats
          </Button>
        </TopologyRegion>
      </div>
    </div>
  )
}

function HistoryGroup({
  conversations,
  label,
}: {
  conversations: ChatConversationSummary[]
  label: string
}) {
  return (
    <Collapsible className="group/history" defaultOpen>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
        <ChevronRight className="size-3.5 transition-transform group-data-open/history:rotate-90" />
        {label}
        <span className="ml-auto font-normal">{conversations.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5">
        {conversations.map((conversation) => (
          <HistoryRow conversation={conversation} key={conversation.id} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function HistoryRow({ conversation }: { conversation: ChatConversationSummary }) {
  const chat = useAgentChat()
  const [draft, setDraft] = useState(conversation.title)
  const [renaming, setRenaming] = useState(false)

  function finishRename() {
    const title = draft.trim()
    if (title && title !== conversation.title) void chat.renameConversation(conversation.id, title)
    if (!title) setDraft(conversation.title)
    setRenaming(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') finishRename()
    if (event.key === 'Escape') {
      setDraft(conversation.title)
      setRenaming(false)
    }
  }

  return (
    <div
      className="group/row flex min-h-8 items-center gap-1 rounded-md px-1 data-[active=true]:bg-sidebar-accent"
      data-active={chat.activeId === conversation.id}
    >
      {renaming ? (
        <>
          <Input
            aria-label={`Rename ${conversation.title}`}
            autoFocus
            className="h-7 min-w-0 flex-1"
            maxLength={60}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            value={draft}
          />
          <Button aria-label="Save title" onClick={finishRename} size="icon-xs" variant="ghost">
            <Check />
          </Button>
          <Button
            aria-label="Cancel rename"
            onClick={() => {
              setDraft(conversation.title)
              setRenaming(false)
            }}
            size="icon-xs"
            variant="ghost"
          >
            <X />
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            className="min-w-0 flex-1 truncate px-1 text-left text-sm"
            disabled={chat.isBusy}
            onClick={() => void chat.openConversation(conversation.id)}
            title={conversation.title}
            type="button"
          >
            {conversation.title}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Chat actions for ${conversation.title}`}
                  className="shrink-0 cursor-pointer opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100"
                  disabled={chat.isBusy}
                  size="icon-xs"
                  variant="ghost"
                />
              }
            >
              <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => void chat.openScope(conversation.id)}>
                <FolderKanban /> Connected folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenaming(true)}>
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void chat.togglePin(conversation)}>
                {conversation.pinned ? <PinOff /> : <Pin />}
                {conversation.pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void chat.archiveConversation(conversation)}
                variant="destructive"
              >
                <Archive /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
