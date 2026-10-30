import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function encryptTelegramSecret(value: unknown, secret: string, scope: string): string {
  if (!secret) throw new Error("Telegram encryption key is required.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(scope));
  const content = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), content].map((part) => part.toString("base64")).join(".");
}

export function decryptTelegramSecret<T>(value: string, secret: string, scope: string): T {
  const [iv, tag, content] = value.split(".").map((part) => Buffer.from(part, "base64"));
  if (!iv || !tag || !content || !secret) throw new Error("Telegram session could not be opened.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    createHash("sha256").update(secret).digest(),
    iv
  );
  decipher.setAAD(Buffer.from(scope));
  decipher.setAuthTag(tag);
  return JSON.parse(
    Buffer.concat([decipher.update(content), decipher.final()]).toString("utf8")
  ) as T;
}

export function telegramCredentialScope(
  tenantId: string,
  account: { uuid: string; company_id: number; actor_email: string }
) {
  return `${tenantId}:${account.company_id}:${account.actor_email}:${account.uuid}`;
}
