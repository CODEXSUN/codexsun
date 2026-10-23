import { sql } from "kysely";
import type { z } from "zod";
import type { MailSafetyContext } from "./suppression.types.js";
import type { mailSuppressionSchema } from "./suppression.service.js";
export async function insertEvidence(
  context: MailSafetyContext,
  input: z.infer<typeof mailSuppressionSchema>,
  uuid: string
) {
  await sql`INSERT INTO mail_suppressions(uuid,company_id,recipient,reason,evidence,created_by,created_at,updated_at) VALUES(${uuid},${context.companyId},${input.recipient},${input.reason},${input.evidence},${context.actorEmail},UTC_TIMESTAMP(),UTC_TIMESTAMP())`.execute(
    context.database
  );
}
export async function readMailSuppression(context: MailSafetyContext, recipient: string) {
  return (
    await sql<{
      reason: string;
    }>`SELECT reason FROM mail_suppressions WHERE company_id=${context.companyId} AND recipient=${recipient} ORDER BY id DESC LIMIT 1`.execute(
      context.database
    )
  ).rows[0];
}
