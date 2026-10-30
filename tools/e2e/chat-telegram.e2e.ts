import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createConnection } from "mysql2/promise";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect, sql } from "kysely";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { runMigrationBatch } from "@codexsun/framework/db";
import {
  migrateChatModule,
  chatMigrationBatch,
  ChatRepository,
  type ChatRuntimeContext
} from "@codexsun/chat-api";
import { registerChatTelegramRoutes } from "../../apps/chat/api/src/modules/chat/chat.telegram.routes.js";
import { ChatTelegramRepository } from "../../apps/chat/api/src/modules/chat/chat.telegram.repository.js";
import { ChatTelegramWorker } from "../../apps/chat/api/src/modules/chat/chat.telegram.worker.js";
import {
  decryptTelegramSecret,
  telegramCredentialScope
} from "../../apps/chat/api/src/modules/chat/chat.telegram.crypto.js";
import type {
  TelegramCredentials,
  TelegramDependencies,
  TelegramClientApi,
  TelegramRemoteMessage
} from "../../apps/chat/api/src/modules/chat/chat.telegram.types.js";
import { env } from "../../apps/platform/api/src/env.js";

assert.equal(env.NODE_ENV, "development");
const name = `codexsun_test_telegram_${randomBytes(6).toString("hex")}`;
assert.match(name, /^codexsun_test_telegram_[a-f0-9]{12}$/);
const settings = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD
};
const admin = await createConnection(settings);
await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
const open = () =>
  new Kysely<Record<string, Record<string, unknown>>>({
    dialect: new MysqlDialect({ pool: createPool({ ...settings, database: name }) })
  });
let database = open();
const api = Fastify();
let enabled = true;
let permitted = true;
let authenticated = true;
let twoFactor = true;
let uncertain = false;
let rateLimited = false;
let connectFails = false;
let userId = "42";
const calls: string[] = [];
const remoteMessages: TelegramRemoteMessage[] = [{ id: 11, text: "Telegram to Chat", sender: "7" }];
const sent = new Map<string, number>();
const published: string[] = [];
const context: ChatRuntimeContext = {
  database,
  tenantDatabase: name,
  tenantId: "11111111",
  companyId: 1,
  actorEmail: "admin@test.invalid",
  authorize: async () => {
    if (!permitted) throw AppError.forbidden("Revoked.");
  }
};
let requestContext = context;
const repository = new ChatTelegramRepository();
function client(): TelegramClientApi {
  return {
    connect: async () => {
      calls.push("connect");
      if (connectFails) throw new Error("Private session rejected.");
    },
    close: async () => {},
    saveSession: () => "private-session",
    sendCode: async () => {
      calls.push("send-code");
      return "private-code-hash";
    },
    signIn: async (code) => {
      if (code !== "12345") throw { errorMessage: "PHONE_CODE_INVALID" };
      return !twoFactor;
    },
    password: async (password) => {
      if (password !== "private-password") throw { errorMessage: "PASSWORD_HASH_INVALID" };
    },
    identity: async () => ({ id: userId, label: "@regular_account" }),
    dialogs: async () => [
      {
        key: "7",
        title: "Telegram friend",
        peer: { kind: "user", id: "7", accessHash: "9" },
        lastMessageId: 10
      }
    ],
    messages: async () => remoteMessages,
    send: async (_peer, text, randomId) => {
      if (rateLimited) throw { errorMessage: "FLOOD_WAIT_60" };
      if (sent.has(randomId)) return sent.get(randomId)!;
      const id = 100 + sent.size;
      sent.set(randomId, id);
      remoteMessages.push({ id, text, sender: userId });
      if (uncertain) throw new Error("Accepted remotely but confirmation was lost.");
      return id;
    },
    logout: async () => {
      calls.push("logout");
    }
  };
}
const dependencies: TelegramDependencies = {
  secretKey: "key",
  scopes: async () => (enabled ? [context] : []),
  authorize: async () => {
    if (!permitted) throw AppError.forbidden("Revoked.");
  },
  clientFactory: client,
  enqueue: async () => {},
  registerProcessor: () => {}
};
const worker = new ChatTelegramWorker(dependencies, (_context, message) => {
  published.push(message.body);
});
async function process() {
  const account = (await repository.account(context))!;
  return worker.process(context.tenantId, account.uuid, account.operation_id);
}
async function post(path: string, payload?: object) {
  return api.inject({
    method: "POST",
    url: `/chat/telegram/${path}`,
    ...(payload ? { payload } : {})
  });
}
async function state() {
  return (await repository.account(context))!.auth_state;
}
async function secrets() {
  const row = (await repository.account(context))!;
  return decryptTelegramSecret<TelegramCredentials>(
    row.credentials_encrypted,
    "key",
    telegramCredentialScope(context.tenantId, row)
  );
}
try {
  await runMigrationBatch(database, {
    ...chatMigrationBatch,
    steps: chatMigrationBatch.steps.slice(0, 6)
  });
  const chat = new ChatRepository();
  const channel = await chat.createChannel(context, { kind: "group", name: "Telegram bridge" });
  await database
    .updateTable("chat_channels")
    .set({ uuid: "1234e999" })
    .where("id", "=", channel.id)
    .execute();
  channel.uuid = "1234e999";
  await database
    .insertInto("chat_telegram_connections")
    .values({
      uuid: "bbbbbbbb",
      channel_uuid: channel.uuid,
      company_id: 1,
      actor_email: context.actorEmail,
      bot_id: "legacy",
      bot_username: "legacy",
      chat_id: "1",
      token_encrypted: "old-bot-secret"
    })
    .execute();
  await migrateChatModule(database);
  await migrateChatModule(database);
  const legacy = await database
    .selectFrom("chat_telegram_connections")
    .selectAll()
    .where("uuid", "=", "bbbbbbbb")
    .executeTakeFirstOrThrow();
  assert.equal(legacy.status, "inactive");
  assert.equal(legacy.token_encrypted, "");
  await sql
    .raw(
      `CREATE TABLE app_permissions (id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) UNIQUE, \`key\` VARCHAR(191) UNIQUE, label VARCHAR(191), description TEXT, status VARCHAR(24), is_protected BOOLEAN)`
    )
    .execute(database);
  await sql
    .raw(`CREATE TABLE app_roles (id INT AUTO_INCREMENT PRIMARY KEY, \`key\` VARCHAR(191) UNIQUE)`)
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE app_role_permissions (id INT AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) UNIQUE, role_id INT, permission_id INT, status VARCHAR(24), is_protected BOOLEAN, UNIQUE KEY relation_unique(role_id,permission_id))`
    )
    .execute(database);
  await database.insertInto("app_roles").values({ key: "admin" }).execute();
  registerChatTelegramRoutes(api, {
    telegram: dependencies,
    resolveContext: async () => {
      if (!authenticated) throw AppError.unauthorized();
      return requestContext;
    }
  });
  authenticated = false;
  assert.equal(
    (await api.inject({ method: "GET", url: "/chat/telegram/account" })).statusCode,
    401
  );
  authenticated = true;
  assert.equal(
    (await post("account/send-code", { token: "bot-token", chatId: "1" })).statusCode,
    400
  );
  const credentials = { apiId: 1234, apiHash: "a".repeat(32), phone: "+919876543210" };
  assert.equal((await post("account/send-code", credentials)).statusCode, 200);
  assert.equal(await state(), "requesting_code");
  assert.equal(calls.length, 0, "HTTP must not invoke Telegram before its queued job.");
  await process();
  assert.equal(await state(), "awaiting_code");
  const before = calls.length;
  await process();
  assert.equal(calls.length, before, "A completed auth operation must not run twice.");
  assert.equal((await post("account/verify-code", { code: "99999" })).statusCode, 200);
  await assert.rejects(process(), /invalid or expired/);
  assert.equal(await state(), "awaiting_code");
  assert.equal((await secrets()).input, undefined);
  assert.equal((await post("account/verify-code", { code: "12345" })).statusCode, 200);
  await process();
  assert.equal(await state(), "awaiting_password");
  assert.equal((await post("account/verify-password", { password: "wrong" })).statusCode, 200);
  await assert.rejects(process(), /password is incorrect/);
  assert.equal(
    (await post("account/verify-password", { password: "private-password" })).statusCode,
    200
  );
  await process();
  assert.equal(await state(), "connected");
  const response = await api.inject({ method: "GET", url: "/chat/telegram/account" });
  assert.equal(response.json().data.accountLabel, "@regular_account");
  for (const secret of [
    credentials.apiHash,
    credentials.phone,
    "private-password",
    "private-session",
    "phoneCodeHash"
  ])
    assert.ok(!response.body.includes(secret));
  assert.equal((await secrets()).input, undefined);
  const dialogs = (await api.inject({ method: "GET", url: "/chat/telegram/dialogs" })).json().data;
  assert.equal(dialogs.length, 1);
  assert.ok(!JSON.stringify(dialogs).includes("accessHash"));
  const dialogUuid = String(dialogs[0].uuid);
  requestContext = { ...context, actorEmail: "other@test.invalid" };
  assert.equal(
    (await api.inject({ method: "GET", url: "/chat/telegram/account" })).json().data,
    null
  );
  assert.deepEqual(
    (await api.inject({ method: "GET", url: "/chat/telegram/dialogs" })).json().data,
    []
  );
  requestContext = { ...context, companyId: 2 };
  assert.equal(
    (await api.inject({ method: "GET", url: "/chat/telegram/account" })).json().data,
    null
  );
  requestContext = context;
  await assert.rejects(
    repository.requireAdmin({ ...context, actorEmail: "other@test.invalid" }, channel.uuid),
    /admins/
  );
  await chat.createMessage(context, { channelUuid: channel.uuid, body: "Old local history" });
  const link = await api.inject({
    method: "PUT",
    url: `/chat/telegram/dialogs/${dialogUuid}/link`,
    payload: { channelUuid: channel.uuid }
  });
  assert.equal(link.statusCode, 200, link.body);
  await chat.createMessage(context, { channelUuid: channel.uuid, body: "Chat to Telegram" });
  await process();
  assert.equal(sent.size, 1);
  assert.deepEqual(published, ["Telegram to Chat"]);
  await process();
  assert.equal(sent.size, 1);
  assert.equal(published.length, 1);
  const retryMessage = await chat.createMessage(context, {
    channelUuid: channel.uuid,
    body: "Retry with a stable MTProto random ID"
  });
  uncertain = true;
  await assert.rejects(process(), /could not complete/);
  assert.equal(
    (await repository.list(context)).length,
    0,
    "Failed accounts must pause new scheduled work."
  );
  uncertain = false;
  await process();
  assert.equal(sent.size, 2, "Retry must reuse the provider's deduplication ID.");
  rateLimited = true;
  await chat.createMessage(context, {
    channelUuid: channel.uuid,
    body: "Respect provider rate limits"
  });
  assert.equal((await process()).state, "rate-limited");
  assert.equal((await repository.list(context)).length, 0);
  rateLimited = false;
  assert.equal((await post("dialogs/refresh")).statusCode, 200);
  await process();
  await process();
  assert.equal(sent.size, 3);
  await assert.rejects(chat.forceDeleteMessage(context, retryMessage.uuid), /delivery history/);
  await assert.rejects(worker.process("22222222", "aaaaaaaa", "old-operation"), /activation/);
  enabled = false;
  await assert.rejects(process(), /activation/);
  enabled = true;
  permitted = false;
  await assert.rejects(process(), /could not complete/);
  permitted = true;
  const account = (await repository.account(context))!;
  assert.deepEqual(await worker.process(context.tenantId, account.uuid, "stale-operation"), {
    skipped: true
  });
  assert.ok(await repository.claim(context, account.uuid, account.operation_id));
  assert.equal((await post("dialogs/refresh")).statusCode, 409);
  await repository.release(context, account.id);
  await database
    .updateTable("chat_telegram_accounts")
    .set({
      auth_state: "awaiting_code",
      auth_expires_at: sql`DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE)`
    })
    .where("id", "=", account.id)
    .execute();
  assert.equal((await post("account/verify-code", { code: "12345" })).statusCode, 409);
  await database
    .updateTable("chat_telegram_accounts")
    .set({ auth_state: "connected" })
    .where("id", "=", account.id)
    .execute();
  assert.equal((await post("account/disconnect")).statusCode, 200);
  await process();
  assert.equal(await state(), "disconnected");
  assert.equal((await secrets()).session, "");
  assert.equal((await secrets()).apiHash, "");
  assert.deepEqual(
    (await api.inject({ method: "GET", url: "/chat/telegram/conversations" })).json().data,
    []
  );
  await database
    .updateTable("chat_telegram_accounts")
    .set({ code_requested_at: null })
    .where("id", "=", account.id)
    .execute();
  userId = "84";
  twoFactor = false;
  assert.equal((await post("account/send-code", credentials)).statusCode, 200);
  await process();
  assert.equal((await post("account/verify-code", { code: "12345" })).statusCode, 200);
  await process();
  assert.equal(
    (await repository.dialogs(context, account.uuid))[0]?.channel_uuid,
    null,
    "Changing the Telegram identity must remove old Chat links."
  );
  assert.equal((await post("account/disconnect")).statusCode, 200);
  connectFails = true;
  await assert.rejects(process(), /Disconnected locally/);
  assert.equal(await state(), "disconnected");
  assert.equal((await secrets()).session, "");
  await database.destroy();
  database = open();
  assert.equal((await repository.account({ ...context, database }))?.auth_state, "disconnected");
  console.log(
    "Telegram MTProto database integration passed: bot upgrade, queued API sign-in, code and 2FA, encrypted sessions, owner/company isolation, explicit links, two-way text sync, stable retries, revoked access, stale jobs, expiry, account switching, disconnect, and persistence."
  );
} finally {
  await api.close();
  await database.destroy();
  await admin.query(`DROP DATABASE \`${name}\``);
  await admin.end();
}
