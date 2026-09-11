import type {
  ChatConversationListScope,
  ChatConversationSummary,
  ChatConversationUpdateRequest,
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnProviderSnapshot,
  ChatTurnStatus,
} from '@codexsun/zetro-contracts'

export interface ChatStore {
  appendEvent(turnId: string, event: ChatStreamEvent): ChatStoredEvent
  close(): void
  createConversation(
    conversationId: string,
    title: string | undefined,
    createdAt: number,
  ): ChatConversationSummary
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
  listConversations(scope: ChatConversationListScope): ChatConversationSummary[]
  ownsTurn(conversationId: string, turnId: string): boolean
  setProviderThreadId(conversationId: string, threadId: string): void
  startTurn(
    conversationId: string,
    turnId: string,
    prompt: string,
    startedAt: number,
    connection: ChatTurnProviderSnapshot,
  ): ChatStoredEvent
  getTaskSource(
    conversationId: string,
    turnId: string,
  ): { prompt: string; response: string; status: ChatTurnStatus } | undefined
  updateConversation(
    conversationId: string,
    update: ChatConversationUpdateRequest,
    updatedAt: number,
  ): ChatConversationSummary | undefined
}
