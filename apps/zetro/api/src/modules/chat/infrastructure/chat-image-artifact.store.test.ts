import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChatImageArtifactStore } from './chat-image-artifact.store.js'

test('stores and resolves a private PNG image for one conversation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-image-test-'))
  try {
    const store = new ChatImageArtifactStore(directory)
    const image = store.save('a0b0c0d0-1111-4111-8111-111111111111', {
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8GQAAAABJRU5ErkJggg==',
      name: 'reference.png',
    })
    assert.equal(image.mimeType, 'image/png')
    assert.equal(image.name, 'reference.png')
    assert.match(store.resolve('a0b0c0d0-1111-4111-8111-111111111111', [image.id])[0] ?? '', /\.png$/)
    assert.throws(() => store.resolve('b0b0c0d0-2222-4222-8222-222222222222', [image.id]))
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})
