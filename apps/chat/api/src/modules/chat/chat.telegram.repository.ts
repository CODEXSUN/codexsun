import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { ChatRuntimeContext } from "./chat.types.js";
import type {
  TelegramAccount,
  TelegramAccountRow,
  TelegramScope,
  TelegramDialogRow
} from "./chat.telegram.types.js";

export class ChatTelegramRepository {
  async account(context: ChatRuntimeContext) {
    return (await context.database
      .selectFrom("chat_telegram_accounts")
      .selectAll()
      .where("company_id", "=", context.companyId)
      .where("actor_email", "=", context.actorEmail)
      .executeTakeFirst()) as TelegramAccountRow | undefined;
  }
  async list(scope: TelegramScope) {
    return (await scope.database
      .selectFrom("chat_telegram_accounts")
      .selectAll()
      .where("status", "=", "active")
      .where((query) =>
        query.or([query("auth_state", "!=", "connected"), query("last_error", "is", null)])
      )
      .where("auth_state", "in", [
        "connected",
        "requesting_code",
        "verifying_code",
        "verifying_password",
        "refreshing",
        "disconnecting"
      ])
      .execute()) as TelegramAccountRow[];
  }
  async claim(scope: TelegramScope, uuid: string, operationId: string) {
    const result =
      await sql`UPDATE chat_telegram_accounts SET lease_until=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
      WHERE uuid=${uuid} AND operation_id=${operationId} AND status='active'
      AND auth_state IN ('connected','requesting_code','verifying_code','verifying_password','refreshing','disconnecting')
      AND (lease_until IS NULL OR lease_until<UTC_TIMESTAMP())`.execute(scope.database);
    if (Number(result.numAffectedRows) !== 1) return undefined;
    return (await scope.database
      .selectFrom("chat_telegram_accounts")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst()) as TelegramAccountRow | undefined;
  }
  async release(scope: TelegramScope, id: number) {
    await scope.database
      .updateTable("chat_telegram_accounts")
      .set({ lease_until: null })
      .where("id", "=", id)
      .execute();
  }
  async requireIdle(context: ChatRuntimeContext, uuid: string) {
    const row = await context.database
      .selectFrom("chat_telegram_accounts")
      .select(sql<number>`lease_until > UTC_TIMESTAMP()`.as("busy"))
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    if (row?.busy) throw AppError.conflict("Wait for the current Telegram operation to finish.");
  }
  async requireAdmin(context: ChatRuntimeContext, channelUuid: string) {
    const channel = await context.database
      .selectFrom("chat_channels")
      .selectAll()
      .where("uuid", "=", channelUuid)
      .where("company_id", "=", context.companyId)
      .where("status", "=", "active")
      .executeTakeFirst();
    if (!channel) throw AppError.notFound("Active Chat conversation was not found.");
    const member = await context.database
      .selectFrom("chat_channel_members")
      .select("id")
      .where("channel_id", "=", channel.id)
      .where("user_email", "=", context.actorEmail)
      .where("role", "=", "admin")
      .where("status", "=", "active")
      .executeTakeFirst();
    if (!member && channel.created_by !== context.actorEmail)
      throw AppError.forbidden("Only conversation admins can link Telegram.");
  }
  async dialogs(context: ChatRuntimeContext, accountUuid: string) {
    return (await context.database
      .selectFrom("chat_telegram_dialogs")
      .selectAll()
      .where("account_uuid", "=", accountUuid)
      .where("status", "=", "active")
      .orderBy("title", "asc")
      .execute()) as TelegramDialogRow[];
  }
  async link(
    context: ChatRuntimeContext,
    accountUuid: string,
    dialogUuid: string,
    channelUuid: string | null
  ) {
    const dialog = (await this.dialogs(context, accountUuid)).find(
      (item) => item.uuid === dialogUuid
    );
    if (!dialog) throw AppError.notFound("Telegram conversation was not found.");
    if (dialog.channel_uuid === channelUuid) return;
    if (channelUuid) {
      await this.requireAdmin(context, channelUuid);
      const existing = await context.database
        .selectFrom("chat_telegram_dialogs")
        .select("uuid")
        .where("channel_uuid", "=", channelUuid)
        .where("uuid", "!=", dialogUuid)
        .executeTakeFirst();
      if (existing)
        throw AppError.conflict("This Chat conversation is already linked to Telegram.");
    }
    const last = channelUuid
      ? await context.database
          .selectFrom("chat_messages as message")
          .innerJoin("chat_channels as channel", "channel.id", "message.channel_id")
          .select((query) => query.fn.max<number>("message.id").as("id"))
          .where("channel.uuid", "=", channelUuid)
          .executeTakeFirst()
      : null;
    try {
      await context.database
        .updateTable("chat_telegram_dialogs")
        .set({ channel_uuid: channelUuid, last_sent_id: Number(last?.id ?? 0) })
        .where("uuid", "=", dialogUuid)
        .execute();
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY")
        throw AppError.conflict("This Chat conversation is already linked to Telegram.");
      throw error;
    }
  }
  async outgoing(context: ChatRuntimeContext, dialog: TelegramDialogRow) {
    return context.database
      .selectFrom("chat_messages as message")
      .innerJoin("chat_channels as channel", "channel.id", "message.channel_id")
      .select(["message.id", "message.body", "message.sender_email", "message.status"])
      .where("channel.uuid", "=", dialog.channel_uuid)
      .where("message.company_id", "=", context.companyId)
      .where("message.id", ">", dialog.last_sent_id)
      .orderBy("message.id", "asc")
      .limit(10)
      .execute();
  }
  async delivery(context: ChatRuntimeContext, dialogUuid: string, messageId: number) {
    let row = await context.database
      .selectFrom("chat_telegram_account_messages")
      .selectAll()
      .where("dialog_uuid", "=", dialogUuid)
      .where("local_message_id", "=", messageId)
      .executeTakeFirst();
    if (!row) {
      await context.database
        .insertInto("chat_telegram_account_messages")
        .values({
          uuid: randomBytes(4).toString("hex"),
          dialog_uuid: dialogUuid,
          local_message_id: messageId,
          direction: "outgoing",
          status: "pending",
          random_id: BigInt.asIntN(64, BigInt(`0x${randomBytes(8).toString("hex")}`)).toString()
        })
        .execute();
      row = await context.database
        .selectFrom("chat_telegram_account_messages")
        .selectAll()
        .where("dialog_uuid", "=", dialogUuid)
        .where("local_message_id", "=", messageId)
        .executeTakeFirstOrThrow();
    }
    return row;
  }
  view(row: Record<string, unknown>): TelegramAccount {
    return {
      uuid: String(row.uuid),
      apiId: Number(row.api_id),
      phoneLabel: String(row.phone_label),
      accountLabel: String(row.account_label),
      authState: String(row.auth_state),
      lastError: row.last_error ? String(row.last_error) : null,
      lastSyncedAt: row.last_synced_at ? new Date(String(row.last_synced_at)).toISOString() : null
    };
  }
}
