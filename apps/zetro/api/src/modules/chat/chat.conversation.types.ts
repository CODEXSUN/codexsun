import type { ChatAttachment, ChatRole, ChatTurnExecution } from './chat.types.js'

export interface StoredChatMessage {
  attachments: readonly ChatAttachment[]
  content: string
  createdAt: string
  execution?: ChatTurnExecution
  id: string
  role: ChatRole
}

export interface ChatConversationSummary {
  archivedAt?: string
  createdAt: string
  id: string
  pinned: boolean
  projectId: string
  scope?: ChatWorkspaceScope
  title: string
  updatedAt: string
}

export interface ChatConversation extends ChatConversationSummary {
  messages: readonly StoredChatMessage[]
}

export interface ConversationUpdate {
  archived?: boolean
  messages?: readonly StoredChatMessage[]
  pinned?: boolean
  scope?: ChatWorkspaceScope
  title?: string
}

export interface ChatWorkspaceScope {
  application: string
  folderPath: string
  module: string
}
