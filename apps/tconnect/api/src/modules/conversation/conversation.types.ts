import { z } from "zod";
const id = z.string().regex(/^[0-9a-f]{8}$/);
export const conversationInput = z
  .object({
    requirementUuid: id.nullable().default(null),
    inquiryUuid: id.nullable().default(null)
  })
  .strict()
  .refine(
    (value) => Boolean(value.requirementUuid) !== Boolean(value.inquiryUuid),
    "Choose exactly one requirement or enquiry."
  );
export const conversationRecord = z.object({
  uuid: id,
  buyerUuid: id,
  companyUuid: id,
  requirementUuid: id.nullable(),
  inquiryUuid: id.nullable(),
  sellerName: z.string(),
  buyerBusiness: z.string(),
  subject: z.string(),
  updatedAt: z.string()
});
export type ConversationRecord = z.infer<typeof conversationRecord>;
export type ConversationInput = z.infer<typeof conversationInput>;
