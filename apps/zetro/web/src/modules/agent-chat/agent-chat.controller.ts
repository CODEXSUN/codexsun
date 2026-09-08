import { createContext, useContext } from 'react'
import type {
  ChatAttachment,
  ChatConversationSummary,
  ChatMessage,
  ChatWorkflow,
} from './agent-chat.types'

export type AgentChatController = {
  activeId: string | null
  archivedSummaries: ChatConversationSummary[]
  error: string | null
  isBusy: boolean
  isLoadingArchive: boolean
  isLoadingHistory: boolean
  messages: ChatMessage[]
  model: string
  summaries: ChatConversationSummary[]
  view: 'archive' | 'chat'
  archiveConversation(summary: ChatConversationSummary): Promise<void>
  deleteAllArchived(): Promise<void>
  deleteArchivedConversation(conversationId: string): Promise<void>
  newConversation(): void
  openArchive(): Promise<void>
  openConversation(conversationId: string): Promise<void>
  renameConversation(conversationId: string, title: string): Promise<void>
  restoreConversation(summary: ChatConversationSummary): Promise<void>
  showChat(): void
  sendMessage(content: string, attachments: ChatAttachment[], workflow: ChatWorkflow): Promise<void>
  togglePin(summary: ChatConversationSummary): Promise<void>
}

export const AgentChatContext = createContext<AgentChatController | null>(null)

export function useAgentChat() {
  const controller = useContext(AgentChatContext)
  if (!controller) throw new Error('useAgentChat must be used inside AgentChatProvider.')
  return controller
}
