import { z } from "zod";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.");
export const credentialInput = z
  .object({
    companyUuid: z.string().regex(/^[0-9a-f]{8}$/),
    kind: z.enum(["certification", "identity"]),
    standardName: z.string().trim().min(2).max(100),
    issuer: z.string().trim().min(2).max(180),
    reference: z.string().trim().min(2).max(180),
    scope: z.string().trim().min(10).max(1500),
    publicEvidenceUrl: z
      .url()
      .max(1000)
      .refine((value) => {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      }, "Use a public HTTPS evidence URL without credentials."),
    expiresOn: date,
    privateNotes: z.string().trim().max(4000),
    status: z.enum(["pending", "approved", "rejected", "revoked"]),
    reviewConfirmed: z.boolean().default(false)
  })
  .strict();
export const credentialRecord = credentialInput
  .omit({ reviewConfirmed: true })
  .extend({
    uuid: z.string(),
    companyName: z.string(),
    reviewedAt: z.string().nullable(),
    reviewedBy: z.string()
  });
export const publicCredential = credentialRecord.omit({
  privateNotes: true,
  reviewedBy: true,
  status: true,
  companyName: true
});
export type CredentialInput = z.infer<typeof credentialInput>;
export type CredentialRecord = z.infer<typeof credentialRecord>;
