import { z } from "zod";

export const storefrontSliderSchema = z
  .object({
    actionLabel: z.string().trim().max(120),
    actionUrl: z.string().trim().max(1000),
    description: z.string().trim().max(500),
    displayOrder: z.number().int().nonnegative(),
    endsAt: z.string().nullable(),
    eyebrow: z.string().trim().max(191),
    imageUrl: z.string().trim().max(1000),
    ishopItem: z.string().trim().max(191).nullable(),
    published: z.boolean(),
    sliderCode: z.string().trim().min(1, "Slider code is required.").max(191),
    startsAt: z.string().nullable(),
    status: z.enum(["active", "inactive"]),
    title: z.string().trim().min(1, "Title is required.").max(191)
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt >= value.startsAt, {
    message: "End date must be after the start date."
  });
