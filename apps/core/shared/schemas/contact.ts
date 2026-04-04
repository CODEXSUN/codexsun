import { z } from "zod"
import {
  dashStringField,
  sharedAddressFields,
  sharedAddressInputFields,
} from "./address-book.js"

export const contactAddressSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  ...sharedAddressFields,
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
  code: z.string().min(1),
  contactTypeId: z.string().trim().min(1).nullable().default(null),
  ledgerId: z.string().trim().min(1).nullable().default(null),
  ledgerName: z.string().trim().min(1).nullable().default(null),
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
  ...sharedAddressInputFields,
})

export const contactEmailInputSchema = z.object({
  email: dashStringField,
  emailType: dashStringField,
  isPrimary: z.boolean().optional().default(false),
})

export const contactPhoneInputSchema = z.object({
  phoneNumber: dashStringField,
  phoneType: dashStringField,
  isPrimary: z.boolean().optional().default(false),
})

export const contactBankAccountInputSchema = z.object({
  bankName: dashStringField,
  accountNumber: dashStringField,
  accountHolderName: dashStringField,
  ifsc: dashStringField,
  branch: dashStringField,
  isPrimary: z.boolean().optional().default(false),
})

export const contactGstDetailInputSchema = z.object({
  gstin: dashStringField,
  state: dashStringField,
  isDefault: z.boolean().optional().default(false),
})

export const contactUpsertPayloadSchema = z
  .object({
    code: dashStringField,
    contactTypeId: z.string().trim().min(1).nullable().default(null),
    ledgerId: z.string().trim().min(1).nullable().default(null),
    ledgerName: z.string().trim().min(1).nullable().default(null),
    name: z.string().trim().min(2),
    legalName: dashStringField,
    pan: dashStringField,
    gstin: dashStringField,
    msmeType: dashStringField,
    msmeNo: dashStringField,
    openingBalance: z.number().finite().default(0),
    balanceType: dashStringField,
    creditLimit: z.number().finite().default(0),
    website: dashStringField,
    description: dashStringField,
    isActive: z.boolean().optional().default(true),
    addresses: z.array(contactAddressInputSchema).default([]),
    emails: z.array(contactEmailInputSchema).default([]),
    phones: z.array(contactPhoneInputSchema).default([]),
    bankAccounts: z.array(contactBankAccountInputSchema).default([]),
    gstDetails: z.array(contactGstDetailInputSchema).default([]),
  })
  .superRefine((value, context) => {
    if (Boolean(value.ledgerId) !== Boolean(value.ledgerName)) {
      context.addIssue({
        code: "custom",
        path: ["ledgerId"],
        message: "Ledger id and ledger name must be provided together.",
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
