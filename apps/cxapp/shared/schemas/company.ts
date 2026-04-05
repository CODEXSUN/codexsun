import { z } from "zod"
import {
  dashStringField,
  sharedAddressFields,
  sharedAddressInputFields,
} from "../../../core/shared/schemas/address-book.js"

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
  ...sharedAddressFields,
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
  shortAbout: z.string().nullable(),
  longAbout: z.string().nullable(),
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
  isPrimary: z.boolean(),
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
  ...sharedAddressInputFields,
})

export const companyEmailInputSchema = z.object({
  email: dashStringField,
  emailType: dashStringField,
})

export const companyPhoneInputSchema = z.object({
  phoneNumber: dashStringField,
  phoneType: dashStringField,
  isPrimary: z.boolean().optional().default(false),
})

export const companyBankAccountInputSchema = z.object({
  bankName: dashStringField,
  accountNumber: dashStringField,
  accountHolderName: dashStringField,
  ifsc: dashStringField,
  branch: dashStringField,
  isPrimary: z.boolean().optional().default(false),
})

export const companyUpsertPayloadSchema = z.object({
  name: z.string().trim().min(2),
  legalName: dashStringField,
  tagline: dashStringField,
  shortAbout: dashStringField,
  longAbout: dashStringField,
  registrationNumber: dashStringField,
  pan: dashStringField,
  financialYearStart: dashStringField,
  booksStart: dashStringField,
  website: dashStringField,
  description: dashStringField,
  facebookUrl: dashStringField,
  twitterUrl: dashStringField,
  instagramUrl: dashStringField,
  youtubeUrl: dashStringField,
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  logos: z.array(companyLogoInputSchema).default([]),
  addresses: z.array(companyAddressInputSchema).default([]),
  emails: z.array(companyEmailInputSchema).default([]),
  phones: z.array(companyPhoneInputSchema).default([]),
  bankAccounts: z.array(companyBankAccountInputSchema).default([]),
})

export const companyBrandProfileSchema = z.object({
  companyId: z.string().min(1),
  brandName: z.string().min(1),
  legalName: z.string().nullable(),
  tagline: z.string().nullable(),
  shortAbout: z.string().nullable(),
  longAbout: z.string().nullable(),
  website: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  primaryPhone: z.string().nullable(),
  logoUrl: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
})

export const companyBrandProfileResponseSchema = z.object({
  item: companyBrandProfileSchema,
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
export type CompanyBrandProfile = z.infer<typeof companyBrandProfileSchema>
export type CompanyBrandProfileResponse = z.infer<typeof companyBrandProfileResponseSchema>
