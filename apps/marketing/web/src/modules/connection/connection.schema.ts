import { z } from "zod";
export const connectionSchema = z.strictObject({
  brandUuid: z.string().regex(/^[a-f0-9]{8}$/),
  name: z.string().trim().min(1).max(160),
  provider: z.enum([
    "facebook",
    "instagram",
    "whatsapp",
    "linkedin",
    "google",
    "threads",
    "pinterest",
    "x",
    "telegram",
    "email"
  ]),
  externalAccountId: z.string().trim().max(191).default(""),
  status: z.enum(["active", "inactive"])
});
