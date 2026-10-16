import { z } from "zod";

export const employeeInputSchema = z
  .object({
    employeeCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9][A-Z0-9_-]{0,39}$/,
        "Enter an employee code using letters, numbers, hyphens or underscores."
      ),
    name: z.string().trim().min(1, "Employee name is required.").max(180),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.union([z.literal(""), z.email()]))
      .pipe(z.string().max(180)),
    phone: z.string().trim().max(30),
    department: z.string().trim().max(120),
    designation: z.string().trim().max(120),
    joiningDate: z.iso.date().nullable(),
    userId: z.number().int().positive().nullable(),
    notes: z.string().trim().max(5000),
    status: z.enum(["active", "inactive"])
  })
  .strict();
