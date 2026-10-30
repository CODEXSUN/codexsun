import { sql, type Kysely } from "kysely";
import { EnquiryRepository } from "./enquiry.repository.js";
import type { EnquiryDatabase } from "./enquiry.types.js";

export async function lookupAssignedEnquirySummary(input: {
  database: Kysely<EnquiryDatabase>;
  actorEmail: string;
  actorUserId: number | null;
}) {
  const date = await sql<{
    today: string;
  }>`SELECT DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') today`.execute(input.database);
  const asOf = date.rows[0]?.today;
  if (!asOf) throw new Error("CRM database date is unavailable.");
  const summary = await new EnquiryRepository(input.database).summary(
    {
      actorEmail: input.actorEmail,
      actorUserId: input.actorUserId,
      canViewAll: false
    },
    asOf
  );
  return { asOf, ...summary.assigned };
}
