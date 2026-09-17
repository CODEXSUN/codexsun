import type { ReactNode } from 'react'

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface KanbanCardItem {
  assignee?: {
    avatarUrl?: string
    name: string
  }
  columnId: string
  description?: string
  dueDate?: string
  id: string
  priority?: KanbanPriority
  tags?: readonly string[]
  title: string
}

export interface KanbanColumnItem {
  accentColor?: string
  cardIds?: readonly string[]
  description?: string
  id: string
  limit?: number
  title: string
}

export interface KanbanBoardProps {
  cards: readonly KanbanCardItem[]
  className?: string
  columns: readonly KanbanColumnItem[]
  emptyColumnMessage?: string
  onAddCard?: (columnId: string) => void
  onCardClick?: (card: KanbanCardItem) => void
  onCardMove?: (cardId: string, targetColumnId: string, newIndex: number) => void
  renderCardFooter?: (card: KanbanCardItem) => ReactNode
  showAddCard?: boolean
}
