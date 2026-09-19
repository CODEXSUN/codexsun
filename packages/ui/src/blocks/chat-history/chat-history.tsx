import { ArchiveIcon, PencilIcon, PinIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { cn } from '../../lib/utils'

export type ChatHistoryItem = {
  id: string
  pinned?: boolean
  subtitle?: string
  title: string
}

export type ChatHistoryProps = {
  activeId?: string
  className?: string
  emptyLabel?: string
  items: readonly ChatHistoryItem[]
  onArchive?: (id: string) => void
  onCreate: () => void
  onDelete?: (id: string) => void
  onPin?: (id: string) => void
  onRename?: (id: string) => void
  onSelect: (id: string) => void
}

export function ChatHistory({ activeId, className, emptyLabel = 'No conversations yet', items, onArchive, onCreate, onDelete, onPin, onRename, onSelect }: ChatHistoryProps) {
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(() => items.filter((item) => item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, query])

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3 px-3 py-4', className)}>
      <div className="flex justify-center py-1"><Button size="sm" onClick={onCreate}><PlusIcon />New conversation</Button></div>
      <div className="relative">
        <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search conversation history" className="pl-8" placeholder="Search history" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {filteredItems.map((item) => (
            <div key={item.id} className="group/history-item flex items-center gap-1">
              <Button className="min-w-0 flex-1 justify-start truncate" size="sm" variant={item.id === activeId ? 'secondary' : 'ghost'} onClick={() => onSelect(item.id)}>{item.pinned ? <PinIcon className="size-3" /> : null}{item.title}</Button>
              {onRename || onPin || onArchive || onDelete ? (
                <div className="invisible flex shrink-0 items-center opacity-0 transition-opacity group-hover/history-item:visible group-hover/history-item:opacity-100">
                  {onRename ? <Button aria-label={`Rename ${item.title}`} size="icon-xs" variant="ghost" onClick={() => onRename(item.id)}><PencilIcon /></Button> : null}
                  {onPin ? <Button aria-label={`${item.pinned ? 'Unpin' : 'Pin'} ${item.title}`} size="icon-xs" variant="ghost" onClick={() => onPin(item.id)}><PinIcon /></Button> : null}
                  {onArchive ? <Button aria-label={`Archive ${item.title}`} size="icon-xs" variant="ghost" onClick={() => onArchive(item.id)}><ArchiveIcon /></Button> : null}
                  {onDelete ? <Button aria-label={`Delete ${item.title}`} size="icon-xs" variant="ghost" onClick={() => onDelete(item.id)}><Trash2Icon /></Button> : null}
                </div>
              ) : null}
            </div>
          ))}
          {!filteredItems.length ? <p className="px-2 py-4 text-center text-xs text-muted-foreground">{emptyLabel}</p> : null}
        </div>
      </div>
    </div>
  )
}
