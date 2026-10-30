import { approvedCaptureUrl } from "./enquiry.marketing-render.js";
import { z } from "zod";
type ForwardRow = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  consented_at: string;
};
type ForwardRepository = {
  marketingPending(now: number): ForwardRow[] | Promise<ForwardRow[]>;
  marketingDelivered(reference: string, receipt: string): void | Promise<void>;
  marketingFailed(reference: string, now: number): void | Promise<void>;
};
export async function forwardSiteEnquiries(
  repository: ForwardRepository,
  destination: string,
  origin: string,
  siteUuid: string,
  send: typeof fetch = fetch
) {
  if (!destination) return { sent: 0, failed: 0 };
  const url = approvedCaptureUrl(destination);
  if (!/^[a-f0-9]{8}$/.test(siteUuid) || new URL(origin).origin !== origin)
    throw new Error("Invalid source publication identity.");
  let sent = 0,
    failed = 0;
  for (const row of await repository.marketingPending(Date.now())) {
    try {
      const response = await send(url.toString(), {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({
          sourceKey: "sites:" + siteUuid + ":" + row.reference,
          name: row.name,
          email: row.email,
          phone: row.phone,
          message: row.message,
          privacyConsent: true,
          sourceReference: row.reference,
          sourceConsentAt: row.consented_at,
          sourceNoticeVersion: "unknown",
          website: ""
        })
      });
      if (!response.ok) throw new Error("Capture endpoint rejected forwarding.");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Missing capture receipt.");
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 8192) {
          await reader.cancel();
          throw new Error("Capture receipt is too large.");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const result = z
        .object({
          success: z.literal(true),
          data: z.object({
            received: z.literal(true),
            reference: z.string().regex(/^[a-f0-9]{8}$/)
          })
        })
        .parse(JSON.parse(new TextDecoder().decode(bytes)));
      await repository.marketingDelivered(row.reference, result.data.reference);
      sent++;
    } catch {
      await repository.marketingFailed(row.reference, Date.now());
      failed++;
    }
  }
  return { sent, failed };
}
