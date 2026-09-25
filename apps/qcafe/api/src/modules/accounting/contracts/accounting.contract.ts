import { z } from "zod";

export const accountingScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const generateJournalSchema = z.object({
  sourceId: z.string().uuid(),
  sourceType: z.enum(["bill", "payment", "refund", "voucher-issue", "voucher-apply"]),
});

export const journalIdSchema = z.object({ journalId: z.string().uuid() });

export const exportJournalsSchema = accountingScopeSchema.extend({
  fromDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional(),
  status: z.enum(["draft", "posted"]).default("posted"),
  toDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional(),
});

export const accountingWorkspaceSchema = z.object({
  accounts: z.array(z.record(z.unknown())),
  journalLines: z.array(z.record(z.unknown())),
  journals: z.array(z.record(z.unknown())),
});

export type AccountingScope = z.infer<typeof accountingScopeSchema>;
export type GenerateJournal = z.infer<typeof generateJournalSchema>;
