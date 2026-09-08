export type ChatRole = 'assistant' | 'user'
export type ChatWorkflow = 'deliver' | 'develop' | 'document' | 'review' | 'test'

export interface ChatAttachment {
  dataUrl: string
  id: string
  mimeType: string
  name: string
}

export interface ChatMessage {
  attachments: ChatAttachment[]
  content: string
  execution?: ChatTurnExecution
  id: string
  role: ChatRole
}

export interface ChatTurnResponse {
  execution: ChatTurnExecution
  message: { content: string; role: 'assistant' }
  model: string
  responseId: string
}

export interface ChatTurnExecution {
  activities: Array<{
    kind: 'command' | 'file_change' | 'mcp'
    label: string
    status: string
  }>
  delivery?: ChatDeliveryRun
  isolation: 'ephemeral-thread'
  tools: string[]
  worktreePath: string
  workflow: ChatWorkflow
}

export interface ChatDeliveryRun {
  publicationReady: boolean
  stages: Array<{
    evidence: string
    id:
      | 'plan'
      | 'observe'
      | 'review'
      | 'assign'
      | 'implement'
      | 'verify'
      | 'document'
      | 'version'
      | 'publish'
    status: 'blocked' | 'complete' | 'ready' | 'skipped'
    updatedAt: string
  }>
}

export interface ChatConversationSummary {
  createdAt: string
  id: string
  pinned: boolean
  title: string
  updatedAt: string
}

export interface ChatConversation extends ChatConversationSummary {
  messages: ChatMessage[]
}
