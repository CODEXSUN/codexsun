import { z } from 'zod'

const dashString = z.string().trim().nullish().transform((value) => value?.trim() || '-')
const defaultUnknownId = z.string().trim().nullish().transform((value) => value?.trim() || '1')

export const contactAddressSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
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

export const contactEmailSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  email: z.email(),
  emailType: z.string().min(1),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const contactPhoneSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  phoneNumber: z.string().min(1),
  phoneType: z.string().min(1),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const contactBankAccountSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
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

export const contactGstDetailSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  gstin: z.string().min(1),
  state: z.string().min(1),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const contactSummarySchema = z.object({
  id: z.string().min(1),
  uuid: z.string().min(1),
  contactTypeId: z.string().min(1),
  name: z.string().min(1),
  legalName: z.string().nullable(),
  pan: z.string().nullable(),
  gstin: z.string().nullable(),
  msmeType: z.string().nullable(),
  msmeNo: z.string().nullable(),
  openingBalance: z.number(),
  balanceType: z.string().nullable(),
  creditLimit: z.number(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  primaryPhone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const contactSchema = contactSummarySchema.extend({
  addresses: z.array(contactAddressSchema),
  emails: z.array(contactEmailSchema),
  phones: z.array(contactPhoneSchema),
  bankAccounts: z.array(contactBankAccountSchema),
  gstDetails: z.array(contactGstDetailSchema),
})

export const contactAddressInputSchema = z.object({
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

export const contactEmailInputSchema = z.object({
  email: dashString,
  emailType: dashString,
  isPrimary: z.boolean().optional().default(false),
})

export const contactPhoneInputSchema = z.object({
  phoneNumber: dashString,
  phoneType: dashString,
  isPrimary: z.boolean().optional().default(false),
})

export const contactBankAccountInputSchema = z.object({
  bankName: dashString,
  accountNumber: dashString,
  accountHolderName: dashString,
  ifsc: dashString,
  branch: dashString,
  isPrimary: z.boolean().optional().default(false),
})

export const contactGstDetailInputSchema = z.object({
  gstin: dashString,
  state: dashString,
  isDefault: z.boolean().optional().default(false),
})

export const contactUpsertPayloadSchema = z.object({
  contactTypeId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  legalName: dashString,
  pan: dashString,
  gstin: dashString,
  msmeType: dashString,
  msmeNo: dashString,
  openingBalance: z.number().finite().default(0),
  balanceType: dashString,
  creditLimit: z.number().finite().default(0),
  website: dashString,
  description: dashString,
  isActive: z.boolean().optional().default(true),
  addresses: z.array(contactAddressInputSchema).default([]),
  emails: z.array(contactEmailInputSchema).default([]),
  phones: z.array(contactPhoneInputSchema).default([]),
  bankAccounts: z.array(contactBankAccountInputSchema).default([]),
  gstDetails: z.array(contactGstDetailInputSchema).default([]),
}).superRefine((value, context) => {
  if (value.contactTypeId === 'contact-type:company' && value.gstin === '-') {
    context.addIssue({
      code: 'custom',
      path: ['gstin'],
      message: 'GSTIN is required for company contacts.',
    })
  }
})

export const contactListResponseSchema = z.object({
  items: z.array(contactSummarySchema),
})

export const contactResponseSchema = z.object({
  item: contactSchema,
})

export type ContactAddress = z.infer<typeof contactAddressSchema>
export type ContactEmail = z.infer<typeof contactEmailSchema>
export type ContactPhone = z.infer<typeof contactPhoneSchema>
export type ContactBankAccount = z.infer<typeof contactBankAccountSchema>
export type ContactGstDetail = z.infer<typeof contactGstDetailSchema>
export type ContactSummary = z.infer<typeof contactSummarySchema>
export type Contact = z.infer<typeof contactSchema>
export type ContactAddressInput = z.infer<typeof contactAddressInputSchema>
export type ContactEmailInput = z.infer<typeof contactEmailInputSchema>
export type ContactPhoneInput = z.infer<typeof contactPhoneInputSchema>
export type ContactBankAccountInput = z.infer<typeof contactBankAccountInputSchema>
export type ContactGstDetailInput = z.infer<typeof contactGstDetailInputSchema>
export type ContactUpsertPayload = z.infer<typeof contactUpsertPayloadSchema>
export type ContactListResponse = z.infer<typeof contactListResponseSchema>
export type ContactResponse = z.infer<typeof contactResponseSchema>
