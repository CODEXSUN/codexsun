import type { AgentTaskDraft, AgentTaskSummary } from '@codexsun/zetro-contracts'

export type AgentTaskSource = {
  getTaskSource(conversationId: string, turnId: string): { prompt: string; response: string }
}

export type AgentTaskDraftInput = {
  createdAt: number
  id: string
  originConversationId: string
  originTurnId: string
  sourcePrompt: string
  sourceResponse: string
  title: string
}

export type AgentTaskStore = {
  close(): void
  createOrGet(input: AgentTaskDraftInput): AgentTaskDraft
  get(taskId: string): AgentTaskDraft | undefined
  isReady(): boolean
  list(): AgentTaskSummary[]
}
