import type { ChatAttachment, ChatRole, ChatTurnExecution } from './chat.types.js'

export interface StoredChatMessage {
  attachments: readonly ChatAttachment[]
  content: string
  execution?: ChatTurnExecution
  id: string
  role: ChatRole
}

export interface ChatConversationSummary {
  createdAt: string
  id: string
  pinned: boolean
  title: string
  updatedAt: string
}

export interface ChatConversation extends ChatConversationSummary {
  messages: readonly StoredChatMessage[]
}

export interface ConversationUpdate {
  messages?: readonly StoredChatMessage[]
  pinned?: boolean
  title?: string
}
