import { z } from "zod";
export const memberRegistration = z
  .object({
    corporateId: z.string().trim().min(1).max(120),
    name: z.string().trim().min(2).max(180),
    email: z
      .email()
      .max(180)
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(128)
      .refine((value) => value === value.trim(), "Password must not start or end with spaces."),
    companyName: z.string().trim().min(2).max(160),
    industry: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(100),
    accountType: z.enum(["seller", "association-member"]),
    associationUuid: z
      .string()
      .regex(/^[0-9a-f]{8}$/)
      .nullable(),
    membershipNumber: z.string().trim().max(80).default(""),
    consent: z.literal(true),
    website: z.literal("").default("")
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.accountType === "association-member" && !value.associationUuid)
      ctx.addIssue({
        code: "custom",
        path: ["associationUuid"],
        message: "Select your association."
      });
    if (value.accountType === "seller" && value.associationUuid)
      ctx.addIssue({
        code: "custom",
        path: ["associationUuid"],
        message: "Choose association-member registration to request membership."
      });
  });
