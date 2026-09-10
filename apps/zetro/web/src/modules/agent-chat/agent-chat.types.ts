export type ChatRole = 'assistant' | 'user'
export type ChatWorkflow = 'deliver' | 'develop' | 'document' | 'review' | 'test'

export type ChatAttachment = {
  dataUrl: string
  id: string
  mimeType: string
  name: string
}

export type ChatActivity = {
  details?: string
  kind: 'command' | 'file_change' | 'mcp'
  label: string
  status: string
}

export type ChatDeliveryRun = {
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

export type ChatExecution = {
  activities: ChatActivity[]
  delivery?: ChatDeliveryRun
  isolation: 'ephemeral-thread'
  tools: string[]
  worktreePath: string
  workflow: ChatWorkflow
}

export type ChatMessage = {
  attachments: ChatAttachment[]
  content: string
  createdAt: string
  execution?: ChatExecution
  id: string
  role: ChatRole
}

export type ChatTurnResponse = {
  execution: ChatExecution
  message: { content: string; role: 'assistant' }
  model: string
  responseId: string
}

export type ChatConversationSummary = {
  archivedAt?: string
  createdAt: string
  id: string
  pinned: boolean
  projectId: string
  scope?: ChatWorkspaceScope
  title: string
  updatedAt: string
}

export type ChatConversation = ChatConversationSummary & {
  messages: ChatMessage[]
}

export type ChatWorkspaceScope = {
  documentationPaths?: string[]
  application: string
  folderPath: string
  module: string
}
