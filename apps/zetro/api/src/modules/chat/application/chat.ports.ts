import type {
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnStatus,
} from '@codexsun/zetro-contracts'

export type ChatRunResult = { content: string; status: 'complete' | 'stopped' }

export interface ChatRunner {
  close(): Promise<void>
  run(
    conversationId: string,
    prompt: string,
    onEvent: (event: ChatStreamEvent) => void,
    providerThreadId: string | undefined,
    onProviderThread: (threadId: string) => void,
  ): Promise<ChatRunResult>
  stop(conversationId: string): Promise<void>
}

export interface ChatStore {
  appendEvent(turnId: string, event: ChatStreamEvent): ChatStoredEvent
  close(): void
  finishTurn(
    turnId: string,
    status: ChatTurnStatus,
    event: ChatStreamEvent,
    errorMessage?: string,
  ): ChatStoredEvent
  getActiveTurnId(conversationId: string): string | undefined
  getEvents(turnId: string, afterSequence?: number): ChatStoredEvent[]
  getHistory(conversationId: string): ChatHistoryResponse
  getProviderThreadId(conversationId: string): string | undefined
  getTurnStatus(turnId: string): ChatTurnStatus | undefined
  isReady(): boolean
  ownsTurn(conversationId: string, turnId: string): boolean
  setProviderThreadId(conversationId: string, threadId: string): void
  startTurn(
    conversationId: string,
    turnId: string,
    prompt: string,
    startedAt: number,
  ): ChatStoredEvent
}
