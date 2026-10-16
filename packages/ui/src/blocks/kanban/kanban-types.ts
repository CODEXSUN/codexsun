import type { ReactNode } from 'react'

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface KanbanCardItem {
  assignee?: {
    avatarUrl?: string | undefined
    name: string
  }
  columnId: string
  description?: string | undefined
  dueDate?: string | undefined
  id: string
  priority?: KanbanPriority | undefined
  tags?: readonly string[] | undefined
  title: string
}

export interface KanbanColumnItem {
  accentColor?: string | undefined
  cardIds?: readonly string[] | undefined
  description?: string | undefined
  id: string
  limit?: number | undefined
  title: string
}

export interface KanbanBoardProps {
  cards: readonly KanbanCardItem[]
  className?: string | undefined
  columns: readonly KanbanColumnItem[]
  emptyColumnMessage?: string | undefined
  onAddCard?: ((columnId: string) => void) | undefined
  onCardClick?: ((card: KanbanCardItem) => void) | undefined
  onCardMove?: ((cardId: string, targetColumnId: string, newIndex: number) => void) | undefined
  renderCardFooter?: ((card: KanbanCardItem) => ReactNode) | undefined
  showAddCard?: boolean | undefined
}
