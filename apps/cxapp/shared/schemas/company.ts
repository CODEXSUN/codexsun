import { z } from "zod"
import {
  dashStringField,
  sharedAddressFields,
  sharedAddressInputFields,
} from "../../../core/shared/schemas/address-book.js"

const colorHexField = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/)

export const defaultCompanyBrandAssetDesigner = {
  primary: {
    sourceUrl: "",
    canvasWidth: 320,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#111111",
    hoverFillColor: "#8b5e34",
  },
  dark: {
    sourceUrl: "",
    canvasWidth: 320,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#f5efe8",
    hoverFillColor: "#f0c48a",
  },
  favicon: {
    sourceUrl: "",
    canvasWidth: 64,
    canvasHeight: 64,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#8b5e34",
    hoverFillColor: "#5a3a1b",
  },
  print: {
    sourceUrl: "",
    canvasWidth: 420,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#111111",
    hoverFillColor: "#3b3b3b",
  },
} as const

export const companyBrandAssetDesignerVariantSchema = z.object({
  sourceUrl: z.string().trim(),
  canvasWidth: z.number().int().min(32).max(4096),
  canvasHeight: z.number().int().min(32).max(4096),
  offsetX: z.number().int().min(-4096).max(4096),
  offsetY: z.number().int().min(-4096).max(4096),
  scale: z.number().int().min(10).max(300),
  fillColor: colorHexField,
  hoverFillColor: colorHexField,
})

export const companyBrandAssetDesignerSchema = z.object({
  primary: companyBrandAssetDesignerVariantSchema,
  dark: companyBrandAssetDesignerVariantSchema,
  favicon: companyBrandAssetDesignerVariantSchema,
  print: companyBrandAssetDesignerVariantSchema,
})

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
  brandAssetDesigner: companyBrandAssetDesignerSchema.default(defaultCompanyBrandAssetDesigner),
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
  brandAssetDesigner: companyBrandAssetDesignerSchema.default(defaultCompanyBrandAssetDesigner),
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
  darkLogoUrl: z.string().nullable(),
  companyLogoUrl: z.string().nullable(),
  logoSource: z.enum(["published", "company", "none"]),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
})

export const companyBrandAssetPublishPayloadSchema = z.object({
  primary: companyBrandAssetDesignerVariantSchema.extend({
    sourceUrl: z.string().trim().min(1),
  }),
  dark: companyBrandAssetDesignerVariantSchema.extend({
    sourceUrl: z.string().trim().min(1),
  }),
  favicon: companyBrandAssetDesignerVariantSchema.extend({
    sourceUrl: z.string().trim().min(1),
  }),
})

export const companyBrandAssetDraftSchema = z.object({
  companyId: z.string().trim().min(1),
  designer: companyBrandAssetDesignerSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const companyBrandAssetDraftUpsertPayloadSchema = z.object({
  designer: companyBrandAssetDesignerSchema,
})

export const companyBrandAssetDraftResponseSchema = z.object({
  item: companyBrandAssetDraftSchema,
})

export const companyBrandAssetDraftReadResponseSchema = z.object({
  item: companyBrandAssetDraftSchema.nullable(),
})

export const companyBrandAssetPublishResponseSchema = z.object({
  item: z.object({
    format: z.literal("svg"),
    publishedAt: z.string().min(1),
    version: z.string().min(1),
    backupPath: z.string().nullable(),
    backupPaths: z.object({
      primary: z.string().nullable(),
      dark: z.string().nullable(),
      favicon: z.string().nullable(),
    }),
    message: z.string().min(1),
    sourceUrl: z.string().min(1),
    sourceUrls: z.object({
      primary: z.string().min(1),
      dark: z.string().min(1),
      favicon: z.string().min(1),
    }),
    publicUrl: z.string().min(1),
    publicUrls: z.object({
      primary: z.string().min(1),
      dark: z.string().min(1),
      favicon: z.string().min(1),
    }),
    mimeType: z.literal("image/svg+xml"),
  }),
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
export type CompanyBrandAssetDesignerVariant = z.infer<typeof companyBrandAssetDesignerVariantSchema>
export type CompanyBrandAssetDesigner = z.infer<typeof companyBrandAssetDesignerSchema>
export type CompanyBrandAssetPublishPayload = z.infer<typeof companyBrandAssetPublishPayloadSchema>
export type CompanyBrandAssetPublishResponse = z.infer<typeof companyBrandAssetPublishResponseSchema>
export type CompanyBrandAssetDraft = z.infer<typeof companyBrandAssetDraftSchema>
export type CompanyBrandAssetDraftUpsertPayload = z.infer<typeof companyBrandAssetDraftUpsertPayloadSchema>
export type CompanyBrandAssetDraftResponse = z.infer<typeof companyBrandAssetDraftResponseSchema>
export type CompanyBrandAssetDraftReadResponse = z.infer<typeof companyBrandAssetDraftReadResponseSchema>
