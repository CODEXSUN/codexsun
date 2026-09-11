import type {
  ChatConversationListScope,
  ChatConversationSummary,
  ChatConversationUpdateRequest,
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnAcceptedResponse,
  ChatTurnProviderSnapshot,
  ChatTurnStatus,
  ProviderConnection,
} from '@codexsun/zetro-contracts'
import type { ProviderMessage, ProviderRunner } from '../../providers/index.js'
import type { ChatStore } from './chat.ports.js'

type EventListener = (event: ChatStoredEvent) => void

export class ChatService {
  private readonly executions = new Set<Promise<void>>()
  private readonly listeners = new Map<string, Set<EventListener>>()
  private closing = false

  constructor(
    private readonly repository: ChatStore,
    private readonly client: ProviderRunner,
  ) {}

  getHistory(conversationId: string): ChatHistoryResponse {
    return this.repository.getHistory(conversationId)
  }

  isReady(): boolean {
    return this.repository.isReady()
  }

  createConversation(conversationId: string, title?: string): ChatConversationSummary {
    if (this.closing) throw new ChatConversationConflictError('Zetro is stopping.')
    return this.repository.createConversation(conversationId, title, Date.now())
  }

  listConversations(scope: ChatConversationListScope): ChatConversationSummary[] {
    return this.repository.listConversations(scope)
  }

  updateConversation(
    conversationId: string,
    update: ChatConversationUpdateRequest,
  ): ChatConversationSummary {
    if (update.archived && this.repository.getActiveTurnId(conversationId)) {
      throw new ChatConversationConflictError(
        'Stop the active response before archiving this conversation.',
      )
    }
    const conversation = this.repository.updateConversation(conversationId, update, Date.now())
    if (!conversation) throw new ChatConversationNotFoundError()
    return conversation
  }

  hasTurn(conversationId: string, turnId: string): boolean {
    return this.repository.ownsTurn(conversationId, turnId)
  }

  startTurn(conversationId: string, turnId: string, prompt: string): ChatTurnAcceptedResponse {
    if (this.closing) throw new Error('Zetro is stopping and cannot accept a new turn.')
    const connection = this.client.getActiveConnection()
    const request = this.repository.startTurn(
      conversationId,
      turnId,
      prompt,
      Date.now(),
      providerSnapshot(connection),
    )
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
        void this.executeTurn(conversationId, turnId, prompt, connection).then(resolve, reject)
      })
    })
    this.executions.add(execution)
    void execution.then(
      () => this.executions.delete(execution),
      () => this.executions.delete(execution),
    )
    return { conversationId, status: 'working', turnId }
  }

  getTaskSource(conversationId: string, turnId: string) {
    const source = this.repository.getTaskSource(conversationId, turnId)
    if (!source) throw new Error('The source chat turn was not found.')
    if (source.status !== 'complete' || !source.response.trim()) {
      throw new Error('Only a completed assistant response can become a task draft.')
    }
    return { prompt: source.prompt, response: source.response }
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

  private async executeTurn(
    conversationId: string,
    turnId: string,
    prompt: string,
    connection: ProviderConnection,
  ): Promise<void> {
    let streamedResponse = ''
    try {
      const result = await this.client.run({
        connection,
        conversationId,
        messages: this.providerMessages(conversationId),
        onEvent: (event) => {
          if (event.type === 'response') streamedResponse += event.delta
          this.emit(turnId, event)
        },
        onProviderThread: (threadId) =>
          this.repository.setProviderThreadId(conversationId, threadId),
        prompt,
        providerThreadId: this.repository.getProviderThreadId(conversationId),
      })
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

  private providerMessages(conversationId: string): ProviderMessage[] {
    return this.repository.getHistory(conversationId).turns.flatMap((turn) => {
      const response = turn.events
        .filter(({ event }) => event.type === 'response')
        .map(({ event }) => (event.type === 'response' ? event.delta : ''))
        .join('')
      return [
        { content: turn.prompt, role: 'user' as const },
        ...(response ? [{ content: response, role: 'assistant' as const }] : []),
      ]
    })
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

function providerSnapshot(connection: ProviderConnection): ChatTurnProviderSnapshot {
  return {
    connectionId: connection.id,
    kind: connection.kind,
    label: connection.label,
    model: connection.model,
    reasoningEffort: connection.reasoningEffort,
  }
}

export class ChatConversationConflictError extends Error {}

export class ChatConversationNotFoundError extends Error {
  constructor() {
    super('Conversation was not found.')
  }
}

function isTerminal(event: ChatStreamEvent) {
  return event.type === 'complete' || event.type === 'stopped' || event.type === 'error'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not connect to Codex.'
}
