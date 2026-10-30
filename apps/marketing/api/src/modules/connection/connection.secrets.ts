import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

export function sealConnection(value: string, secret: string, identity: string) {
  const key = createHash("sha256")
    .update("codexsun.marketing.v1:" + secret)
    .digest();
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(identity));
  const content = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    nonce.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    content.toString("base64url")
  ].join(".");
}

export function openConnection(value: string, secret: string, identity: string) {
  const [version, nonce, tag, content] = value.split(".");
  if (version !== "v1" || !nonce || !tag || !content)
    throw new Error("Invalid connection secret envelope.");
  const key = createHash("sha256")
    .update("codexsun.marketing.v1:" + secret)
    .digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(nonce, "base64url"));
  decipher.setAAD(Buffer.from(identity));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(content, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
