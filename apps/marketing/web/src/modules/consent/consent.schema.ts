import { z } from "zod";
export const consentSchema = z.strictObject({
  brandUuid: z.string().regex(/^[a-f0-9]{8}$/, "Select a brand."),
  recipient: z
    .email("Enter a valid email.")
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  channel: z.literal("email"),
  purpose: z.literal("promotional"),
  action: z.enum(["grant", "withdraw"]),
  noticeVersion: z.string().trim().min(1, "Enter the notice version.").max(80),
  evidence: z.string().trim().min(1, "Enter an evidence reference.").max(500),
  source: z.string().trim().min(1, "Enter the source.").max(160),
  occurredAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().nullable(),
  requestKey: z.string().min(8).max(80)
});
