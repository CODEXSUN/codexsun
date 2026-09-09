import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPastedTextAttachment,
  longPasteCharacterLimit,
  maxChatAttachmentBytes,
  shouldAttachPastedText,
} from '../src/modules/agent-chat/agent-chat.attachments.js'

test('converts pasted text at the long-paste threshold into an attachment', () => {
  assert.equal(shouldAttachPastedText('a'.repeat(longPasteCharacterLimit - 1)), false)
  assert.equal(shouldAttachPastedText('a'.repeat(longPasteCharacterLimit)), true)
})

test('preserves Unicode pasted text in a named text attachment', () => {
  const attachment = createPastedTextAttachment(
    'Zetro diagram: app -> module -> file 🎯',
    new Date('2026-09-09T12:34:56.000Z'),
  )

  assert.equal(attachment.mimeType, 'text/plain')
  assert.equal(attachment.name, 'pasted-text-2026-09-09_12-34-56-000.txt')
  assert.equal(
    decodeURIComponent(attachment.dataUrl.split(',')[1] ?? ''),
    'Zetro diagram: app -> module -> file 🎯',
  )
})

test('rejects pasted text larger than the composer attachment limit', () => {
  assert.throws(
    () => createPastedTextAttachment('a'.repeat(maxChatAttachmentBytes + 1)),
    /larger than 4 MB/,
  )
})
