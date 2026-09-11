import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { KanbanCard } from './kanban-card'
import { KanbanColumn } from './kanban-column'
import type { KanbanBoardProps, KanbanCardItem } from './kanban-types'

export function KanbanBoard({
  cards,
  className,
  columns,
  emptyColumnMessage,
  onAddCard,
  onCardClick,
  onCardMove,
  renderCardFooter,
  showAddCard = true,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCardItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const foundCard = cards.find((c) => c.id === active.id)
    if (foundCard) {
      setActiveCard(foundCard)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId === overId) return

    const isActiveCard = active.data.current?.type === 'Card'
    const isOverCard = over.data.current?.type === 'Card'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveCard) return

    const draggedCard = cards.find((c) => c.id === activeId)
    if (!draggedCard) return

    if (isOverCard) {
      const overCard = cards.find((c) => c.id === overId)
      if (overCard && draggedCard.columnId !== overCard.columnId) {
        const columnCards = cards.filter((c) => c.columnId === overCard.columnId)
        const targetIndex = columnCards.findIndex((c) => c.id === overId)
        onCardMove?.(activeId, overCard.columnId, targetIndex >= 0 ? targetIndex : 0)
      }
    } else if (isOverColumn) {
      if (draggedCard.columnId !== overId) {
        const columnCards = cards.filter((c) => c.columnId === overId)
        onCardMove?.(activeId, overId, columnCards.length)
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const draggedCard = cards.find((c) => c.id === activeId)
    if (!draggedCard) return

    const isOverCard = over.data.current?.type === 'Card'
    const isOverColumn = over.data.current?.type === 'Column'

    if (isOverCard) {
      const overCard = cards.find((c) => c.id === overId)
      if (overCard) {
        const columnCards = cards.filter((c) => c.columnId === overCard.columnId)
        const newIndex = columnCards.findIndex((c) => c.id === overId)
        onCardMove?.(activeId, overCard.columnId, newIndex >= 0 ? newIndex : 0)
      }
    } else if (isOverColumn) {
      const columnCards = cards.filter((c) => c.columnId === overId)
      onCardMove?.(activeId, overId, columnCards.length)
    }
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <div
        className={cn(
          'flex h-full w-full gap-4 overflow-x-auto pb-4 scrollbar-thin',
          className,
        )}
      >
        {columns.map((column) => {
          const columnCards = cards.filter((c) => c.columnId === column.id)
          return (
            <KanbanColumn
              cards={columnCards}
              column={column}
              emptyMessage={emptyColumnMessage}
              key={column.id}
              onAddCard={onAddCard}
              onCardClick={onCardClick}
              renderCardFooter={renderCardFooter}
              showAddCard={showAddCard}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCard card={activeCard} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
