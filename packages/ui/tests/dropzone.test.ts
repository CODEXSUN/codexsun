import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Dropzone, formatBytes } from '../src/blocks/dropzone/index'

test('formatBytes formats byte counts correctly', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(1024), '1.0 KB')
  assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB')
})

test('dropzone renders upload drop area and staged files', () => {
  const files = [
    {
      id: 'f-1',
      name: 'dataset.csv',
      progress: 65,
      sizeBytes: 1024 * 500,
      status: 'uploading' as const,
      type: 'text/csv',
    },
    {
      id: 'f-2',
      name: 'avatar.png',
      sizeBytes: 1024 * 1024,
      status: 'complete' as const,
      type: 'image/png',
    },
  ]

  const html = renderToStaticMarkup(
    createElement(Dropzone, {
      files,
      title: 'Drop documents here',
    }),
  )

  assert.match(html, /Drop documents here/)
  assert.match(html, /dataset\.csv/)
  assert.match(html, /500\.0 KB/)
  assert.match(html, /role="progressbar"/)
  assert.match(html, /avatar\.png/)
  assert.match(html, /1\.0 MB/)
  assert.match(html, /Upload complete/)
})
