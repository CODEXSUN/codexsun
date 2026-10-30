import type { EnquiryRequestContext } from "./enquiry.routes.js";
import { AppError } from "@codexsun/framework/errors";

export type EnquiryWorkTarget = { source: "local"; id: number };

export async function resolveEnquiryWorkTarget(
  scope: EnquiryRequestContext,
  reference: string
): Promise<EnquiryWorkTarget> {
  if (/^\d+$/u.test(reference)) {
    const id = Number(reference);
    if (!Number.isSafeInteger(id) || id < 1)
      throw AppError.validation("Enter a valid local enquiry ID.");
    return { source: "local", id };
  }
  throw AppError.validation("Enter a valid local enquiry ID.");
}
