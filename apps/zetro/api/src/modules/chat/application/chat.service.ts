import type {
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnAcceptedResponse,
  ChatTurnStatus,
} from '@codexsun/zetro-contracts'
import type { ChatRunner, ChatStore } from './chat.ports.js'

type EventListener = (event: ChatStoredEvent) => void

export class ChatService {
  private readonly executions = new Set<Promise<void>>()
  private readonly listeners = new Map<string, Set<EventListener>>()
  private closing = false

  constructor(
    private readonly repository: ChatStore,
    private readonly client: ChatRunner,
  ) {}

  getHistory(conversationId: string): ChatHistoryResponse {
    return this.repository.getHistory(conversationId)
  }

  isReady(): boolean {
    return this.repository.isReady()
  }

  hasTurn(conversationId: string, turnId: string): boolean {
    return this.repository.ownsTurn(conversationId, turnId)
  }

  startTurn(conversationId: string, turnId: string, prompt: string): ChatTurnAcceptedResponse {
    if (this.closing) throw new Error('Zetro is stopping and cannot accept a new turn.')
    const request = this.repository.startTurn(conversationId, turnId, prompt, Date.now())
    this.publish(turnId, request)
    const execution = new Promise<void>((resolve, reject) => {
      setImmediate(() => {
        if (this.closing) {
          try {
            const message = 'Zetro stopped before Codex execution started.'
            this.finish(turnId, 'failed', { message, type: 'error' }, message)
            resolve()
          } catch (error) {
            reject(error)
          }
          return
        }
        void this.executeTurn(conversationId, turnId, prompt).then(resolve, reject)
      })
    })
    this.executions.add(execution)
    void execution.then(
      () => this.executions.delete(execution),
      () => this.executions.delete(execution),
    )
    return { conversationId, status: 'working', turnId }
  }

  async observeTurn(
    conversationId: string,
    turnId: string,
    afterSequence: number,
    signal: AbortSignal,
    onEvent: EventListener,
  ): Promise<void> {
    if (!this.repository.ownsTurn(conversationId, turnId)) {
      throw new Error('Chat turn was not found in this conversation.')
    }

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

  stop(conversationId: string, turnId: string): Promise<void> {
    if (this.repository.getActiveTurnId(conversationId) !== turnId) {
      throw new Error('This turn is not the active conversation response.')
    }
    return this.client.stop(conversationId)
  }

  async close(): Promise<void> {
    this.closing = true
    await this.client.close()
    await Promise.allSettled(this.executions)
    this.repository.close()
  }

  private async executeTurn(conversationId: string, turnId: string, prompt: string): Promise<void> {
    let streamedResponse = ''
    try {
      const result = await this.client.run(
        conversationId,
        prompt,
        (event) => {
          if (event.type === 'response') streamedResponse += event.delta
          this.emit(turnId, event)
        },
        this.repository.getProviderThreadId(conversationId),
        (threadId) => this.repository.setProviderThreadId(conversationId, threadId),
      )
      if (!streamedResponse && result.content) {
        this.emit(turnId, { delta: result.content, type: 'response' })
      } else if (result.content.startsWith(streamedResponse)) {
        const remainder = result.content.slice(streamedResponse.length)
        if (remainder) this.emit(turnId, { delta: remainder, type: 'response' })
      }
      const status: ChatTurnStatus = result.status === 'stopped' ? 'stopped' : 'complete'
      this.finish(turnId, status, { type: status === 'stopped' ? 'stopped' : 'complete' })
    } catch (error) {
      const message = errorMessage(error)
      this.finish(turnId, 'failed', { message, type: 'error' }, message)
    }
  }

  private emit(turnId: string, event: ChatStreamEvent): void {
    const stored = this.repository.appendEvent(turnId, event)
    this.publish(turnId, stored)
  }

  private finish(
    turnId: string,
    status: ChatTurnStatus,
    event: ChatStreamEvent,
    errorMessage?: string,
  ): void {
    const stored = this.repository.finishTurn(turnId, status, event, errorMessage)
    this.publish(turnId, stored)
  }

  private publish(turnId: string, stored: ChatStoredEvent): void {
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
