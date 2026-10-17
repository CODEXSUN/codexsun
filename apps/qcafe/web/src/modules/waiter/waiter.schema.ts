import { z } from "zod";
export const waiterSchema = z
  .object({
    code: z.string().trim().min(1).max(24),
    name: z.string().trim().min(1).max(100),
    status: z.enum(["active", "inactive"])
  })
  .strict();
