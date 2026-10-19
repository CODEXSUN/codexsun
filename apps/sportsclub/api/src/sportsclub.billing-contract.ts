/**
 * @file Billing-Facing Contract for Sportsclub
 *
 * Defines commercial schemas, fee structures, dues tracking, and
 * billing customer conversion for integration with Billing and Core.
 */

import { z } from "zod";
import type { MemberRecord } from "./modules/member/member.types.js";

export const sportsclubFeeFrequencySchema = z.enum([
  "one_time",
  "monthly",
  "quarterly",
  "annual"
]);

export const sportsclubFeeStatusSchema = z.enum([
  "pending",
  "paid",
  "partial",
  "waived"
]);

export const sportsclubFeeItemSchema = z.strictObject({
  code: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(160),
  amount: z.number().nonnegative(),
  currency: z.string().trim().default("INR"),
  frequency: sportsclubFeeFrequencySchema,
  discipline: z.string().trim().max(64)
});

export type SportsclubFeeItem = z.infer<typeof sportsclubFeeItemSchema>;

export const sportsclubFeeDuesSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/),
  studentName: z.string().trim().min(2).max(160),
  studentEmail: z.string().email().trim().toLowerCase(),
  feeItemCode: z.string().trim().max(64),
  amount: z.number().nonnegative(),
  currency: z.string().trim().default("INR"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: sportsclubFeeStatusSchema,
  paidAmount: z.number().nonnegative().default(0),
  receiptReference: z.string().nullable().default(null),
  invoiceUuid: z.string().nullable().default(null),
  notes: z.string().trim().max(1000).default("")
});

export type SportsclubFeeDues = z.infer<typeof sportsclubFeeDuesSchema>;

export const sportsclubFeeInvoiceRequestSchema = z.strictObject({
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/),
  feeItemCode: z.string().trim().max(64),
  amount: z.number().positive(),
  currency: z.string().trim().default("INR"),
  description: z.string().trim().max(500),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type SportsclubFeeInvoiceRequest = z.infer<typeof sportsclubFeeInvoiceRequestSchema>;

/**
 * Standard Sivakalai Gurukulam Fee Catalog
 */
export const defaultSportsclubFeeCatalog: SportsclubFeeItem[] = [
  {
    code: "SILAMBAM_ADMISSION",
    name: "Gurukulam Admission & Student Registration",
    amount: 1000,
    currency: "INR",
    frequency: "one_time",
    discipline: "Silambam"
  },
  {
    code: "SILAMBAM_MONTHLY_TUITION",
    name: "Monthly Silambam Training Fee",
    amount: 800,
    currency: "INR",
    frequency: "monthly",
    discipline: "Silambam"
  },
  {
    code: "SILAMBAM_WEAPONS_KIT",
    name: "Traditional Weapon Training Kit (Staff & Protection)",
    amount: 1500,
    currency: "INR",
    frequency: "one_time",
    discipline: "Silambam"
  },
  {
    code: "BELT_ASSESSMENT_FEE",
    name: "Syllabus Stage Examination & Belt Certification Fee",
    amount: 500,
    currency: "INR",
    frequency: "one_time",
    discipline: "Silambam"
  }
];

export type BillingCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string | null;
  notes: string;
  referenceId: string;
};

/**
 * Converts a student MemberRecord to a standardized Billing customer contact
 */
export function toBillingCustomer(member: MemberRecord): BillingCustomerPayload {
  const isMinor = Boolean(member.guardianName && member.guardianName.trim());
  return {
    name: member.name,
    email: member.email,
    phone: member.phone || (member.guardianPhone ?? ""),
    address: member.address,
    contactPerson: isMinor ? member.guardianName : null,
    notes: `Sportsclub Member [${member.uuid}] — ${member.role} (${member.status})`,
    referenceId: member.uuid
  };
}
