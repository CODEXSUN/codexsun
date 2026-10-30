import { z } from "zod";
export const credentialSchema = z
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
    expiresOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }, "Enter a valid date."),
    privateNotes: z.string().trim().max(4000),
    status: z.enum(["pending", "approved", "rejected", "revoked"]),
    reviewConfirmed: z.boolean()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.status === "approved" &&
      (!value.reviewConfirmed || value.expiresOn < new Date().toISOString().slice(0, 10))
    )
      ctx.addIssue({
        code: "custom",
        path: ["reviewConfirmed"],
        message: "Confirm evidence review and an unexpired validity date before approval."
      });
  });
