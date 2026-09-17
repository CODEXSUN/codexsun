import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MessageSquare } from 'lucide-react'
import { SidebarProvider, SidebarMenuButton } from '../src/components/sidebar'
import { AgentActivityRail } from '../src/layouts/agent-workspace'

test('accented sidebar keeps selection semantics and truncates a nested title', () => {
  const html = renderToStaticMarkup(
    createElement(
      SidebarProvider,
      {},
      createElement(
        SidebarMenuButton,
        {
          variant: 'accented',
          size: 'comfortable',
          isActive: true,
          'aria-current': 'page',
          title: 'Full conversation title',
        },
        createElement('span', {}, 'Full conversation title'),
      ),
    ),
  )
  assert.ok(html.includes('aria-current="page"'))
  assert.ok(html.includes('data-active'))
  assert.ok(html.includes('before:opacity-100'))
  assert.ok(html.includes('h-10'))
  assert.ok(html.includes('truncate'))
  assert.ok(html.includes('focus-visible:ring-2'))
})

test('inactive sidebar does not claim current selection and preserves disabled state', () => {
  const html = renderToStaticMarkup(
    createElement(
      SidebarProvider,
      {},
      createElement(
        SidebarMenuButton,
        { variant: 'accented', disabled: true },
        createElement('span', {}, 'Other chat'),
      ),
    ),
  )
  assert.ok(!html.includes('aria-current="page"'))
  assert.ok(html.includes('disabled'))
})

test('activity rail renders an independent selected marker and accessible title', () => {
  const html = renderToStaticMarkup(
    createElement(AgentActivityRail, {
      visible: true,
      side: 'left',
      rail: {
        label: 'Activities',
        items: [
          { id: 'chat', icon: MessageSquare, label: 'Chat', active: true, onSelect: () => {} },
        ],
      },
    }),
  )
  assert.ok(html.includes('aria-current="page"'))
  assert.ok(html.includes('before:bg-primary'))
  assert.ok(html.includes('aria-label="Chat"'))
})
