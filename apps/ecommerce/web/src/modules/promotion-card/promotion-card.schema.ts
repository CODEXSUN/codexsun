import { z } from "zod";

export const promotionCardSchema = z
  .object({
    actionLabel: z.string().trim().max(120),
    actionUrl: z.string().trim().max(1000),
    badge: z.string().trim().max(120),
    badgePosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]),
    badgeTint: z.string().trim().min(1).max(32),
    badgeTextColor: z.string().trim().min(1).max(32),
    description: z.string().trim().max(500),
    displayOrder: z.number().int().nonnegative(),
    endsAt: z.string().nullable(),
    eyebrow: z.string().trim().max(191),
    imageUrl: z.string().trim().max(1000),
    ishopItem: z.string().trim().max(191).nullable(),
    offerPrice: z.number().nonnegative(),
    originalPrice: z.number().nonnegative().nullable(),
    published: z.boolean(),
    promotionCode: z.string().trim().min(1, "Promotion code is required.").max(191),
    startsAt: z.string().nullable(),
    status: z.enum(["active", "inactive"]),
    title: z.string().trim().min(1, "Title is required.").max(191)
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt >= value.startsAt, {
    message: "End date must be after the start date."
  });
