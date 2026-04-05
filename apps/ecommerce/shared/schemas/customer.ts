import { z } from "zod"

import { contactAddressSchema } from "../../../core/shared/schemas/contact.js"

export const customerAccountSchema = z.object({
  id: z.string().min(1),
  authUserId: z.string().min(1).nullable().default(null),
  coreContactId: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(1),
  displayName: z.string().min(1),
  companyName: z.string().nullable(),
  gstin: z.string().nullable(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const customerProfileSchema = z.object({
  id: z.string().min(1),
  authUserId: z.string().min(1).nullable(),
  coreContactId: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(1),
  displayName: z.string().min(1),
  companyName: z.string().nullable(),
  gstin: z.string().nullable(),
  addresses: z.array(contactAddressSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const customerRegisterPayloadSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.email(),
  phoneNumber: z.string().trim().min(6),
  password: z.string().min(8),
  companyName: z.string().trim().nullable().optional().default(null),
  gstin: z.string().trim().nullable().optional().default(null),
  addressLine1: z.string().trim().min(3),
  addressLine2: z.string().trim().nullable().optional().default(null),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  pincode: z.string().trim().min(3),
})

export const customerLoginPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const customerProfileUpdatePayloadSchema = z.object({
  displayName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(6),
  companyName: z.string().trim().nullable().optional().default(null),
  gstin: z.string().trim().nullable().optional().default(null),
  addressLine1: z.string().trim().min(3),
  addressLine2: z.string().trim().nullable().optional().default(null),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  pincode: z.string().trim().min(3),
})

export type CustomerAccount = z.infer<typeof customerAccountSchema>
export type CustomerProfile = z.infer<typeof customerProfileSchema>
export type CustomerRegisterPayload = z.infer<typeof customerRegisterPayloadSchema>
export type CustomerLoginPayload = z.infer<typeof customerLoginPayloadSchema>
export type CustomerProfileUpdatePayload = z.infer<typeof customerProfileUpdatePayloadSchema>
