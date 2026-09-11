import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../../components/badge'
import { cn } from '../../lib/utils'
import type { KanbanCardItem, KanbanPriority } from './kanban-types'

const priorityStyles: Record<KanbanPriority, { badge: string; border: string; label: string }> = {
  low: {
    badge: 'bg-muted text-muted-foreground border-transparent',
    border: 'border-l-muted-foreground/40',
    label: 'Low',
  },
  medium: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-l-blue-500',
    label: 'Medium',
  },
  high: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-l-amber-500',
    label: 'High',
  },
  urgent: {
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    border: 'border-l-destructive',
    label: 'Urgent',
  },
}

export interface KanbanCardProps {
  card: KanbanCardItem
  isDragOverlay?: boolean
  onClick?: (card: KanbanCardItem) => void
  renderFooter?: (card: KanbanCardItem) => ReactNode
}

export function KanbanCard({ card, isDragOverlay = false, onClick, renderFooter }: KanbanCardProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    data: { card, type: 'Card' },
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = card.priority ? priorityStyles[card.priority] : null

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-3.5 text-card-foreground shadow-xs transition-shadow hover:border-foreground/25 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        priority?.border ? cn('border-l-4', priority.border) : '',
        isDragging && 'opacity-40 shadow-inner',
        isDragOverlay && 'rotate-1 shadow-lg ring-2 ring-primary/20 cursor-grabbing',
      )}
      ref={setNodeRef}
      style={style}
      tabIndex={0}
      onClick={() => onClick?.(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(card)
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug tracking-tight text-foreground select-none">
          {card.title}
        </h4>
        <button
          aria-label={`Drag card: ${card.title}`}
          className="shrink-0 cursor-grab text-muted-foreground/50 opacity-60 transition-opacity hover:text-foreground hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      {card.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground select-none">
          {card.description}
        </p>
      )}

      {(card.tags?.length || card.priority) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {priority && (
            <Badge className={cn('text-[10px] font-semibold tracking-tight', priority.badge)}>
              {priority.label}
            </Badge>
          )}
          {card.tags?.map((tag) => (
            <span
              className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
        {card.dueDate ? (
          <span className="flex items-center gap-1 text-[11px]">
            <Calendar className="size-3" />
            {card.dueDate}
          </span>
        ) : (
          <span />
        )}

        {card.assignee && (
          <div
            className="flex items-center gap-1.5"
            title={`Assigned to ${card.assignee.name}`}
          >
            {card.assignee.avatarUrl ? (
              <img
                alt={card.assignee.name}
                className="size-4.5 rounded-full object-cover ring-1 ring-border"
                src={card.assignee.avatarUrl}
              />
            ) : (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                {card.assignee.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="max-w-20 truncate text-[11px] font-medium text-foreground/80">
              {card.assignee.name}
            </span>
          </div>
        )}
      </div>

      {renderFooter?.(card)}
    </div>
  )
}
