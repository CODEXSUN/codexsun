import { z } from "zod";

export const memberSchema = z.strictObject({
  email: z.string().email("A valid email is required").trim().toLowerCase().max(254),
  name: z.string().trim().min(2, "Member name must be at least 2 characters").max(160),
  phone: z.string().trim().max(32).default(""),
  dateOfBirth: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  gender: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  guardianName: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  guardianPhone: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  emergencyContact: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  medicalNotes: z.string().trim().max(1000).default(""),
  address: z.string().trim().max(255).default(""),
  programUuid: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val !== "none" && val.trim() !== "" ? val.trim() : null))
    .refine((val) => val === null || /^[a-f0-9]{8}$/.test(val), {
      message: "Program ID must be 8 hex characters"
    }),
  masterUuid: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val !== "none" && val.trim() !== "" ? val.trim() : null))
    .refine((val) => val === null || /^[a-f0-9]{8}$/.test(val), {
      message: "Master ID must be 8 hex characters"
    }),
  role: z.enum(["student", "master"]).default("student"),
  status: z.enum(["pending", "active", "suspended", "graduated"]).default("pending"),
  progressNote: z.string().trim().max(2000).default(""),
  revision: z.coerce.number().int().min(0).default(0)
});

export type MemberSchemaType = z.infer<typeof memberSchema>;
