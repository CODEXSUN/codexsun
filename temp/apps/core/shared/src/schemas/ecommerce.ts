import { z } from 'zod'

export const ecommercePricingSettingsSchema = z.object({
  purchaseToSellPercent: z.number().finite().nonnegative(),
  purchaseToMrpPercent: z.number().finite().nonnegative(),
})

export const ecommercePricingSettingsResponseSchema = z.object({
  settings: ecommercePricingSettingsSchema,
})

export const ecommercePricingSettingsUpdatePayloadSchema = ecommercePricingSettingsSchema

export type EcommercePricingSettings = z.infer<typeof ecommercePricingSettingsSchema>
export type EcommercePricingSettingsResponse = z.infer<typeof ecommercePricingSettingsResponseSchema>
export type EcommercePricingSettingsUpdatePayload = z.infer<typeof ecommercePricingSettingsUpdatePayloadSchema>
