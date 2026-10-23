import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { ContactPolicyContext } from "./contact-restriction.types.js";
import {
  insertEvidence,
  readContactRestriction,
  readLegacyContactPermissions
} from "./contact-restriction.repository.js";
export const contactRestrictionSchema = z.strictObject({
  recipient: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  blocked: z.boolean(),
  reason: z.string().trim().min(1).max(500)
});
export async function recordContactRestriction(context: ContactPolicyContext, value: unknown) {
  await context.authorize("crm.contact-restrictions.manage");
  const input = contactRestrictionSchema.parse(value),
    uuid = randomBytes(4).toString("hex");
  await insertEvidence(context, input, uuid);
  return { uuid, ...input };
}
export async function checkContactRestrictions(
  context: ContactPolicyContext,
  recipient: string,
  contactIds: number[]
) {
  await context.authorize("crm.contact-restrictions.check");
  const normalized = z.email().max(254).parse(recipient.trim().toLowerCase());
  const current = await readContactRestriction(context, normalized);
  if (current?.blocked) return { allowed: false, reason: "do_not_contact" };
  // Legacy free-text preferences can restrict contact; they can never grant promotional consent.
  if (contactIds.length) {
    const rows = await readLegacyContactPermissions(context, contactIds);
    if (
      rows.some(
        (row) => row.permission?.trim() && row.permission.trim().toLowerCase() !== "allowed"
      )
    )
      return { allowed: false, reason: "legacy_preference_requires_review" };
  }
  return { allowed: true, reason: "no_restriction" };
}
