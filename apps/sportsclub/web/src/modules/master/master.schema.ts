import { z } from "zod";

export const masterSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(120),
  title: z.string().trim().min(2, "Title or designation is required").max(120),
  biography: z.string().nullable().optional(),
  phone: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val.trim()), {
      message: "Phone number must be 10 digits"
    }),
  email: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email format"
    }),
  specialization: z.string().trim().min(2, "Specialization is required"),
  experienceYears: z.number().nullable().optional(),
  isApprovedPublic: z.boolean().default(false),
  status: z.enum(["active", "inactive"])
});

export type MasterSchemaType = z.infer<typeof masterSchema>;
