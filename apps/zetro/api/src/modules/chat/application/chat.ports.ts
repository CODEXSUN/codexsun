import type {
  ChatConversationListScope,
  ChatConversationProvider,
  ChatConversationSummary,
  ChatConversationUpdateRequest,
  ChatDecisionItem,
  ChatDecisionUpsertRequest,
  ChatHandoffItem,
  ChatHistoryResponse,
  ChatStoredEvent,
  ChatStreamEvent,
  ChatTurnProviderSnapshot,
  ChatTurnStatus,
  ChatWorkingSetCategory,
  ChatWorkingSetSourceKind,
} from '@codexsun/zetro-contracts'

export interface ChatStore {
  appendEvent(turnId: string, event: ChatStreamEvent): ChatStoredEvent
  close(): void
  clearHandoffItems(): ChatHandoffItem[]
  createConversation(
    conversationId: string,
    title: string | undefined,
    createdAt: number,
    provider: ChatConversationProvider,
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
  listHandoffItems(): ChatHandoffItem[]
  listDecisions(conversationId: string, turnId: string): ChatDecisionItem[]
  removeDecision(conversationId: string, decisionId: string): ChatHandoffItem[]
  getConversationProvider(conversationId: string): ChatConversationProvider | undefined
  getProviderThreadId(conversationId: string, connectionId: string): string | undefined
  getTurnStatus(turnId: string): ChatTurnStatus | undefined
  isReady(): boolean
  listConversations(scope: ChatConversationListScope): ChatConversationSummary[]
  ownsTurn(conversationId: string, turnId: string): boolean
  setProviderThreadId(conversationId: string, connectionId: string, threadId: string): void
  setHandoffItem(
    conversationId: string,
    turnId: string,
    selection: { category: ChatWorkingSetCategory; selected: boolean; sourceKind: ChatWorkingSetSourceKind },
  ): ChatHandoffItem[]
  upsertDecision(conversationId: string, turnId: string, decision: ChatDecisionUpsertRequest): ChatDecisionItem
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
  updateConversationProvider(
    conversationId: string,
    provider: ChatConversationProvider,
    updatedAt: number,
  ): ChatConversationSummary | undefined
}
