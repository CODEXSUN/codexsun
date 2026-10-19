import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .refine((val) => /^\d{10}$/.test(val), {
      message: "Phone number must be 10 digits"
    }),
  email: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email address format"
    }),
  programOfInterest: z.string().nullable().optional(),
  preferredTiming: z.string().nullable().optional(),
  message: z.string().trim().min(3, "Enquiry message must be at least 3 characters"),
  status: z.enum(["new", "contacted", "enrolled", "closed"]),
  adminNotes: z.string().nullable().optional()
});

export type EnquirySchemaType = z.infer<typeof enquirySchema>;
