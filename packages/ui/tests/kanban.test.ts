import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { KanbanBoard } from '../src/blocks/kanban/index'

test('kanban board renders columns, headers, and cards', () => {
  const columns = [
    { id: 'todo', title: 'To Do', limit: 5 },
    { id: 'done', title: 'Done' },
  ]
  const cards = [
    {
      columnId: 'todo',
      description: 'Finish writing unit tests',
      id: 'task-1',
      priority: 'high' as const,
      tags: ['ui', 'core'],
      title: 'Implement unit tests',
    },
    {
      columnId: 'done',
      id: 'task-2',
      title: 'Initial setup',
    },
  ]

  const html = renderToStaticMarkup(
    createElement(KanbanBoard, {
      cards,
      columns,
    }),
  )

  assert.match(html, /To Do/)
  assert.match(html, /Done/)
  assert.match(html, /Implement unit tests/)
  assert.match(html, /Finish writing unit tests/)
  assert.match(html, /High/)
  assert.match(html, /Initial setup/)
})

test('kanban column shows empty state message when empty', () => {
  const columns = [{ id: 'empty-col', title: 'Backlog' }]
  const html = renderToStaticMarkup(
    createElement(KanbanBoard, {
      cards: [],
      columns,
      emptyColumnMessage: 'Empty backlog',
    }),
  )

  assert.match(html, /Empty backlog/)
})
