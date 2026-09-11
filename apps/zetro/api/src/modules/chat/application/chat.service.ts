import type {
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnAcceptedResponse,
  ChatTurnStatus,
} from '@codexsun/zetro-contracts'
import { ChatRepository } from '../infrastructure/chat.repository.js'
import { CodexChatClient } from '../infrastructure/codex-chat.client.js'

type EventListener = (event: ChatStoredEvent) => void

export class ChatService {
  private readonly listeners = new Map<string, Set<EventListener>>()

  constructor(
    private readonly repository: ChatRepository,
    private readonly client: CodexChatClient,
  ) {}

  getHistory(sessionId: string): ChatHistoryResponse {
    return this.repository.getHistory(sessionId)
  }

  isReady(): boolean {
    return this.repository.isReady()
  }

  startTurn(sessionId: string, turnId: string, prompt: string): ChatTurnAcceptedResponse {
    this.repository.startTurn(sessionId, turnId, prompt, Date.now())
    this.emit(turnId, { content: prompt, type: 'request' })
    queueMicrotask(() => void this.executeTurn(sessionId, turnId, prompt))
    return { sessionId, status: 'working', turnId }
  }

  async observeTurn(
    sessionId: string,
    turnId: string,
    afterSequence: number,
    signal: AbortSignal,
    onEvent: EventListener,
  ): Promise<void> {
    if (!this.repository.ownsTurn(sessionId, turnId)) throw new Error('Chat turn was not found.')

    let lastSequence = afterSequence
    let finish: (() => void) | undefined
    const completed = new Promise<void>((resolve) => {
      finish = resolve
    })
    const deliver = (stored: ChatStoredEvent) => {
      if (stored.sequence <= lastSequence) return
      lastSequence = stored.sequence
      onEvent(stored)
      if (isTerminal(stored.event)) finish?.()
    }
    const unsubscribe = this.subscribe(turnId, deliver)
    const abort = () => finish?.()
    signal.addEventListener('abort', abort, { once: true })

    try {
      for (const event of this.repository.getEvents(turnId, lastSequence)) deliver(event)
      if (this.repository.getTurnStatus(turnId) !== 'working') finish?.()
      await completed
    } finally {
      signal.removeEventListener('abort', abort)
      unsubscribe()
    }
  }

  stop(sessionId: string): Promise<void> {
    return this.client.stop(sessionId)
  }

  async close(): Promise<void> {
    await this.client.close()
    this.repository.close()
  }

  private async executeTurn(sessionId: string, turnId: string, prompt: string): Promise<void> {
    let streamedResponse = ''
    try {
      const result = await this.client.run(
        sessionId,
        prompt,
        (event) => {
          if (event.type === 'response') streamedResponse += event.delta
          this.emit(turnId, event)
        },
        this.repository.getProviderThreadId(sessionId),
        (threadId) => this.repository.setProviderThreadId(sessionId, threadId),
      )
      if (!streamedResponse && result.content) {
        this.emit(turnId, { delta: result.content, type: 'response' })
      } else if (result.content.startsWith(streamedResponse)) {
        const remainder = result.content.slice(streamedResponse.length)
        if (remainder) this.emit(turnId, { delta: remainder, type: 'response' })
      }
      const status: ChatTurnStatus = result.status === 'stopped' ? 'stopped' : 'complete'
      this.emit(turnId, { type: status === 'stopped' ? 'stopped' : 'complete' })
      this.repository.finishTurn(turnId, status)
    } catch (error) {
      const message = errorMessage(error)
      this.emit(turnId, { message, type: 'error' })
      this.repository.finishTurn(turnId, 'failed', message)
    }
  }

  private emit(turnId: string, event: ChatStreamEvent): void {
    const stored = this.repository.appendEvent(turnId, event)
    for (const listener of this.listeners.get(turnId) ?? []) listener(stored)
  }

  private subscribe(turnId: string, listener: EventListener): () => void {
    const listeners = this.listeners.get(turnId) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(turnId, listeners)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) this.listeners.delete(turnId)
    }
  }
}

function isTerminal(event: ChatStreamEvent) {
  return event.type === 'complete' || event.type === 'stopped' || event.type === 'error'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not connect to Codex.'
}
