import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { MailSafetyContext } from "./suppression.types.js";
import { insertEvidence, readMailSuppression } from "./suppression.repository.js";
export const mailSuppressionSchema = z.strictObject({
  recipient: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  reason: z.enum(["hard_bounce", "complaint", "policy"]),
  evidence: z.string().trim().min(1).max(500)
});
export async function recordMailSuppression(context: MailSafetyContext, value: unknown) {
  await context.authorize("mail.suppression.record");
  const input = mailSuppressionSchema.parse(value),
    uuid = randomBytes(4).toString("hex");
  await insertEvidence(context, input, uuid);
  return { uuid, ...input };
}
export async function checkMailSuppression(context: MailSafetyContext, recipient: string) {
  await context.authorize("mail.suppression.check");
  const normalized = z.email().max(254).parse(recipient.trim().toLowerCase());
  const blocked = await readMailSuppression(context, normalized);
  return { allowed: !blocked, reason: blocked?.reason ?? "no_suppression" };
}
