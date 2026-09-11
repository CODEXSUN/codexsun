import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FilterBuilder } from '../src/blocks/filter-builder/index'

test('filter builder renders fields, operators, and rules', () => {
  const fields = [
    { id: 'status', label: 'Status', type: 'select' as const, options: [{ label: 'Active', value: 'active' }] },
    { id: 'amount', label: 'Amount', type: 'number' as const },
  ]
  const filter = {
    combinator: 'AND' as const,
    rules: [
      { fieldId: 'status', id: 'r1', operator: 'equals' as const, value: 'active' },
      { fieldId: 'amount', id: 'r2', operator: 'greater_than' as const, value: 50 },
    ],
  }

  const html = renderToStaticMarkup(
    createElement(FilterBuilder, {
      fields,
      filter,
      onChange: () => {},
    }),
  )

  assert.match(html, /Filter rules/)
  assert.match(html, /Match ALL \(AND\)/)
  assert.match(html, /Status/)
  assert.match(html, /Amount/)
  assert.match(html, /Add condition/)
  assert.match(html, /Clear/)
})
