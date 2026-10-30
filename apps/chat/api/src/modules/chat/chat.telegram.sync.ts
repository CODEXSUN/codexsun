import { randomBytes } from "node:crypto";
import { ChatRepository } from "./chat.repository.js";
import { ChatTelegramRepository } from "./chat.telegram.repository.js";
import { encryptTelegramSecret, decryptTelegramSecret } from "./chat.telegram.crypto.js";
import type { ChatMessage, ChatRuntimeContext } from "./chat.types.js";
import type {
  TelegramAccountRow,
  TelegramClientApi,
  TelegramDialogRow,
  TelegramPeer
} from "./chat.telegram.types.js";

export class ChatTelegramSync {
  private readonly repository = new ChatTelegramRepository();
  constructor(
    private readonly secret: string,
    private readonly publish: (
      context: ChatRuntimeContext,
      message: ChatMessage
    ) => void | Promise<void>
  ) {}

  async refresh(context: ChatRuntimeContext, account: TelegramAccountRow, api: TelegramClientApi) {
    for (const remote of await api.dialogs()) {
      const existing = await context.database
        .selectFrom("chat_telegram_dialogs")
        .selectAll()
        .where("account_uuid", "=", account.uuid)
        .where("peer_key", "=", remote.key)
        .executeTakeFirst();
      const uuid = existing ? String(existing.uuid) : randomBytes(4).toString("hex");
      const values = {
        title: remote.title.slice(0, 191),
        status: "active",
        peer_encrypted: encryptTelegramSecret(
          remote.peer,
          this.secret,
          `${context.tenantId}:${account.uuid}:${uuid}`
        ),
        ...(!existing?.channel_uuid ? { last_received_id: remote.lastMessageId } : {})
      };
      if (existing)
        await context.database
          .updateTable("chat_telegram_dialogs")
          .set(values)
          .where("uuid", "=", uuid)
          .execute();
      else
        await context.database
          .insertInto("chat_telegram_dialogs")
          .values({ ...values, uuid, account_uuid: account.uuid, peer_key: remote.key })
          .execute();
    }
  }
  async run(context: ChatRuntimeContext, account: TelegramAccountRow, api: TelegramClientApi) {
    for (const dialog of await this.repository.dialogs(context, account.uuid)) {
      if (!dialog.channel_uuid) continue;
      await this.repository.requireAdmin(context, dialog.channel_uuid);
      const peer = decryptTelegramSecret<TelegramPeer>(
        dialog.peer_encrypted,
        this.secret,
        `${context.tenantId}:${account.uuid}:${dialog.uuid}`
      );
      await this.send(context, dialog, peer, api);
      await this.receive(context, dialog, peer, api);
    }
  }
  private async receive(
    context: ChatRuntimeContext,
    dialog: TelegramDialogRow,
    peer: TelegramPeer,
    api: TelegramClientApi
  ) {
    for (const remote of await api.messages(peer, Number(dialog.last_received_id))) {
      const message = await context.database.transaction().execute(async (database) => {
        const row = await database
          .selectFrom("chat_telegram_dialogs")
          .select(["last_received_id", "channel_uuid"])
          .where("uuid", "=", dialog.uuid)
          .forUpdate()
          .executeTakeFirstOrThrow();
        if (!row.channel_uuid || Number(row.last_received_id) >= remote.id) return null;
        const existing = await database
          .selectFrom("chat_telegram_account_messages")
          .select("id")
          .where("dialog_uuid", "=", dialog.uuid)
          .where("remote_message_id", "=", remote.id)
          .executeTakeFirst();
        const message =
          !existing && remote.text.trim()
            ? await new ChatRepository().createMessage(
                { ...context, database },
                { channelUuid: String(row.channel_uuid), body: remote.text },
                `telegram:${remote.sender}`
              )
            : null;
        if (message)
          await database
            .insertInto("chat_telegram_account_messages")
            .values({
              uuid: randomBytes(4).toString("hex"),
              dialog_uuid: dialog.uuid,
              local_message_id: message.id,
              remote_message_id: remote.id,
              random_id: "0",
              direction: "incoming",
              status: "sent"
            })
            .execute();
        await database
          .updateTable("chat_telegram_dialogs")
          .set({ last_received_id: remote.id })
          .where("uuid", "=", dialog.uuid)
          .execute();
        return message;
      });
      if (message) await this.publish(context, message);
    }
  }
  private async send(
    context: ChatRuntimeContext,
    dialog: TelegramDialogRow,
    peer: TelegramPeer,
    api: TelegramClientApi
  ) {
    for (const message of await this.repository.outgoing(context, dialog)) {
      const id = Number(message.id);
      if (
        message.status === "active" &&
        String(message.body).trim() &&
        !String(message.sender_email).startsWith("telegram:")
      ) {
        if (String(message.body).length > 4096)
          throw new Error("Telegram text must be 4096 characters or fewer.");
        const delivery = await this.repository.delivery(context, dialog.uuid, id);
        if (delivery.status !== "sent") {
          const remoteId = await api.send(peer, String(message.body), String(delivery.random_id));
          await context.database
            .updateTable("chat_telegram_account_messages")
            .set({ remote_message_id: remoteId, status: "sent" })
            .where("id", "=", delivery.id)
            .execute();
        }
      }
      await context.database
        .updateTable("chat_telegram_dialogs")
        .set({ last_sent_id: id })
        .where("uuid", "=", dialog.uuid)
        .execute();
    }
  }
}
