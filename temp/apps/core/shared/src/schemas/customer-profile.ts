import { z } from 'zod'

export const customerDeliveryAddressSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(20),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).default(''),
  cityId: z.string().trim().min(1),
  city: z.string().trim().min(1),
  stateId: z.string().trim().min(1),
  state: z.string().trim().min(1),
  countryId: z.string().trim().min(1),
  country: z.string().trim().min(1),
  postalCodeId: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  isDefault: z.boolean(),
})

export const customerProfileSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(6).max(20).nullable(),
  addresses: z.array(customerDeliveryAddressSchema),
})

export const customerProfileResponseSchema = z.object({
  profile: customerProfileSchema,
})

export const customerProfileUpdatePayloadSchema = z.object({
  displayName: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(6).max(20).nullable(),
  addresses: z.array(customerDeliveryAddressSchema),
})

export type CustomerDeliveryAddress = z.infer<typeof customerDeliveryAddressSchema>
export type CustomerProfile = z.infer<typeof customerProfileSchema>
export type CustomerProfileResponse = z.infer<typeof customerProfileResponseSchema>
export type CustomerProfileUpdatePayload = z.infer<typeof customerProfileUpdatePayloadSchema>
