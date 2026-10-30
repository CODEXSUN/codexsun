import { z } from "zod";
export const inquiryInput = z
  .object({
    companyUuid: z.string().regex(/^[0-9a-f]{8}$/),
    buyerName: z.string().trim().min(2).max(120),
    email: z.email().max(191),
    phone: z.string().trim().min(7).max(30),
    requirement: z.string().trim().min(20).max(4000),
    quantity: z.string().trim().min(1).max(100),
    consent: z.literal(true),
    website: z.literal("").default("")
  })
  .strict();
export const inquiryRecord = inquiryInput.omit({ consent: true, website: true }).extend({
  uuid: z.string(),
  status: z.enum(["new", "contacted", "closed"]),
  canReply: z.boolean().default(false),
  createdAt: z.string()
});
export type InquiryInput = z.infer<typeof inquiryInput>;
export type InquiryRecord = z.infer<typeof inquiryRecord>;

export const buyerInquiryInput = inquiryInput
  .omit({ buyerName: true, email: true, website: true })
  .extend({
    productUuid: z
      .string()
      .regex(/^[0-9a-f]{8}$/)
      .nullable()
      .default(null),
    requirementUuid: z
      .string()
      .regex(/^[0-9a-f]{8}$/)
      .nullable()
      .default(null)
  })
  .strict();
export const sentInquiryRecord = inquiryRecord.extend({
  sellerName: z.string(),
  productUuid: z.string().nullable(),
  requirementUuid: z.string().nullable()
});
