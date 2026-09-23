import { createHmac, timingSafeEqual } from "node:crypto";

export type LeasePayload = { assignmentId: string; audience: "cxforge" | "zxa"; correlationId: string; expiresAt: string; revision: number; serverId?: string };

export function signLease(payload: LeasePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}

export function verifyLease(token: string, secret: string, audience: LeasePayload["audience"]): LeasePayload | undefined {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return undefined;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const supplied = Buffer.from(signature);
  const actual = Buffer.from(expected);
  if (supplied.length !== actual.length || !timingSafeEqual(supplied, actual)) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LeasePayload;
    return payload.audience === audience && Date.parse(payload.expiresAt) > Date.now() ? payload : undefined;
  } catch { return undefined; }
}
