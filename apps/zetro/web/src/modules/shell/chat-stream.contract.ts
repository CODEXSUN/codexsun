export type ChatStreamEvent =
  | { content: string; type: 'request' }
  | { delta: string; type: 'response' }
  | { item: Record<string, unknown>; method: string; type: 'activity' }
  | { type: 'complete' }
  | { message: string; type: 'error' }

export function encodeChatStreamEvent(event: ChatStreamEvent) {
  return `${JSON.stringify(event)}\n`
}

export function parseChatStreamEvent(line: string): ChatStreamEvent {
  const event = JSON.parse(line) as unknown
  if (!isRecord(event) || typeof event.type !== 'string') {
    throw new Error('Codex returned an invalid stream event.')
  }
  if (event.type === 'request' && typeof event.content === 'string') {
    return { content: event.content, type: 'request' }
  }
  if (event.type === 'response' && typeof event.delta === 'string') {
    return { delta: event.delta, type: 'response' }
  }
  if (event.type === 'activity' && typeof event.method === 'string' && isRecord(event.item)) {
    return { item: event.item, method: event.method, type: 'activity' }
  }
  if (event.type === 'complete') return { type: 'complete' }
  if (event.type === 'error' && typeof event.message === 'string') {
    return { message: event.message, type: 'error' }
  }
  throw new Error('Codex returned an unsupported stream event.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
