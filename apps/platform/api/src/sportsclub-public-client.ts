import { createHmac, timingSafeEqual } from "node:crypto";

export function verifiedSportsclubPortalClient(
  headers: Record<string, string | string[] | undefined>,
  secret: string | undefined
): string | null {
  const client = headers["x-codexsun-public-client"];
  const timestamp = headers["x-codexsun-client-time"];
  const signature = headers["x-codexsun-client-signature"];

  if (
    !secret ||
    typeof client !== "string" ||
    !/^[a-f0-9]{64}$/.test(client) ||
    typeof timestamp !== "string" ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp)) > 60000 ||
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    return null;
  }

  const expected = createHmac("sha256", secret)
    .update(`sportsclub-client.${timestamp}.${client}`)
    .digest();

  return timingSafeEqual(expected, Buffer.from(signature, "hex"))
    ? `cloudflare:${client}`
    : null;
}
