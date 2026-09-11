import { useState } from 'react'
import {
  KanbanBoard,
  type KanbanCardItem,
  type KanbanColumnItem,
} from '@codexsun/ui/blocks/kanban'
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main'
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page'

const initialColumns: readonly KanbanColumnItem[] = [
  { accentColor: '#3b82f6', id: 'backlog', limit: 8, title: 'Backlog' },
  { accentColor: '#f59e0b', id: 'in_progress', limit: 4, title: 'In Progress' },
  { accentColor: '#8b5cf6', id: 'review', limit: 4, title: 'Review' },
  { accentColor: '#10b981', id: 'done', title: 'Done' },
]

const initialCards: readonly KanbanCardItem[] = [
  {
    assignee: { name: 'Alex Chen' },
    columnId: 'backlog',
    description: 'Implement distributed locking mechanism using MariaDB advisory locks.',
    dueDate: 'Sep 18',
    id: 'card-1',
    priority: 'high',
    tags: ['platform', 'db'],
    title: 'Advisory lock integration',
  },
  {
    assignee: { name: 'Sarah Miller' },
    columnId: 'backlog',
    description: 'Design and export lightweight SVG sparkline components for metric cards.',
    id: 'card-2',
    priority: 'medium',
    tags: ['ui', 'dataviz'],
    title: 'Sparklines component',
  },
  {
    assignee: { name: 'Dev Team' },
    columnId: 'in_progress',
    description: 'Wire DragOverlay and pointer sensor collision strategies across columns.',
    dueDate: 'Sep 14',
    id: 'card-3',
    priority: 'urgent',
    tags: ['dnd', 'ui'],
    title: 'Drag and drop board implementation',
  },
  {
    assignee: { name: 'Alex Chen' },
    columnId: 'review',
    description: 'Enforce maximum file length under 700 lines across packages.',
    id: 'card-4',
    priority: 'low',
    tags: ['governance'],
    title: 'File length linting verification',
  },
  {
    assignee: { name: 'Release Bot' },
    columnId: 'done',
    description: 'Verified 19 framework contract test suites in candidate build.',
    dueDate: 'Sep 10',
    id: 'card-5',
    priority: 'medium',
    tags: ['framework', 'tests'],
    title: 'Framework F001 verification suite',
  },
]

const kanbanCode = `import { useState } from 'react'
import { KanbanBoard, type KanbanCardItem, type KanbanColumnItem } from '@codexsun/ui/blocks/kanban'

export function ProjectKanban() {
  const [cards, setCards] = useState<readonly KanbanCardItem[]>(initialCards)

  function handleCardMove(cardId: string, targetColumnId: string, newIndex: number) {
    setCards((prev) => {
      const current = prev.find((c) => c.id === cardId)
      if (!current) return prev
      const remaining = prev.filter((c) => c.id !== cardId)
      const updated = { ...current, columnId: targetColumnId }
      const targetColumnCards = remaining.filter((c) => c.columnId === targetColumnId)
      targetColumnCards.splice(newIndex, 0, updated)
      const otherCards = remaining.filter((c) => c.columnId !== targetColumnId)
      return [...otherCards, ...targetColumnCards]
    })
  }

  return (
    <KanbanBoard
      cards={cards}
      columns={columns}
      onCardMove={handleCardMove}
      onAddCard={(colId) => console.log('Add card to', colId)}
    />
  )
}`

export function UiKanbanDocumentation() {
  const topology = useMdiTopology()
  const [cards, setCards] = useState<readonly KanbanCardItem[]>(initialCards)
  const [feedback, setFeedback] = useState('Interactive board: Drag cards between columns.')

  function handleCardMove(cardId: string, targetColumnId: string, newIndex: number) {
    setCards((prev) => {
      const current = prev.find((c) => c.id === cardId)
      if (!current) return prev
      const remaining = prev.filter((c) => c.id !== cardId)
      const updatedCard = { ...current, columnId: targetColumnId }

      const targetColCards = remaining.filter((c) => c.columnId === targetColumnId)
      targetColCards.splice(newIndex, 0, updatedCard)
      const otherColCards = remaining.filter((c) => c.columnId !== targetColumnId)

      setFeedback(`Moved "${current.title}" to ${targetColumnId} (index ${newIndex}).`)
      return [...otherColCards, ...targetColCards]
    })
  }

  return (
    <UiTemplatePage
      code={kanbanCode}
      importPath="@codexsun/ui/blocks/kanban"
      kind="Block"
      name="Kanban Board"
      navigation={{
        next: { href: '/?block=file-tree', name: 'File Tree' },
        previous: { href: '/?block=execution-status', name: 'Execution Status' },
      }}
      preview={
        <div className="flex flex-col gap-3">
          <div className="h-[480px] w-full rounded-xl border border-border/80 bg-background/50 p-3">
            <KanbanBoard
              cards={cards}
              columns={initialColumns}
              onAddCard={(colId) => setFeedback(`New card requested in ${colId}.`)}
              onCardClick={(card) => setFeedback(`Selected card: ${card.title}`)}
              onCardMove={handleCardMove}
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {feedback}
          </p>
        </div>
      }
      topology={topology}
      topologyIds={{ page: '24', preview: '24.1', usage: '24.2' }}
      usageDescription={
        <p>
          Supply application-owned cards and columns. The Kanban block manages dragging sensors,
          collision detection, sortable card ordering, grab handles, and drop overlays.
        </p>
      }
    />
  )
}
