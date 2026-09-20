import { createHmac, timingSafeEqual } from "node:crypto";

const signaturePrefix = "sha256=";

/** Creates a hex HMAC for the exact request bytes. The caller must enforce timestamp freshness and replay protection. */
export function signWebhookPayload(payload: string | Uint8Array, secret: string): string {
  if (!secret) throw new Error("Webhook signing secret is required.");
  return `${signaturePrefix}${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

/** Verifies signatures without exposing payload or secret data in errors. */
export function verifyWebhookPayload(payload: string | Uint8Array, secret: string, signature: string): boolean {
  if (!secret || !signature.startsWith(signaturePrefix)) return false;
  const expected = Buffer.from(signWebhookPayload(payload, secret).slice(signaturePrefix.length), "hex");
  const received = Buffer.from(signature.slice(signaturePrefix.length), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
