import { sql } from "kysely";
import type { z } from "zod";
import type { ContactPolicyContext } from "./contact-restriction.types.js";
import type { contactRestrictionSchema } from "./contact-restriction.service.js";
export async function insertEvidence(
  context: ContactPolicyContext,
  input: z.infer<typeof contactRestrictionSchema>,
  uuid: string
) {
  await sql`INSERT INTO crm_contact_restrictions(uuid,company_id,recipient,blocked,reason,created_by,created_at,updated_at) VALUES(${uuid},${context.companyId},${input.recipient},${input.blocked},${input.reason},${context.actorEmail},UTC_TIMESTAMP(),UTC_TIMESTAMP())`.execute(
    context.database
  );
}
export async function readContactRestriction(context: ContactPolicyContext, recipient: string) {
  return (
    await sql<{
      blocked: number;
    }>`SELECT blocked FROM crm_contact_restrictions WHERE company_id=${context.companyId} AND recipient=${recipient} AND channel='email' ORDER BY id DESC LIMIT 1`.execute(
      context.database
    )
  ).rows[0];
}
export async function readLegacyContactPermissions(
  context: ContactPolicyContext,
  contactIds: number[]
) {
  return (
    await sql<{
      permission: string | null;
    }>`SELECT p.communication_permission AS permission FROM contact_preferences p JOIN contact_people person ON person.id=p.person_id WHERE person.customer_contact_id IN (${sql.join(contactIds)})`.execute(
      context.database
    )
  ).rows;
}
