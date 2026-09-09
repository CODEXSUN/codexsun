import { readFile } from 'node:fs/promises'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { ChatDatabase } from './chat.database.js'
import { chatMigrations } from './chat.migrations.js'
import type { ChatConversation, StoredChatMessage } from './chat.conversation.types.js'

type LegacyStoredMessage = Omit<StoredChatMessage, 'createdAt'> & { createdAt?: string }
type LegacyConversation = Omit<ChatConversation, 'messages' | 'projectId'> & {
  messages: readonly LegacyStoredMessage[]
  projectId?: string
}

export class ChatConversationRepository {
  private conversations: ChatConversation[] = []
  private readonly database: Kysely<ChatDatabase>

  public constructor(
    private readonly databaseProvider: ZetroDatabase,
    private readonly legacyFilePath: string,
    private readonly defaultProjectId: string,
  ) {
    this.database = databaseProvider.forModule<ChatDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.chat.api', chatMigrations)
    const rows = await this.database.selectFrom('zetro_chat_conversations').select('data').execute()
    this.conversations = rows.map(({ data }) => JSON.parse(data) as ChatConversation)
    if (this.conversations.length > 0) return
    try {
      const stored = JSON.parse(await readFile(this.legacyFilePath, 'utf8')) as LegacyConversation[]
      this.conversations = stored.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) => ({
          ...message,
          createdAt: message.createdAt ?? conversation.createdAt,
        })),
        projectId: conversation.projectId ?? this.defaultProjectId,
      }))
      for (const conversation of this.conversations) await this.insert(conversation)
    } catch (error) {
      if (!isMissingFile(error)) throw error
      return
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
    if (index === -1) await this.insert(conversation)
    else {
      await this.database
        .updateTable('zetro_chat_conversations')
        .set(toRow(conversation))
        .where('id', '=', conversation.id)
        .execute()
    }
  }

  public async delete(conversationId: string): Promise<void> {
    this.conversations = this.conversations.filter(
      (conversation) => conversation.id !== conversationId,
    )
    await this.database
      .deleteFrom('zetro_chat_conversations')
      .where('id', '=', conversationId)
      .execute()
  }

  public async deleteArchived(projectId: string): Promise<number> {
    const currentCount = this.conversations.length
    this.conversations = this.conversations.filter(
      (conversation) => conversation.projectId !== projectId || !conversation.archivedAt,
    )
    await this.database
      .deleteFrom('zetro_chat_conversations')
      .where('project_id', '=', projectId)
      .where('archived_at', 'is not', null)
      .execute()
    return currentCount - this.conversations.length
  }

  private async insert(conversation: ChatConversation): Promise<void> {
    await this.database.insertInto('zetro_chat_conversations').values(toRow(conversation)).execute()
  }
}

function toRow(conversation: ChatConversation) {
  return {
    archived_at: conversation.archivedAt ?? null,
    data: JSON.stringify(conversation),
    id: conversation.id,
    pinned: conversation.pinned ? 1 : 0,
    project_id: conversation.projectId,
    updated_at: conversation.updatedAt,
  }
}

function compareConversations(left: ChatConversation, right: ChatConversation): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
  return right.updatedAt.localeCompare(left.updatedAt)
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
