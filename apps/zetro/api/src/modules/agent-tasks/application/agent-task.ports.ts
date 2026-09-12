import type { AgentTaskDraft, AgentTaskPlan, AgentTaskSummary, ChatHandoffItem } from '@codexsun/zetro-contracts'

export type AgentTaskSource = {
  getTaskSource(conversationId: string, turnId: string): { prompt: string; response: string }
  listHandoffItems?(): ChatHandoffItem[]
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
  updatePlan(taskId: string, plan: AgentTaskPlan): AgentTaskDraft
  confirmReview(taskId: string, confirmedAt: number): AgentTaskDraft
  updateArchive(taskId: string, archived: boolean): AgentTaskDraft
}
