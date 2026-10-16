import { z } from "zod";
import type { LogicxErpSchemeDraft, LogicxErpSchemeSavePayload } from "./scheme.types";

const wholeAmount = (label: string) =>
  z
    .number({ error: `Enter the ${label}.` })
    .int(`${label[0]!.toUpperCase()}${label.slice(1)} must be a whole number.`)
    .min(0, `${label[0]!.toUpperCase()}${label.slice(1)} cannot be negative.`)
    .max(2_000_000_000, `${label[0]!.toUpperCase()}${label.slice(1)} is too large.`);

export const logicxErpSchemeSchema = z
  .object({
    schemeDate: z.iso.date("Select the scheme date."),
    salesId: z.string().regex(/^[0-9a-f]{8}$/, "Select a sales invoice."),
    priority: z.enum(["high", "medium", "low"], "Select a priority."),
    supportValue: wholeAmount("support value"),
    brandId: z.number({ error: "Select a brand." }).int().positive("Select a brand."),
    description: z
      .string()
      .trim()
      .min(1, "Scheme description is required.")
      .max(255, "Scheme description must be 255 characters or fewer."),
    requestedByUserId: z
      .number({ error: "Select who requested the scheme." })
      .int()
      .positive("Select who requested the scheme."),
    approvedByUserId: z.number().int().positive().nullable(),
    claimDone: z.boolean(),
    amountRealized: wholeAmount("amount realized").nullable(),
    status: z.enum(["active", "inactive"])
  })
  .strict();

export function parseLogicxErpSchemeDraft(draft: LogicxErpSchemeDraft) {
  return logicxErpSchemeSchema.safeParse({
    schemeDate: draft.schemeDate,
    salesId: draft.salesId,
    priority: draft.priority || undefined,
    supportValue: toNumber(draft.supportValue),
    brandId: toNumber(draft.brandId),
    description: draft.description,
    requestedByUserId: toNumber(draft.requestedByUserId),
    approvedByUserId: draft.approvedByUserId ? Number(draft.approvedByUserId) : null,
    claimDone: draft.claimDone,
    amountRealized: draft.amountRealized.trim() ? toNumber(draft.amountRealized) : null,
    status: draft.status
  } satisfies Record<keyof LogicxErpSchemeSavePayload, unknown>);
}

function toNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}
