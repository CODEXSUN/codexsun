import { z } from "zod";
export const communityInput = z
  .object({
    title: z.string().trim().min(3).max(200),
    body: z.string().trim().min(10).max(5000),
    category: z.enum(["knowledge", "event", "opportunity", "announcement"]),
    associationUuid: z.string().regex(/^[0-9a-f]{8}$/),
    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    status: z.enum(["active", "inactive"]).default("active")
  })
  .strict();
export const communityRecord = communityInput.extend({ uuid: z.string().regex(/^[0-9a-f]{8}$/) });
export type CommunityInput = z.infer<typeof communityInput>;
export type CommunityRecord = z.infer<typeof communityRecord>;
