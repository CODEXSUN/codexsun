import { z } from "zod";
import { zetroCapabilities } from "./admin.types";

export const zetroPatternDraftSchema = z
  .object({
    serialNo: z.number().int().min(36),
    questionPattern: z.string().trim().min(3).max(500),
    queryPattern: z.string().regex(/^[a-z][a-z0-9.-]{1,99}$/u),
    limitation: z.string().trim().min(3).max(500),
    extra: z.string().trim().max(2000)
  })
  .strict();

export const zetroGrantChangeSchema = z
  .object({
    roleKey: z.string().min(1).max(100),
    capabilityKey: z.enum(zetroCapabilities),
    status: z.enum(["active", "revoked"]),
    reason: z.string().trim().min(1).max(500)
  })
  .strict();
