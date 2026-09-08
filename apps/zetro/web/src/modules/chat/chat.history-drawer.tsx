import { useState, type KeyboardEvent } from 'react'
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  X,
} from 'lucide-react'
import type { ChatConversationSummary } from './chat.types'
import { TopologyMarker, TopologyRegion } from '@codexsun/ui/features/interface-topology'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'

interface HistoryDrawerProps {
  activeId: string | null
  collapsed: boolean
  disabled: boolean
  error: string | null
  isLoading: boolean
  isOpen: boolean
  onClose(): void
  onNew(): void
  onOpen(conversationId: string): void
  onPin(summary: ChatConversationSummary): void
  onRename(conversationId: string, title: string): void
  onToggle(): void
  summaries: readonly ChatConversationSummary[]
}

export function HistoryDrawer(props: HistoryDrawerProps) {
  const topology = useMdiTopology()
  const pinned = props.summaries.filter((conversation) => conversation.pinned)
  const recent = props.summaries.filter((conversation) => !conversation.pinned)

  return (
    <aside
      className={`history-drawer ${props.isOpen ? 'is-open' : ''} ${props.collapsed ? 'is-collapsed' : ''}`}
      aria-label="Chat history"
      {...topology.regionProps('11.1')}
    >
      <TopologyMarker id="11.1" topology={topology} />
      <header>
        <strong>History</strong>
        <TopologyRegion as="div" id="11.1.1" topology={topology}>
          <button
            aria-label={props.collapsed ? 'Expand chat history' : 'Collapse chat history'}
            className="history-toggle"
            onClick={props.onToggle}
            title={props.collapsed ? 'Expand history' : 'Collapse history'}
            type="button"
          >
            {props.collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
        </TopologyRegion>
        <button
          aria-label="Close history"
          className="history-close"
          onClick={props.onClose}
          type="button"
        >
          <X />
        </button>
      </header>
      <TopologyRegion as="div" className="history-list" id="11.1.2" topology={topology}>
        {props.isLoading && <p className="history-state">Loading history…</p>}
        {!props.isLoading && props.summaries.length === 0 && (
          <p className="history-state">Your conversations will appear here.</p>
        )}
        {pinned.length > 0 && <HistoryGroup label="Pinned" conversations={pinned} {...props} />}
        {recent.length > 0 && <HistoryGroup label="Recent" conversations={recent} {...props} />}
      </TopologyRegion>
      {props.error && <p className="history-error">{props.error}</p>}
      <TopologyRegion as="div" id="11.1.3" topology={topology}>
        <button
          aria-label="New chat"
          className="new-chat-button"
          disabled={props.disabled}
          onClick={props.onNew}
          title="New chat"
          type="button"
        >
          <Plus /> <span>New chat</span>
        </button>
      </TopologyRegion>
    </aside>
  )
}

function HistoryGroup({
  activeId,
  conversations,
  disabled,
  label,
  onOpen,
  onPin,
  onRename,
}: HistoryDrawerProps & { conversations: readonly ChatConversationSummary[]; label: string }) {
  return (
    <section className="history-group">
      <h2>{label}</h2>
      {conversations.map((conversation) => (
        <HistoryRow
          active={activeId === conversation.id}
          conversation={conversation}
          disabled={disabled}
          key={conversation.id}
          onOpen={onOpen}
          onPin={onPin}
          onRename={onRename}
        />
      ))}
    </section>
  )
}

function HistoryRow({
  active,
  conversation,
  disabled,
  onOpen,
  onPin,
  onRename,
}: {
  active: boolean
  conversation: ChatConversationSummary
  disabled: boolean
  onOpen(conversationId: string): void
  onPin(summary: ChatConversationSummary): void
  onRename(conversationId: string, title: string): void
}) {
  const [draft, setDraft] = useState(conversation.title)
  const [isRenaming, setIsRenaming] = useState(false)

  function submitRename(): void {
    const title = draft.trim()
    if (title && title !== conversation.title) onRename(conversation.id, title)
    else setDraft(conversation.title)
    setIsRenaming(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') submitRename()
    if (event.key === 'Escape') {
      setDraft(conversation.title)
      setIsRenaming(false)
    }
  }

  return (
    <div className={`history-row ${active ? 'active' : ''}`}>
      <MessageSquare aria-hidden="true" />
      {isRenaming ? (
        <input
          aria-label={`Rename ${conversation.title}`}
          autoFocus
          disabled={disabled}
          maxLength={60}
          onBlur={submitRename}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          value={draft}
        />
      ) : (
        <button
          className="history-title"
          disabled={disabled}
          onClick={() => onOpen(conversation.id)}
          title={conversation.title}
          type="button"
        >
          {conversation.title}
        </button>
      )}
      <div className="history-actions">
        <button
          aria-label={`Rename ${conversation.title}`}
          disabled={disabled}
          onClick={() => setIsRenaming(true)}
          type="button"
        >
          <Pencil />
        </button>
        <button
          aria-label={`${conversation.pinned ? 'Unpin' : 'Pin'} ${conversation.title}`}
          disabled={disabled}
          onClick={() => onPin(conversation)}
          type="button"
        >
          {conversation.pinned ? <PinOff /> : <Pin />}
        </button>
      </div>
    </div>
  )
}
