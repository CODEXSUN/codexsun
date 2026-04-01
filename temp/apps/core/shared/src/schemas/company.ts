import { z } from 'zod'

const dashString = z.string().trim().nullish().transform((value) => value?.trim() || '-')
const defaultUnknownId = z.string().trim().nullish().transform((value) => value?.trim() || '1')

export const companyLogoSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  logoUrl: z.string().min(1),
  logoType: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companyAddressSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  addressType: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable(),
  cityId: z.string().nullable(),
  stateId: z.string().nullable(),
  countryId: z.string().nullable(),
  pincodeId: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companyEmailSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  email: z.email(),
  emailType: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companyPhoneSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  phoneNumber: z.string().min(1),
  phoneType: z.string().min(1),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companyBankAccountSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountHolderName: z.string().min(1),
  ifsc: z.string().min(1),
  branch: z.string().nullable(),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companySummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  legalName: z.string().nullable(),
  tagline: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  pan: z.string().nullable(),
  financialYearStart: z.string().nullable(),
  booksStart: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  facebookUrl: z.string().nullable(),
  twitterUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  youtubeUrl: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  primaryPhone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companySchema = companySummarySchema.extend({
  logos: z.array(companyLogoSchema),
  addresses: z.array(companyAddressSchema),
  emails: z.array(companyEmailSchema),
  phones: z.array(companyPhoneSchema),
  bankAccounts: z.array(companyBankAccountSchema),
})

export const companyLogoInputSchema = z.object({
  logoUrl: z.string().trim().min(1),
  logoType: z.string().trim().min(1),
})

export const companyAddressInputSchema = z.object({
  addressType: dashString,
  addressLine1: dashString,
  addressLine2: dashString,
  cityId: defaultUnknownId,
  stateId: defaultUnknownId,
  countryId: defaultUnknownId,
  pincodeId: defaultUnknownId,
  latitude: z.number().finite().nullable().optional().default(null),
  longitude: z.number().finite().nullable().optional().default(null),
  isDefault: z.boolean().optional().default(false),
})

export const companyEmailInputSchema = z.object({
  email: dashString,
  emailType: dashString,
})

export const companyPhoneInputSchema = z.object({
  phoneNumber: dashString,
  phoneType: dashString,
  isPrimary: z.boolean().optional().default(false),
})

export const companyBankAccountInputSchema = z.object({
  bankName: dashString,
  accountNumber: dashString,
  accountHolderName: dashString,
  ifsc: dashString,
  branch: dashString,
  isPrimary: z.boolean().optional().default(false),
})

export const companyUpsertPayloadSchema = z.object({
  name: z.string().trim().min(2),
  legalName: dashString,
  tagline: dashString,
  registrationNumber: dashString,
  pan: dashString,
  financialYearStart: dashString,
  booksStart: dashString,
  website: dashString,
  description: dashString,
  facebookUrl: dashString,
  twitterUrl: dashString,
  instagramUrl: dashString,
  youtubeUrl: dashString,
  isActive: z.boolean().optional().default(true),
  logos: z.array(companyLogoInputSchema).default([]),
  addresses: z.array(companyAddressInputSchema).default([]),
  emails: z.array(companyEmailInputSchema).default([]),
  phones: z.array(companyPhoneInputSchema).default([]),
  bankAccounts: z.array(companyBankAccountInputSchema).default([]),
})

export const companyListResponseSchema = z.object({
  items: z.array(companySummarySchema),
})

export const companyResponseSchema = z.object({
  item: companySchema,
})

export type CompanyLogo = z.infer<typeof companyLogoSchema>
export type CompanyAddress = z.infer<typeof companyAddressSchema>
export type CompanyEmail = z.infer<typeof companyEmailSchema>
export type CompanyPhone = z.infer<typeof companyPhoneSchema>
export type CompanyBankAccount = z.infer<typeof companyBankAccountSchema>
export type CompanySummary = z.infer<typeof companySummarySchema>
export type Company = z.infer<typeof companySchema>
export type CompanyLogoInput = z.infer<typeof companyLogoInputSchema>
export type CompanyAddressInput = z.infer<typeof companyAddressInputSchema>
export type CompanyEmailInput = z.infer<typeof companyEmailInputSchema>
export type CompanyPhoneInput = z.infer<typeof companyPhoneInputSchema>
export type CompanyBankAccountInput = z.infer<typeof companyBankAccountInputSchema>
export type CompanyUpsertPayload = z.infer<typeof companyUpsertPayloadSchema>
export type CompanyListResponse = z.infer<typeof companyListResponseSchema>
export type CompanyResponse = z.infer<typeof companyResponseSchema>
