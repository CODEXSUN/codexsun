import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { FastifyRequest } from "fastify";
import { ChatService } from "./chat.service.js";
import { ChatTelegramRepository } from "./chat.telegram.repository.js";
import {
  encryptTelegramSecret,
  decryptTelegramSecret,
  telegramCredentialScope
} from "./chat.telegram.crypto.js";
import type { ChatModuleDependencies, ChatRuntimeContext } from "./chat.types.js";
import type { TelegramDependencies, TelegramCredentials } from "./chat.telegram.types.js";

export class ChatTelegramService {
  private readonly chat: ChatService;
  private readonly repository = new ChatTelegramRepository();
  constructor(
    private readonly dependencies: ChatModuleDependencies,
    private readonly telegram: TelegramDependencies
  ) {
    this.chat = new ChatService(dependencies);
  }
  async get(request: FastifyRequest) {
    const context = await this.context(request);
    const account = await this.repository.account(context);
    return account ? this.repository.view(account) : null;
  }
  async requestCode(
    request: FastifyRequest,
    input: { apiId: number; apiHash: string; phone: string }
  ) {
    const context = await this.context(request);
    await context.database.transaction().execute(async (database) => {
      const local = { ...context, database };
      const existing = await this.repository.account(local);
      if (existing) {
        await database
          .selectFrom("chat_telegram_accounts")
          .select("id")
          .where("id", "=", existing.id)
          .forUpdate()
          .execute();
        await this.repository.requireIdle(local, existing.uuid);
        if (existing.auth_state === "connected")
          throw AppError.conflict(
            "Disconnect the existing Telegram session before changing API credentials."
          );
        const recent = await database
          .selectFrom("chat_telegram_accounts")
          .select(
            sql<number>`code_requested_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND)`.as(
              "recent"
            )
          )
          .where("id", "=", existing.id)
          .executeTakeFirst();
        if (recent?.recent)
          throw AppError.conflict("Wait one minute before requesting another Telegram code.");
      }
      const uuid = existing?.uuid ?? randomBytes(4).toString("hex");
      const scope = telegramCredentialScope(context.tenantId, {
        uuid,
        company_id: context.companyId,
        actor_email: context.actorEmail
      });
      const previous = existing
        ? decryptTelegramSecret<TelegramCredentials>(
            existing.credentials_encrypted,
            this.telegram.secretKey,
            scope
          )
        : null;
      const values = {
        api_id: input.apiId,
        phone_label: `••••${input.phone.slice(-4)}`,
        auth_state: "requesting_code",
        operation_id: randomBytes(8).toString("hex"),
        auth_attempts: 0,
        last_error: null,
        credentials_encrypted: encryptTelegramSecret(
          { ...input, session: "", ...(previous?.userId ? { userId: previous.userId } : {}) },
          this.telegram.secretKey,
          scope
        ),
        code_requested_at: sql`UTC_TIMESTAMP()`,
        auth_expires_at: sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)`
      };
      if (existing)
        await database
          .updateTable("chat_telegram_accounts")
          .set(values)
          .where("id", "=", existing.id)
          .execute();
      else
        await database
          .insertInto("chat_telegram_accounts")
          .values({
            ...values,
            uuid,
            company_id: context.companyId,
            actor_email: context.actorEmail
          })
          .execute();
    });
    await this.dependencies.audit?.(
      context,
      "telegram.sign-in-requested",
      (await this.repository.account(context))!.uuid
    );
    return this.get(request);
  }
  async action(
    request: FastifyRequest,
    action: "verify-code" | "verify-password" | "refresh" | "disconnect",
    input = ""
  ) {
    const context = await this.context(request);
    await context.database.transaction().execute(async (database) => {
      const account = await this.repository.account({ ...context, database });
      if (!account) throw AppError.notFound("Configure your Telegram API credentials first.");
      const row = await database
        .selectFrom("chat_telegram_accounts")
        .selectAll()
        .where("id", "=", account.id)
        .forUpdate()
        .executeTakeFirstOrThrow();
      await this.repository.requireIdle({ ...context, database }, account.uuid);
      const expected =
        action === "verify-code"
          ? "awaiting_code"
          : action === "verify-password"
            ? "awaiting_password"
            : "connected";
      if (row.auth_state !== expected)
        throw AppError.conflict(
          "The Telegram sign-in state changed. Refresh Settings before continuing."
        );
      if (action.startsWith("verify")) {
        const valid = await database
          .selectFrom("chat_telegram_accounts")
          .select(sql<number>`auth_expires_at > UTC_TIMESTAMP()`.as("valid"))
          .where("id", "=", account.id)
          .executeTakeFirst();
        if (!valid?.valid || Number(row.auth_attempts) >= 5)
          throw AppError.conflict("This sign-in attempt expired. Request a new code.");
      }
      const credentials = decryptTelegramSecret<TelegramCredentials>(
        account.credentials_encrypted,
        this.telegram.secretKey,
        telegramCredentialScope(context.tenantId, account)
      );
      credentials.input = input;
      const state =
        action === "verify-code"
          ? "verifying_code"
          : action === "verify-password"
            ? "verifying_password"
            : action === "refresh"
              ? "refreshing"
              : "disconnecting";
      await database
        .updateTable("chat_telegram_accounts")
        .set({
          auth_state: state,
          operation_id: randomBytes(8).toString("hex"),
          credentials_encrypted: encryptTelegramSecret(
            credentials,
            this.telegram.secretKey,
            telegramCredentialScope(context.tenantId, account)
          ),
          auth_attempts: Number(row.auth_attempts) + (action.startsWith("verify") ? 1 : 0),
          last_error: null
        })
        .where("id", "=", account.id)
        .execute();
    });
    await this.dependencies.audit?.(
      context,
      `telegram.${action}`,
      (await this.repository.account(context))!.uuid
    );
    return this.get(request);
  }
  async dialogs(request: FastifyRequest) {
    const context = await this.context(request);
    const account = await this.repository.account(context);
    if (!account || account.auth_state !== "connected") return [];
    return (await this.repository.dialogs(context, account.uuid)).map((dialog) => ({
      uuid: dialog.uuid,
      title: dialog.title,
      channelUuid: dialog.channel_uuid
    }));
  }
  async conversations(request: FastifyRequest) {
    const context = await this.context(request);
    const account = await this.repository.account(context);
    if (!account || account.auth_state !== "connected") return [];
    const result = [];
    for (const dialog of await this.repository.dialogs(context, account.uuid)) {
      if (!dialog.channel_uuid) continue;
      const channel = await context.database
        .selectFrom("chat_channels")
        .select(["uuid", "name"])
        .where("uuid", "=", dialog.channel_uuid)
        .where("company_id", "=", context.companyId)
        .where("status", "=", "active")
        .executeTakeFirst();
      if (channel)
        result.push({ channelUuid: String(channel.uuid), channelName: String(channel.name) });
    }
    return result;
  }
  async link(request: FastifyRequest, dialogUuid: string, channelUuid: string | null) {
    const context = await this.context(request);
    const account = await this.repository.account(context);
    if (!account || account.auth_state !== "connected")
      throw AppError.conflict("Sign in to Telegram before linking conversations.");
    await context.database.transaction().execute(async (database) => {
      await database
        .selectFrom("chat_telegram_accounts")
        .select("id")
        .where("id", "=", account.id)
        .forUpdate()
        .execute();
      await this.repository.requireIdle({ ...context, database }, account.uuid);
      await this.repository.link({ ...context, database }, account.uuid, dialogUuid, channelUuid);
    });
    await this.dependencies.audit?.(
      context,
      channelUuid ? "telegram.conversation-linked" : "telegram.conversation-unlinked",
      dialogUuid
    );
    return { linked: channelUuid !== null };
  }
  private async context(request: FastifyRequest): Promise<ChatRuntimeContext> {
    const context = await this.chat.context(request);
    if (
      !(await this.telegram.scopes()).some(
        (scope) =>
          scope.tenantId === context.tenantId && scope.tenantDatabase === context.tenantDatabase
      )
    )
      throw AppError.forbidden("Chat must be enabled for this tenant to use Telegram.");
    return context;
  }
}
