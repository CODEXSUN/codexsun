import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type {
  ChatAttachment,
  ChatAttachmentPayload,
  ChatChannel,
  ChatChannelDetail,
  ChatChannelListFilters,
  ChatMember,
  ChatMemberRole,
  ChatMessage,
  ChatMessageListFilters,
  ChatRuntimeContext,
  ChatStatus,
  ChatUserOption
} from "./chat.types.js";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export const CHAT_REACTION_EMOJIS: readonly string[] = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export class ChatRepository {
  async listUsers(context: ChatRuntimeContext, search?: string): Promise<ChatUserOption[]> {
    let query = sql<{
      email: string;
      name: string | null;
    }>`SELECT email, name FROM app_users WHERE status = 'active'`;
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = sql<{
        email: string;
        name: string | null;
      }>`SELECT email, name FROM app_users WHERE status = 'active' AND (LOWER(email) LIKE ${term} OR LOWER(name) LIKE ${term}) ORDER BY name ASC LIMIT 100`;
    } else {
      query = sql<{
        email: string;
        name: string | null;
      }>`SELECT email, name FROM app_users WHERE status = 'active' ORDER BY name ASC LIMIT 100`;
    }
    const rows = await query.execute(context.database);
    return rows.rows.map((row) => ({
      email: String(row.email),
      name: String(row.name || row.email)
    }));
  }

  async listChannels(context: ChatRuntimeContext, filters: ChatChannelListFilters) {
    let query = context.database
      .selectFrom("chat_channels")
      .selectAll()
      .where("company_id", "=", context.companyId)
      .where(
        sql<boolean>`EXISTS (SELECT 1 FROM chat_channel_members member WHERE member.channel_id=chat_channels.id AND member.company_id=${context.companyId} AND member.user_email=${context.actorEmail.toLowerCase()} AND member.status='active')`
      );
    if (filters.search?.trim()) {
      query = query.where("name", "like", `%${filters.search.trim()}%`);
    }
    const rows = await query
      .orderBy("updated_at", "desc")
      .limit(filters.limit ?? 100)
      .execute();
    const unread = await this.unreadByChannel(context);
    const channels: ChatChannel[] = [];
    for (const row of rows) channels.push(await this.toChannel(context, row, unread));
    return channels;
  }

  async requireChannel(context: ChatRuntimeContext, idOrUuid: string): Promise<ChatChannel> {
    const row = await this.findChannelRow(context, idOrUuid);
    if (!row) throw AppError.notFound("Chat channel was not found.");
    const member = await this.findMemberRow(
      context,
      Number(row.id),
      context.actorEmail.toLowerCase()
    );
    if (!member || member.status !== "active")
      throw AppError.forbidden("Channel membership is required.");
    return this.toChannel(context, row);
  }

  async channelDetail(context: ChatRuntimeContext, idOrUuid: string): Promise<ChatChannelDetail> {
    const channel = await this.requireChannel(context, idOrUuid);
    const [messages, members] = await Promise.all([
      this.listMessages(context, { channelUuid: channel.uuid }),
      this.listMembers(context, channel.uuid)
    ]);
    return { channel, members, messages };
  }

  async createChannel(
    context: ChatRuntimeContext,
    input: { kind: ChatChannel["kind"]; members?: string[]; name: string }
  ): Promise<ChatChannel> {
    const name = normalizeChannelName(input.name);
    const invited = normalizeMemberEmails(input.members ?? []);
    if (input.kind === "dm") {
      if (invited.length !== 1 || invited[0] === context.actorEmail.toLowerCase()) {
        throw AppError.validation("Direct chats need exactly one other participant.");
      }
    }
    const result = await context.database
      .insertInto("chat_channels")
      .values({
        company_id: context.companyId,
        created_by: context.actorEmail,
        kind: input.kind,
        name,
        status: "active",
        updated_by: context.actorEmail,
        uuid: publicUuid()
      })
      .executeTakeFirst();
    const channel = await this.requireChannelById(context, Number(result.insertId));
    await this.addMemberRow(context, channel.id, context.actorEmail, "admin");
    for (const email of invited) {
      if (email !== context.actorEmail.toLowerCase()) {
        await this.addMemberRow(context, channel.id, email, "member");
      }
    }
    return this.requireChannelById(context, channel.id);
  }

  async updateChannel(
    context: ChatRuntimeContext,
    idOrUuid: string,
    input: { name: string }
  ): Promise<ChatChannel> {
    const channel = await this.requireChannel(context, idOrUuid);
    await this.requireAdmin(context, channel.id);
    const name = normalizeChannelName(input.name);
    await context.database
      .updateTable("chat_channels")
      .set({ name, updated_by: context.actorEmail })
      .where("id", "=", channel.id)
      .execute();
    return this.requireChannelById(context, channel.id);
  }

  async setChannelStatus(
    context: ChatRuntimeContext,
    idOrUuid: string,
    status: ChatStatus
  ): Promise<ChatChannel> {
    const channel = await this.requireChannel(context, idOrUuid);
    await this.requireAdmin(context, channel.id);
    await context.database
      .updateTable("chat_channels")
      .set({ status, updated_by: context.actorEmail })
      .where("id", "=", channel.id)
      .execute();
    return this.requireChannelById(context, channel.id);
  }

  async forceDeleteChannel(context: ChatRuntimeContext, idOrUuid: string) {
    const channel = await this.requireChannel(context, idOrUuid);
    await this.requireAdmin(context, channel.id);
    const linkedTelegram = await context.database
      .selectFrom("chat_telegram_dialogs")
      .select("id")
      .where("channel_uuid", "=", channel.uuid)
      .executeTakeFirst();
    if (linkedTelegram)
      throw AppError.conflict("Unlink this conversation in Telegram Settings before deleting it.");
    const telegram = await context.database
      .selectFrom("chat_telegram_connections")
      .select("id")
      .where("channel_uuid", "=", channel.uuid)
      .executeTakeFirst();
    if (telegram)
      throw AppError.conflict(
        "This conversation retains Telegram connection history. Suspend it instead of deleting it."
      );
    const messageCount = await this.channelMessageCount(context, channel.id);
    if (messageCount > 0)
      throw AppError.conflict(
        `Channel cannot be deleted while it holds ${messageCount} message(s). Move or delete the messages first.`
      );
    await this.requireAdmin(context, channel.id);
    await context.database
      .deleteFrom("chat_channel_members")
      .where("channel_id", "=", channel.id)
      .execute();
    await context.database.deleteFrom("chat_channels").where("id", "=", channel.id).execute();
    return { uuid: channel.uuid };
  }

  async markRead(context: ChatRuntimeContext, idOrUuid: string): Promise<{ uuid: string }> {
    const channel = await this.requireChannel(context, idOrUuid);
    const existing = await context.database
      .selectFrom("chat_channel_reads")
      .select("id")
      .where("channel_id", "=", channel.id)
      .where("user_email", "=", context.actorEmail.toLowerCase())
      .executeTakeFirst();
    if (existing) {
      await context.database
        .updateTable("chat_channel_reads")
        .set({
          last_read_at: sql`CURRENT_TIMESTAMP`,
          updated_by: context.actorEmail
        })
        .where("id", "=", Number(existing.id))
        .execute();
    } else {
      await context.database
        .insertInto("chat_channel_reads")
        .values({
          channel_id: channel.id,
          company_id: context.companyId,
          created_by: context.actorEmail,
          last_read_at: sql`CURRENT_TIMESTAMP`,
          status: "active",
          updated_by: context.actorEmail,
          user_email: context.actorEmail.toLowerCase(),
          uuid: publicUuid()
        })
        .execute();
    }
    return { uuid: channel.uuid };
  }

  async listMembers(context: ChatRuntimeContext, channelUuid: string): Promise<ChatMember[]> {
    const channel = await this.requireChannel(context, channelUuid);
    const rows = await context.database
      .selectFrom("chat_channel_members")
      .selectAll()
      .where("channel_id", "=", channel.id)
      .orderBy("created_at", "asc")
      .execute();
    return rows.map(toMember);
  }

  async addMember(
    context: ChatRuntimeContext,
    channelUuid: string,
    input: { role?: ChatMemberRole; userEmail: string }
  ): Promise<ChatMember> {
    const channel = await this.requireChannel(context, channelUuid);
    await this.requireAdmin(context, channel.id);
    const userEmail = input.userEmail.trim().toLowerCase();
    if (!userEmail) throw AppError.validation("Member email is required.");
    const existing = await this.findMemberRow(context, channel.id, userEmail);
    if (existing) throw AppError.conflict("User is already a channel member.");
    await this.addMemberRow(context, channel.id, userEmail, input.role ?? "member");
    const created = await this.findMemberRow(context, channel.id, userEmail);
    if (!created) throw AppError.notFound("Channel member was not found.");
    return toMember(created);
  }

  async removeMember(
    context: ChatRuntimeContext,
    channelUuid: string,
    memberUuid: string
  ): Promise<{ uuid: string }> {
    const channel = await this.requireChannel(context, channelUuid);
    await this.requireAdmin(context, channel.id);
    const row = await context.database
      .selectFrom("chat_channel_members")
      .selectAll()
      .where("channel_id", "=", channel.id)
      .where("uuid", "=", memberUuid)
      .executeTakeFirst();
    if (!row) throw AppError.notFound("Channel member was not found.");
    if (row.role === "admin") {
      const admins = await this.adminCount(context, channel.id);
      if (admins <= 1)
        throw AppError.conflict(
          "A channel needs at least one admin. Promote another member first."
        );
    }
    await context.database
      .deleteFrom("chat_channel_members")
      .where("id", "=", Number(row.id))
      .execute();
    return { uuid: String(row.uuid) };
  }

  async listMessages(context: ChatRuntimeContext, filters: ChatMessageListFilters) {
    const channel = await this.requireChannel(context, filters.channelUuid);
    const rows = await context.database
      .selectFrom("chat_messages")
      .selectAll()
      .where("channel_id", "=", channel.id)
      .orderBy("created_at", "desc")
      .limit(filters.limit ?? 100)
      .execute();
    const messages: ChatMessage[] = [];
    for (const row of rows) messages.push(await this.toMessage(context, row, channel.uuid));
    return messages.reverse();
  }

  async listMessagesAfter(
    context: ChatRuntimeContext,
    channelUuid: string,
    after: string,
    limit: number
  ): Promise<ChatMessage[]> {
    const channel = await this.requireChannel(context, channelUuid);
    const rows = await context.database
      .selectFrom("chat_messages")
      .selectAll()
      .where("channel_id", "=", channel.id)
      .where("created_at", ">", after)
      .orderBy("created_at", "asc")
      .limit(Math.min(limit, 200))
      .execute();
    const messages: ChatMessage[] = [];
    for (const row of rows) messages.push(await this.toMessage(context, row, channel.uuid));
    return messages;
  }

  async requireMessage(context: ChatRuntimeContext, idOrUuid: string): Promise<ChatMessage> {
    const row = await context.database
      .selectFrom("chat_messages as message")
      .innerJoin("chat_channels as channel", "channel.id", "message.channel_id")
      .selectAll("message")
      .select("channel.uuid as channel_uuid")
      .where("message.company_id", "=", context.companyId)
      .where((where) =>
        where.or([
          where("message.uuid", "=", idOrUuid),
          where("message.id", "=", internalChatId(idOrUuid))
        ])
      )
      .executeTakeFirst();
    if (!row) throw AppError.notFound("Chat message was not found.");
    await this.requireChannel(context, String(row.channel_uuid));
    return this.toMessage(context, row, String(row.channel_uuid));
  }

  async createMessage(
    context: ChatRuntimeContext,
    input: {
      attachments?: ChatAttachmentPayload[];
      body: string;
      channelUuid: string;
      replyToUuid?: string | undefined;
    },
    senderEmail = context.actorEmail
  ): Promise<ChatMessage> {
    const channel = await this.requireChannel(context, input.channelUuid);
    if (channel.kind === "broadcast") {
      await this.requireAdmin(context, channel.id);
    }
    const body = input.body.trim();
    const files = (input.attachments ?? []).map(validateAttachmentInput);
    if (!body && files.length === 0) throw AppError.validation("Message body is required.");
    const replyToId = await this.resolveReplyTarget(context, channel.id, input.replyToUuid);
    const result = await context.database
      .insertInto("chat_messages")
      .values({
        body,
        channel_id: channel.id,
        company_id: context.companyId,
        created_by: context.actorEmail,
        reply_to_message_id: replyToId,
        sender_email: senderEmail,
        status: "active",
        updated_by: context.actorEmail,
        uuid: publicUuid()
      })
      .executeTakeFirst();
    const messageId = Number(result.insertId);
    for (const file of files) {
      await context.database
        .insertInto("chat_attachments")
        .values({
          company_id: context.companyId,
          content_base64: file.content,
          created_by: context.actorEmail,
          file_name: file.fileName,
          message_id: messageId,
          mime_type: file.mimeType,
          size_bytes: file.sizeBytes,
          status: "active",
          updated_by: context.actorEmail,
          uuid: publicUuid()
        })
        .execute();
    }
    const row = await context.database
      .selectFrom("chat_messages")
      .selectAll()
      .where("id", "=", messageId)
      .executeTakeFirstOrThrow(() => AppError.notFound("Chat message was not found."));
    return this.toMessage(context, row, channel.uuid);
  }

  async toggleReaction(
    context: ChatRuntimeContext,
    idOrUuid: string,
    emoji: string
  ): Promise<ChatMessage> {
    if (!CHAT_REACTION_EMOJIS.includes(emoji)) {
      throw AppError.validation("This reaction is not supported.");
    }
    const message = await this.requireMessage(context, idOrUuid);
    const userEmail = context.actorEmail.toLowerCase();
    const existing = await context.database
      .selectFrom("chat_message_reactions")
      .select("id")
      .where("message_id", "=", message.id)
      .where("user_email", "=", userEmail)
      .where("emoji", "=", emoji)
      .executeTakeFirst();
    if (existing) {
      await context.database
        .deleteFrom("chat_message_reactions")
        .where("id", "=", Number(existing.id))
        .execute();
    } else {
      await context.database
        .insertInto("chat_message_reactions")
        .values({
          company_id: context.companyId,
          created_by: context.actorEmail,
          emoji,
          message_id: message.id,
          status: "active",
          updated_by: context.actorEmail,
          user_email: userEmail,
          uuid: publicUuid()
        })
        .execute();
    }
    return this.requireMessage(context, message.uuid);
  }

  private async resolveReplyTarget(
    context: ChatRuntimeContext,
    channelId: number,
    replyToUuid: string | undefined
  ): Promise<number | null> {
    if (!replyToUuid) return null;
    const parent = await context.database
      .selectFrom("chat_messages")
      .select(["channel_id", "id"])
      .where("company_id", "=", context.companyId)
      .where("uuid", "=", replyToUuid)
      .executeTakeFirst();
    if (!parent) throw AppError.notFound("The quoted message was not found.");
    if (Number(parent.channel_id) !== channelId) {
      throw AppError.validation("Replies must quote a message from the same channel.");
    }
    return Number(parent.id);
  }

  async updateMessage(
    context: ChatRuntimeContext,
    idOrUuid: string,
    input: { body: string }
  ): Promise<ChatMessage> {
    const message = await this.requireMessage(context, idOrUuid);
    if (message.senderEmail.toLowerCase() !== context.actorEmail.toLowerCase()) {
      const channel = await this.requireChannel(context, message.channelUuid);
      await this.requireAdmin(context, channel.id);
    }
    const body = normalizeMessageBody(input.body);
    await context.database
      .updateTable("chat_messages")
      .set({
        body,
        edited_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        updated_by: context.actorEmail
      })
      .where("id", "=", message.id)
      .execute();
    return this.requireMessage(context, message.uuid);
  }

  async setMessageStatus(
    context: ChatRuntimeContext,
    idOrUuid: string,
    status: ChatStatus
  ): Promise<ChatMessage> {
    const message = await this.requireMessage(context, idOrUuid);
    if (message.senderEmail.toLowerCase() !== context.actorEmail.toLowerCase()) {
      const channel = await this.requireChannel(context, message.channelUuid);
      await this.requireAdmin(context, channel.id);
    }
    await context.database
      .updateTable("chat_messages")
      .set({ status, updated_by: context.actorEmail })
      .where("id", "=", message.id)
      .execute();
    return this.requireMessage(context, message.uuid);
  }

  async forceDeleteMessage(context: ChatRuntimeContext, idOrUuid: string) {
    const message = await this.requireMessage(context, idOrUuid);
    if (message.senderEmail.toLowerCase() !== context.actorEmail.toLowerCase()) {
      const channel = await this.requireChannel(context, message.channelUuid);
      await this.requireAdmin(context, channel.id);
    }
    const accountMessage = await context.database
      .selectFrom("chat_telegram_account_messages")
      .select("id")
      .where("local_message_id", "=", message.id)
      .executeTakeFirst();
    if (accountMessage)
      throw AppError.conflict(
        "This message retains Telegram delivery history. Suspend it instead of deleting it."
      );
    const telegram = await context.database
      .selectFrom("chat_telegram_deliveries")
      .select("id")
      .where("message_id", "=", message.id)
      .executeTakeFirst();
    if (telegram)
      throw AppError.conflict(
        "This message retains Telegram delivery history. Suspend it instead of deleting it."
      );
    await context.database
      .deleteFrom("chat_message_reactions")
      .where("message_id", "=", message.id)
      .execute();
    await context.database
      .deleteFrom("chat_attachments")
      .where("message_id", "=", message.id)
      .execute();
    await context.database.deleteFrom("chat_messages").where("id", "=", message.id).execute();
    return { uuid: message.uuid };
  }

  private async requireAdmin(context: ChatRuntimeContext, channelId: number): Promise<void> {
    const channelRow = await context.database
      .selectFrom("chat_channels")
      .select(["created_by"])
      .where("id", "=", channelId)
      .executeTakeFirst();
    if (
      channelRow &&
      String(channelRow.created_by).toLowerCase() === context.actorEmail.toLowerCase()
    )
      return;
    const membership = await this.findMemberRow(
      context,
      channelId,
      context.actorEmail.toLowerCase()
    );
    if (!membership || membership.status !== "active" || membership.role !== "admin") {
      throw AppError.forbidden("Only channel admins can perform this action.");
    }
  }

  private async adminCount(context: ChatRuntimeContext, channelId: number) {
    const row = await context.database
      .selectFrom("chat_channel_members")
      .select((select) => select.fn.count<number>("id").as("total"))
      .where("channel_id", "=", channelId)
      .where("role", "=", "admin")
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  private async addMemberRow(
    context: ChatRuntimeContext,
    channelId: number,
    userEmail: string,
    role: ChatMemberRole
  ): Promise<void> {
    await context.database
      .insertInto("chat_channel_members")
      .values({
        channel_id: channelId,
        company_id: context.companyId,
        created_by: context.actorEmail,
        role,
        status: "active",
        updated_by: context.actorEmail,
        user_email: userEmail,
        uuid: publicUuid()
      })
      .execute();
  }

  private async findMemberRow(context: ChatRuntimeContext, channelId: number, userEmail: string) {
    return context.database
      .selectFrom("chat_channel_members")
      .selectAll()
      .where("channel_id", "=", channelId)
      .where("user_email", "=", userEmail)
      .executeTakeFirst();
  }

  private async findChannelRow(context: ChatRuntimeContext, idOrUuid: string) {
    return context.database
      .selectFrom("chat_channels")
      .selectAll()
      .where("company_id", "=", context.companyId)
      .where((where) =>
        where.or([where("uuid", "=", idOrUuid), where("id", "=", internalChatId(idOrUuid))])
      )
      .executeTakeFirst();
  }

  private async unreadByChannel(context: ChatRuntimeContext): Promise<Map<number, number>> {
    const rows = await context.database
      .selectFrom("chat_messages as message")
      .leftJoin("chat_channel_reads as reads", (join) =>
        join
          .onRef("reads.channel_id", "=", "message.channel_id")
          .on("reads.user_email", "=", context.actorEmail.toLowerCase())
      )
      .select([
        "message.channel_id as channel_id",
        (select) => select.fn.count<number>("message.id").as("total")
      ])
      .where("message.company_id", "=", context.companyId)
      .where("message.status", "=", "active")
      .where("message.sender_email", "!=", context.actorEmail)
      .where(sql<boolean>`message.created_at > COALESCE(reads.last_read_at, '1970-01-01')`)
      .groupBy("message.channel_id")
      .execute();
    return new Map(rows.map((row) => [Number(row.channel_id), Number(row.total)]));
  }

  private async requireChannelById(context: ChatRuntimeContext, id: number): Promise<ChatChannel> {
    const row = await context.database
      .selectFrom("chat_channels")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow(() => AppError.notFound("Chat channel was not found."));
    return this.toChannel(context, row);
  }

  private async channelMessageCount(context: ChatRuntimeContext, channelId: number) {
    const row = await context.database
      .selectFrom("chat_messages")
      .select((select) => select.fn.count<number>("id").as("total"))
      .where("channel_id", "=", channelId)
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  private async toChannel(
    context: ChatRuntimeContext,
    row: Record<string, unknown>,
    unread: Map<number, number> = new Map()
  ): Promise<ChatChannel> {
    const last = await context.database
      .selectFrom("chat_messages")
      .select(["body", "created_at", "sender_email"])
      .where("channel_id", "=", Number(row.id))
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst();
    return {
      createdAt: iso(row.created_at),
      id: Number(row.id),
      kind:
        row.kind === "dm" || row.kind === "group" || row.kind === "broadcast"
          ? row.kind
          : "channel",
      lastMessageAt: last ? iso(last.created_at) : null,
      lastMessagePreview: last
        ? `${String(last.sender_email).split("@")[0]}: ${String(last.body).slice(0, 80)}`
        : null,
      messageCount: await this.channelMessageCount(context, Number(row.id)),
      name: String(row.name ?? ""),
      status: row.status === "inactive" ? "inactive" : "active",
      unreadCount: unread.get(Number(row.id)) ?? 0,
      updatedAt: iso(row.updated_at),
      uuid: String(row.uuid ?? "")
    };
  }

  private async toMessage(
    context: ChatRuntimeContext,
    row: Record<string, unknown>,
    channelUuid: string
  ): Promise<ChatMessage> {
    const [attachments, reactions, parent] = await Promise.all([
      context.database
        .selectFrom("chat_attachments")
        .selectAll()
        .where("message_id", "=", Number(row.id))
        .orderBy("created_at", "asc")
        .execute(),
      context.database
        .selectFrom("chat_message_reactions")
        .select(["emoji", "user_email"])
        .where("message_id", "=", Number(row.id))
        .execute(),
      row.reply_to_message_id
        ? context.database
            .selectFrom("chat_messages")
            .select(["body", "sender_email", "uuid"])
            .where("id", "=", Number(row.reply_to_message_id))
            .executeTakeFirst()
        : Promise.resolve(undefined)
    ]);
    const reactionCounts = new Map<string, { count: number; own: boolean }>();
    for (const reaction of reactions) {
      const emoji = String(reaction.emoji);
      const entry = reactionCounts.get(emoji) ?? { count: 0, own: false };
      entry.count += 1;
      if (String(reaction.user_email).toLowerCase() === context.actorEmail.toLowerCase()) {
        entry.own = true;
      }
      reactionCounts.set(emoji, entry);
    }
    return {
      attachments: attachments.map(toAttachment),
      body: String(row.body ?? ""),
      channelUuid,
      createdAt: iso(row.created_at),
      editedAt: row.edited_at ? iso(row.edited_at) : null,
      id: Number(row.id),
      reactions: [...reactionCounts.entries()].map(([emoji, summary]) => ({
        count: summary.count,
        emoji,
        own: summary.own
      })),
      reply: parent
        ? {
            body: String(parent.body ?? "").slice(0, 280),
            senderEmail: String(parent.sender_email ?? ""),
            uuid: String(parent.uuid ?? "")
          }
        : null,
      senderEmail: String(row.sender_email ?? ""),
      status: row.status === "inactive" ? "inactive" : "active",
      updatedAt: iso(row.updated_at),
      uuid: String(row.uuid ?? "")
    };
  }
}

export function normalizeChannelName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) throw AppError.validation("Channel name is required.");
  if (normalized.length > 120)
    throw AppError.validation("Channel name must be 120 characters or fewer.");
  return normalized;
}

export function normalizeMessageBody(body: string): string {
  const normalized = body.trim();
  if (!normalized) throw AppError.validation("Message body is required.");
  return normalized;
}

export function normalizeMemberEmails(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const email = value.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

export function validateAttachmentInput(input: ChatAttachmentPayload): {
  content: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
} {
  const fileName = input.fileName.trim().slice(0, 255);
  if (!fileName) throw AppError.validation("Attachment file name is required.");
  const content = input.base64.includes(",")
    ? (input.base64.split(",").at(-1) ?? "")
    : input.base64;
  const sizeBytes = Buffer.from(content, "base64").byteLength;
  if (!sizeBytes) throw AppError.validation("Attachment content is required.");
  if (sizeBytes > MAX_ATTACHMENT_BYTES)
    throw AppError.validation("Each attachment must be 15 MB or smaller.");
  return {
    content,
    fileName,
    mimeType: input.mimeType.trim() || "application/octet-stream",
    sizeBytes
  };
}

function toAttachment(row: Record<string, unknown>): ChatAttachment {
  return {
    contentBase64: String(row.content_base64 ?? ""),
    fileName: String(row.file_name ?? ""),
    id: Number(row.id),
    mimeType: String(row.mime_type ?? "application/octet-stream"),
    sizeBytes: Number(row.size_bytes ?? 0),
    uuid: String(row.uuid ?? "")
  };
}

function toMember(row: Record<string, unknown>): ChatMember {
  return {
    createdAt: iso(row.created_at),
    id: Number(row.id),
    role: row.role === "admin" ? "admin" : "member",
    status: row.status === "inactive" ? "inactive" : "active",
    userEmail: String(row.user_email ?? ""),
    uuid: String(row.uuid ?? "")
  };
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function publicUuid(): string {
  return randomBytes(4).toString("hex");
}

function internalChatId(value: string): number {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : 0;
}
