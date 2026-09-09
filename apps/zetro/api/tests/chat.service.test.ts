import assert from 'node:assert/strict'
import test from 'node:test'
import { ChatService } from '../src/modules/chat/chat.service.js'
import type { ChatProvider } from '../src/modules/chat/chat.types.js'

test('stops the active provider turn by conversation ID', async () => {
  let stoppedConversationId = ''
  const provider: ChatProvider = {
    respond: async () => {
      throw new Error('This test does not start a turn.')
    },
    stop: async (conversationId) => {
      stoppedConversationId = conversationId
      return true
    },
  }
  const service = new ChatService(provider)

  assert.equal(await service.stop('conversation-1'), true)
  assert.equal(stoppedConversationId, 'conversation-1')
})
