import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ChatConversation, StoredChatMessage } from './chat.conversation.types.js'

type LegacyStoredMessage = Omit<StoredChatMessage, 'createdAt'> & { createdAt?: string }
type LegacyConversation = Omit<ChatConversation, 'messages' | 'projectId'> & {
  messages: readonly LegacyStoredMessage[]
  projectId?: string
}

export class ChatConversationRepository {
  private conversations: ChatConversation[] = []

  public constructor(
    private readonly filePath: string,
    private readonly defaultProjectId: string,
  ) {}

  public async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      const stored = JSON.parse(await readFile(this.filePath, 'utf8')) as LegacyConversation[]
      const needsMigration = stored.some(
        ({ messages, projectId }) => !projectId || messages.some(({ createdAt }) => !createdAt),
      )
      this.conversations = stored.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) => ({
          ...message,
          createdAt: message.createdAt ?? conversation.createdAt,
        })),
        projectId: conversation.projectId ?? this.defaultProjectId,
      }))
      if (needsMigration) await this.persist()
    } catch (error) {
      if (!isMissingFile(error)) throw error
      await this.persist()
    }
  }

  public list(): readonly ChatConversation[] {
    return [...this.conversations].sort(compareConversations)
  }

  public find(conversationId: string): ChatConversation | undefined {
    return this.conversations.find((conversation) => conversation.id === conversationId)
  }

  public async save(conversation: ChatConversation): Promise<void> {
    const index = this.conversations.findIndex((candidate) => candidate.id === conversation.id)
    if (index === -1) this.conversations.push(conversation)
    else this.conversations[index] = conversation
    await this.persist()
  }

  public async delete(conversationId: string): Promise<void> {
    this.conversations = this.conversations.filter(
      (conversation) => conversation.id !== conversationId,
    )
    await this.persist()
  }

  public async deleteArchived(projectId: string): Promise<number> {
    const currentCount = this.conversations.length
    this.conversations = this.conversations.filter(
      (conversation) => conversation.projectId !== projectId || !conversation.archivedAt,
    )
    await this.persist()
    return currentCount - this.conversations.length
  }

  private async persist(): Promise<void> {
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.conversations, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function compareConversations(left: ChatConversation, right: ChatConversation): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
  return right.updatedAt.localeCompare(left.updatedAt)
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
