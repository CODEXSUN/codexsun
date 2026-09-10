import { z } from 'zod'
import { chatTurnResponseSchema } from './agent-chat.schema'

export const chatLiveItemSchema = z.strictObject({
  type: z.literal('progress'),
  id: z.string(),
  kind: z.enum(['response', 'tool']),
  text: z.string().max(8000),
})
export type ChatLiveItem = z.infer<typeof chatLiveItemSchema>
const eventSchema = z.discriminatedUnion('type', [
  chatLiveItemSchema,
  z.strictObject({ type: z.literal('status'), message: z.string() }),
  z.strictObject({ type: z.literal('heartbeat') }),
  z.strictObject({ type: z.literal('error'), message: z.string() }),
  z.strictObject({ type: z.literal('result'), response: chatTurnResponseSchema }),
])

export async function readChatStream(response: Response, onProgress: (item: ChatLiveItem) => void) {
  if (!response.body) throw new Error('Chat stream is unavailable.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      if (buffer.length > 2_000_000) throw new Error('Chat stream frame is too large.')
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        const event = eventSchema.parse(JSON.parse(line))
        if (event.type === 'error') throw new Error(event.message)
        if (event.type === 'result') return event.response
        if (event.type === 'progress') onProgress(event)
        if (event.type === 'status')
          onProgress({ type: 'progress', id: 'status', kind: 'tool', text: event.message })
        newline = buffer.indexOf('\n')
      }
      if (done)
        throw new Error('Chat stream ended before completion. Review the worktree before retrying.')
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
