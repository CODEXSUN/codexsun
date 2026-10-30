import { z } from "zod";
export const tenantUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9._-]{2,79}$/,
      "Use 3–80 letters, numbers, dots, underscores or hyphens."
    )
    .optional()
    .or(z.literal(""))
    .nullable(),
  email: z.string().trim().email("A valid email is required."),
  name: z.string().trim().min(2, "User name is required.").max(180),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  roleId: z.number().int().positive("Select a role."),
  status: z.enum(["active", "inactive", "suspended"])
});
