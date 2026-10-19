import { z } from "zod";

export const memberSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(120),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.string().nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianRelation: z.string().nullable().optional(),
  guardianPhone: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val.trim()), {
      message: "Guardian phone must be a 10-digit number"
    }),
  emergencyContact: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val.trim()), {
      message: "Emergency contact must be a 10-digit phone number"
    }),
  address: z.string().nullable().optional(),
  currentLevel: z.string().trim().min(1, "Current level or belt is required"),
  masterUuid: z.string().nullable().optional(),
  status: z.enum(["pending", "active", "suspended"])
});

export type MemberSchemaType = z.infer<typeof memberSchema>;
