import { z } from "zod"

export const dashStringField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value?.trim() || "-")

export const defaultUnknownIdField = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value?.trim() || "1")

export const sharedAddressFields = {
  addressTypeId: z.string().nullable(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable(),
  cityId: z.string().nullable(),
  districtId: z.string().nullable(),
  stateId: z.string().nullable(),
  countryId: z.string().nullable(),
  pincodeId: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
} as const

export const sharedAddressInputFields = {
  addressTypeId: defaultUnknownIdField,
  addressLine1: dashStringField,
  addressLine2: dashStringField,
  cityId: defaultUnknownIdField,
  districtId: defaultUnknownIdField,
  stateId: defaultUnknownIdField,
  countryId: defaultUnknownIdField,
  pincodeId: defaultUnknownIdField,
  latitude: z.number().finite().nullable().optional().default(null),
  longitude: z.number().finite().nullable().optional().default(null),
  isDefault: z.boolean().optional().default(false),
} as const
