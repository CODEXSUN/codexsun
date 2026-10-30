import { z } from "zod";
export const buyerRegistration = z
  .object({
    corporateId: z.string().trim().min(1).max(80),
    name: z.string().trim().min(2).max(120),
    email: z
      .email()
      .max(180)
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(128)
      .refine((value) => value === value.trim(), "Remove spaces around the password."),
    businessName: z.string().trim().min(2).max(180),
    city: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(30),
    consent: z.literal(true),
    website: z.literal("").default("")
  })
  .strict();
export const buyerRecord = buyerRegistration
  .omit({ corporateId: true, password: true, consent: true, website: true })
  .extend({ uuid: z.string(), status: z.enum(["active", "inactive"]) });
export type BuyerRecord = z.infer<typeof buyerRecord>;
