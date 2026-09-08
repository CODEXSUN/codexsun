import { randomUUID } from 'node:crypto'
import type { ChatConversationRepository } from './chat.conversation.repository.js'
import type {
  ChatConversation,
  ChatConversationSummary,
  ConversationUpdate,
  StoredChatMessage,
} from './chat.conversation.types.js'

export class ChatConversationService {
  public constructor(private readonly repository: ChatConversationRepository) {}

  public list(projectId: string, archived = false): readonly ChatConversationSummary[] {
    return this.repository
      .list()
      .filter(
        (conversation) =>
          conversation.projectId === projectId && Boolean(conversation.archivedAt) === archived,
      )
      .map(toSummary)
  }

  public get(conversationId: string): ChatConversation {
    return this.requireConversation(conversationId)
  }

  public async create(
    projectId: string,
    messages: readonly StoredChatMessage[],
  ): Promise<ChatConversation> {
    const timestamp = new Date().toISOString()
    const conversation: ChatConversation = {
      createdAt: timestamp,
      id: randomUUID(),
      messages,
      pinned: false,
      projectId,
      title: createShortTitle(messages),
      updatedAt: timestamp,
    }
    await this.repository.save(conversation)
    return conversation
  }

  public async update(
    conversationId: string,
    update: ConversationUpdate,
  ): Promise<ChatConversation> {
    const current = this.requireConversation(conversationId)
    const timestamp = new Date().toISOString()
    const { archived, ...changes } = update
    const conversation: ChatConversation = {
      ...current,
      ...changes,
      ...(archived === undefined ? {} : { archivedAt: archived ? timestamp : undefined }),
      ...(archived ? { pinned: false } : {}),
      updatedAt: timestamp,
    }
    await this.repository.save(conversation)
    return conversation
  }

  public async delete(conversationId: string): Promise<void> {
    const conversation = this.requireConversation(conversationId)
    if (!conversation.archivedAt) throw new ChatConversationNotArchivedError(conversationId)
    await this.repository.delete(conversationId)
  }

  public deleteArchived(projectId: string): Promise<number> {
    return this.repository.deleteArchived(projectId)
  }

  private requireConversation(conversationId: string): ChatConversation {
    const conversation = this.repository.find(conversationId)
    if (!conversation) throw new ChatConversationNotFoundError(conversationId)
    return conversation
  }
}

export class ChatConversationNotFoundError extends Error {
  public constructor(conversationId: string) {
    super(`Conversation ${conversationId} was not found.`)
  }
}

export class ChatConversationNotArchivedError extends Error {
  public constructor(conversationId: string) {
    super(`Conversation ${conversationId} must be archived before permanent deletion.`)
  }
}

function toSummary(conversation: ChatConversation): ChatConversationSummary {
  const { messages: _messages, ...summary } = conversation
  return summary
}

function createShortTitle(messages: readonly StoredChatMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user')
  const text = firstUserMessage?.content.trim().replace(/\s+/g, ' ')
  if (text) return truncateAtWord(text, 48)
  const attachmentName = firstUserMessage?.attachments[0]?.name
  return attachmentName ? truncateAtWord(attachmentName, 48) : 'New conversation'
}

function truncateAtWord(value: string, limit: number): string {
  if (value.length <= limit) return value
  const shortened = value
    .slice(0, limit + 1)
    .replace(/\s+\S*$/, '')
    .trim()
  return `${shortened || value.slice(0, limit).trim()}…`
}
