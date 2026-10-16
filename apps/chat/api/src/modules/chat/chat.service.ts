import { migrateChatModule } from "./chat.migration.js";
import { ChatRepository } from "./chat.repository.js";
import { seedChatModule } from "./chat.seed.js";
import type {
  ChatChannelListFilters,
  ChatMessageListFilters,
  ChatModuleDependencies,
  ChatRealtimeEvents
} from "./chat.types.js";

const migratedDatabases = new Set<string>();

export class ChatService {
  private readonly repository = new ChatRepository();

  constructor(
    private readonly dependencies: ChatModuleDependencies,
    private readonly events?: ChatRealtimeEvents
  ) {}

  async context(request: Parameters<ChatModuleDependencies["resolveContext"]>[0]) {
    const context = await this.dependencies.resolveContext(request);
    if (!migratedDatabases.has(context.tenantDatabase)) {
      await migrateChatModule(context.database);
      await seedChatModule(context.database);
      migratedDatabases.add(context.tenantDatabase);
    }
    await context.authorize("chat.manage");
    return context;
  }

  async listUsers(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    search?: string
  ) {
    return this.repository.listUsers(await this.context(request), search);
  }

  async listChannels(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    filters: ChatChannelListFilters
  ) {
    return this.repository.listChannels(await this.context(request), filters);
  }

  async getChannel(request: Parameters<ChatModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.channelDetail(await this.context(request), id);
  }

  async createChannel(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    input: { kind: "channel" | "dm" | "group" | "broadcast"; members?: string[]; name: string }
  ) {
    return this.repository.createChannel(await this.context(request), input);
  }

  async updateChannel(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string,
    input: { name: string }
  ) {
    return this.repository.updateChannel(await this.context(request), id, input);
  }

  async suspendChannel(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    return this.repository.setChannelStatus(await this.context(request), id, "inactive");
  }

  async restoreChannel(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    return this.repository.setChannelStatus(await this.context(request), id, "active");
  }

  async forceDeleteChannel(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    return this.repository.forceDeleteChannel(await this.context(request), id);
  }

  async markRead(request: Parameters<ChatModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.markRead(await this.context(request), id);
  }

  async listMembers(request: Parameters<ChatModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.listMembers(await this.context(request), id);
  }

  async addMember(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string,
    input: { role?: "admin" | "member"; userEmail: string }
  ) {
    return this.repository.addMember(await this.context(request), id, input);
  }

  async removeMember(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string,
    memberUuid: string
  ) {
    return this.repository.removeMember(await this.context(request), id, memberUuid);
  }

  async listMessages(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    filters: ChatMessageListFilters
  ) {
    return this.repository.listMessages(await this.context(request), filters);
  }

  async listMessagesAfter(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    channelUuid: string,
    after: string,
    limit: number
  ) {
    return this.repository.listMessagesAfter(
      await this.context(request),
      channelUuid,
      after,
      limit
    );
  }

  async getMessage(request: Parameters<ChatModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.requireMessage(await this.context(request), id);
  }

  async createMessage(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    input: {
      attachments?: { base64: string; fileName: string; mimeType: string }[];
      body: string;
      channelUuid: string;
      replyToUuid?: string | undefined;
    }
  ) {
    const message = await this.repository.createMessage(await this.context(request), input);
    this.events?.messageCreated(message.channelUuid, message);
    return message;
  }

  async updateMessage(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string,
    input: { body: string }
  ) {
    const message = await this.repository.updateMessage(await this.context(request), id, input);
    this.events?.messageChanged(message.channelUuid, message);
    return message;
  }

  async suspendMessage(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    const message = await this.repository.setMessageStatus(
      await this.context(request),
      id,
      "inactive"
    );
    this.events?.messageChanged(message.channelUuid, message);
    return message;
  }

  async restoreMessage(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    const message = await this.repository.setMessageStatus(
      await this.context(request),
      id,
      "active"
    );
    this.events?.messageChanged(message.channelUuid, message);
    return message;
  }

  async forceDeleteMessage(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string
  ) {
    const context = await this.context(request);
    const before = await this.repository.requireMessage(context, id);
    const removed = await this.repository.forceDeleteMessage(context, id);
    this.events?.messageDeleted(before.channelUuid, removed.uuid);
    return removed;
  }

  async toggleReaction(
    request: Parameters<ChatModuleDependencies["resolveContext"]>[0],
    id: string,
    emoji: string
  ) {
    const message = await this.repository.toggleReaction(await this.context(request), id, emoji);
    this.events?.messageChanged(message.channelUuid, message);
    return message;
  }
}
