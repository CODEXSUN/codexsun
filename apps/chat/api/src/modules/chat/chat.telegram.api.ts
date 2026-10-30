import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { Logger, LogLevel } from "teleproto/extensions/Logger";
import { computeCheck } from "teleproto/Password";
import bigInt from "big-integer";
import type {
  TelegramClientApi,
  TelegramCredentials,
  TelegramPeer,
  TelegramRemoteDialog
} from "./chat.telegram.types.js";

export class TelegramClientFailure extends Error {
  constructor(
    public readonly kind: string,
    message: string
  ) {
    super(message);
  }
}

export class TelegramAccountApi implements TelegramClientApi {
  private readonly session: StringSession;
  private readonly client: TelegramClient;
  constructor(private readonly credentials: TelegramCredentials) {
    this.session = new StringSession(credentials.session);
    this.client = new TelegramClient(this.session, credentials.apiId, credentials.apiHash, {
      baseLogger: new Logger(LogLevel.NONE),
      connectionRetries: 1,
      // Telegram redirects sign-in to the account's data center through an RPC retry.
      requestRetries: 5,
      autoReconnect: false,
      floodSleepThreshold: 0,
      timeout: 15,
      deviceModel: "CODEXSUN",
      appVersion: "1.0"
    });
  }
  async connect() {
    await this.client.connect();
  }
  async close() {
    await this.client.destroy();
  }
  saveSession() {
    return this.session.save();
  }
  async sendCode() {
    const result = await this.client.sendCode(
      { apiId: this.credentials.apiId, apiHash: this.credentials.apiHash },
      this.credentials.phone
    );
    if (!("phoneCodeHash" in result))
      throw new TelegramClientFailure(
        "unsupported",
        "Telegram requires an additional sign-in challenge. Complete it in the official Telegram app, then try again."
      );
    return result.phoneCodeHash;
  }
  async signIn(code: string) {
    if (await this.client.isUserAuthorized()) return true;
    try {
      const result = await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: this.credentials.phone,
          phoneCodeHash: this.credentials.phoneCodeHash ?? "",
          phoneCode: code
        })
      );
      if (result instanceof Api.auth.AuthorizationSignUpRequired)
        throw new TelegramClientFailure(
          "unsupported",
          "Sign in with an existing Telegram account. Account registration is not supported here."
        );
      return true;
    } catch (error) {
      if (errorCode(error) === "SESSION_PASSWORD_NEEDED") return false;
      throw error;
    }
  }
  async password(password: string) {
    if (await this.client.isUserAuthorized()) return;
    const parameters = await this.client.invoke(new Api.account.GetPassword());
    const proof = await computeCheck(parameters, password);
    await this.client.invoke(new Api.auth.CheckPassword({ password: proof }));
  }
  async identity() {
    const user = await this.client.getMe();
    if (!(user instanceof Api.User) || user.bot)
      throw new TelegramClientFailure(
        "unsupported",
        "A regular Telegram user account is required."
      );
    return {
      id: user.id.toString(),
      label: user.username
        ? `@${user.username}`
        : [user.firstName, user.lastName].filter(Boolean).join(" ") || "Telegram account"
    };
  }
  async dialogs(): Promise<TelegramRemoteDialog[]> {
    const result: TelegramRemoteDialog[] = [];
    for (const dialog of await this.client.getDialogs({ limit: 100 })) {
      const input = dialog.inputEntity;
      if (!input || dialog.id === undefined) continue;
      const peer = serializeTelegramPeer(input);
      if (peer)
        result.push({
          key: dialog.id.toString(),
          title: dialog.title || "Telegram conversation",
          peer,
          lastMessageId: dialog.message?.id ?? 0
        });
    }
    return result;
  }
  async messages(peer: TelegramPeer, after: number) {
    const messages = await this.client.getMessages(inputPeer(peer), {
      minId: after,
      limit: 100,
      reverse: true
    });
    return messages
      .filter((message) => message instanceof Api.Message)
      .map((message) => ({
        id: message.id,
        text: message.message || "",
        sender: message.senderId?.toString() ?? "Telegram"
      }));
  }
  async send(peer: TelegramPeer, text: string, randomId: string) {
    const result = await this.client.invoke(
      new Api.messages.SendMessage({
        peer: inputPeer(peer),
        message: text,
        randomId: bigInt(randomId)
      })
    );
    if (result instanceof Api.UpdateShortSentMessage) return result.id;
    if (result instanceof Api.Updates || result instanceof Api.UpdatesCombined) {
      for (const update of result.updates) {
        if (update instanceof Api.UpdateMessageID && update.randomId?.toString() === randomId)
          return update.id;
        if (update instanceof Api.UpdateNewMessage || update instanceof Api.UpdateNewChannelMessage)
          return update.message.id;
      }
    }
    throw new TelegramClientFailure(
      "delivery",
      "Telegram delivery is pending confirmation. Retries reuse the same message identifier."
    );
  }
  async logout() {
    await this.client.invoke(new Api.auth.LogOut());
  }
}

export function telegramFailure(error: unknown): TelegramClientFailure {
  if (error instanceof TelegramClientFailure) return error;
  const code = errorCode(error);
  if (/FLOOD|WAIT/.test(code))
    return new TelegramClientFailure(
      "rate",
      "Telegram has limited requests. Wait before trying again."
    );
  if (/PHONE_CODE/.test(code))
    return new TelegramClientFailure(
      "code",
      "The sign-in code is invalid or expired. Check the code or request a new one."
    );
  if (/PASSWORD_HASH_INVALID/.test(code))
    return new TelegramClientFailure(
      "password",
      "The two-step verification password is incorrect."
    );
  if (/API_ID|API_HASH/.test(code))
    return new TelegramClientFailure(
      "credentials",
      "Telegram rejected the API ID or API hash. Check API development tools."
    );
  if (/PHONE_NUMBER_INVALID/.test(code))
    return new TelegramClientFailure(
      "phone",
      "Telegram rejected the phone number. Enter its full international format."
    );
  if (/PHONE_NUMBER_BANNED/.test(code))
    return new TelegramClientFailure(
      "phone",
      "Telegram has blocked sign-in for this phone number."
    );
  if (/PHONE_MIGRATE|NETWORK_MIGRATE|USER_MIGRATE/.test(code))
    return new TelegramClientFailure(
      "connection",
      "Telegram could not switch to your account's data center. Try signing in again."
    );
  if (/RECAPTCHA|EMAIL|UPDATE_APP|AUTH_RESTART/.test(code))
    return new TelegramClientFailure(
      "unsupported",
      "Telegram requires an additional sign-in challenge. Complete it in the official Telegram app, then try again."
    );
  if (/AUTH_KEY|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED/.test(code))
    return new TelegramClientFailure(
      "session",
      "Telegram authorization expired or was revoked. Sign in again."
    );
  return new TelegramClientFailure(
    "request",
    "Telegram could not complete the request. Check your connection and account access."
  );
}

function errorCode(error: unknown): string {
  return error && typeof error === "object" && "errorMessage" in error
    ? String(error.errorMessage)
    : "";
}
function serializeTelegramPeer(peer: Api.TypeInputPeer): TelegramPeer | null {
  if (peer instanceof Api.InputPeerUser)
    return { kind: "user", id: peer.userId.toString(), accessHash: peer.accessHash.toString() };
  if (peer instanceof Api.InputPeerChannel)
    return {
      kind: "channel",
      id: peer.channelId.toString(),
      accessHash: peer.accessHash.toString()
    };
  if (peer instanceof Api.InputPeerChat) return { kind: "chat", id: peer.chatId.toString() };
  return null;
}
function inputPeer(peer: TelegramPeer): Api.TypeInputPeer {
  if (peer.kind === "user")
    return new Api.InputPeerUser({
      userId: bigInt(peer.id),
      accessHash: bigInt(peer.accessHash ?? "0")
    });
  if (peer.kind === "channel")
    return new Api.InputPeerChannel({
      channelId: bigInt(peer.id),
      accessHash: bigInt(peer.accessHash ?? "0")
    });
  return new Api.InputPeerChat({ chatId: bigInt(peer.id) });
}
