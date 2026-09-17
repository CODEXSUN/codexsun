import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { cn } from '../../lib/utils'
import { KanbanCard } from './kanban-card'
import type { KanbanCardItem, KanbanColumnItem } from './kanban-types'

export interface KanbanColumnProps {
  cards: readonly KanbanCardItem[]
  column: KanbanColumnItem
  emptyMessage?: string
  onAddCard?: (columnId: string) => void
  onCardClick?: (card: KanbanCardItem) => void
  renderCardFooter?: (card: KanbanCardItem) => ReactNode
  showAddCard?: boolean
}

export function KanbanColumn({
  cards,
  column,
  emptyMessage = 'No cards in this column',
  onAddCard,
  onCardClick,
  renderCardFooter,
  showAddCard = true,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    data: { column, type: 'Column' },
    id: column.id,
  })

  const cardIds = cards.map((c) => c.id)
  const isOverLimit = column.limit && cards.length > column.limit

  return (
    <div
      className={cn(
        'flex w-80 shrink-0 flex-col rounded-2xl border border-border/70 bg-muted/30 p-3 shadow-2xs transition-colors',
        isOver && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1.5 pt-1">
        <div className="flex items-center gap-2">
          {column.accentColor && (
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: column.accentColor }}
            />
          )}
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{column.title}</h3>
          <Badge
            className={cn(
              'h-5 px-1.5 text-[11px] font-medium',
              isOverLimit ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground',
            )}
            variant="outline"
          >
            {cards.length}
            {column.limit ? ` / ${column.limit}` : ''}
          </Badge>
        </div>

        {showAddCard && onAddCard && (
          <Button
            aria-label={`Add card to ${column.title}`}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            size="icon"
            variant="ghost"
            onClick={() => onAddCard(column.id)}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </header>

      <div
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-32 px-0.5 pb-1"
        ref={setNodeRef}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              card={card}
              key={card.id}
              onClick={onCardClick}
              renderFooter={renderCardFooter}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground/70">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}
