import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FileTree } from '../src/blocks/file-tree/index'

test('file tree renders hierarchical nodes and icons', () => {
  const nodes = [
    {
      children: [
        { id: 'app-ts', name: 'app.tsx', path: '/src/app.tsx', type: 'file' as const },
        { id: 'styles-css', name: 'styles.css', path: '/src/styles.css', type: 'file' as const },
      ],
      id: 'src',
      name: 'src',
      path: '/src',
      type: 'directory' as const,
    },
    { id: 'readme', name: 'README.md', path: '/README.md', type: 'file' as const },
  ]

  const html = renderToStaticMarkup(
    createElement(FileTree, {
      defaultExpandedIds: ['src'],
      nodes,
      selectedNodeId: 'app-ts',
    }),
  )

  assert.match(html, /role="tree"/)
  assert.match(html, /src/)
  assert.match(html, /app\.tsx/)
  assert.match(html, /styles\.css/)
  assert.match(html, /README\.md/)
  assert.match(html, /aria-selected="true"/)
})

test('file tree shows empty message when nodes are empty', () => {
  const html = renderToStaticMarkup(
    createElement(FileTree, {
      emptyMessage: 'No project files',
      nodes: [],
    }),
  )

  assert.match(html, /No project files/)
})
